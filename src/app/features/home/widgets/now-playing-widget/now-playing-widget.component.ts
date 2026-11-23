import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { FastAverageColor } from 'fast-average-color';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGamepad, faArrowUpRightFromSquare, faMusic } from '@fortawesome/free-solid-svg-icons';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';

import { LanyardService } from '../../../../core/services/lanyard.service';
import { LyricsService, LyricLine } from '../../../../core/services/lyrics.service';
import { Activity } from '../../../../core/models/lanyard-profile.model';
import { DiscordCdn } from '../../../../core/utils/discord-cdn';
import { Card3dDirective } from '../../../../shared/directives/card-3d.directive';
import { TileSparklesComponent } from '../../../../shared/ui/tile-sparkles/tile-sparkles.component';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';

const SPOTIFY_ID = 'spotify:1';
const DEFAULT_SEED = '#b79cf7';
/** Switch lines slightly early: matches how Spotify/Apple Music feel "on beat". */
const LYRIC_LEAD_MS = 350;
/** Gap after a line is sung before showing the ♪ interlude dots. */
const INTERLUDE_AFTER_MS = 600;
/** Minimum silence before the next line for an interlude to be worth showing. */
const INTERLUDE_MIN_GAP_MS = 1800;


function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Bento tile for live Discord presence: the Spotify track with album art,
 * progress and karaoke-style synced lyrics; otherwise the
 * current game/app with elapsed time; otherwise a friendly idle state.
 * Replaces the old floating activity player.
 */
@Component({
  selector: 'app-now-playing-widget',
  standalone: true,
  templateUrl: './now-playing-widget.component.html',
  styleUrls: ['./now-playing-widget.component.scss'],
  imports: [FontAwesomeModule, Card3dDirective, TooltipDirective, TileSparklesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NowPlayingWidgetComponent {
  private readonly lanyard = inject(LanyardService);
  private readonly lyricsService = inject(LyricsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lyricsBox = viewChild<ElementRef<HTMLElement>>('lyricsBox');
  private readonly lyricsTrack = viewChild<ElementRef<HTMLElement>>('lyricsTrack');
  private readonly fac = new FastAverageColor();

  readonly faGamepad = faGamepad;
  readonly faMusic = faMusic;
  readonly faSpotify = faSpotify;
  readonly faExternal = faArrowUpRightFromSquare;

  /** Ticks every 100ms while something with timestamps is playing. */
  readonly now = signal(Date.now());

  /** False until the first Lanyard payload arrives → show a skeleton, not "nothing playing". */
  readonly loaded = computed(() => !!this.lanyard.getLanyardData()());

  readonly activities = computed<Activity[]>(() => {
    const acts = this.lanyard.getLanyardData()()?.d?.activities ?? [];
    // Drop custom status (type 4); it's already on the profile card
    return acts.filter((a) => a.type !== 4 && a.id !== 'custom');
  });

  readonly spotify = computed(() => this.activities().find((a) => a.id === SPOTIFY_ID || a.name === 'Spotify') ?? null);
  /** What the tile features: Spotify first, else the first other activity. */
  readonly main = computed(() => this.spotify() ?? this.activities()[0] ?? null);
  /** Anything else running at the same time, shown as small chips. */
  readonly others = computed(() => this.activities().filter((a) => a !== this.main()));
  readonly isSpotify = computed(() => !!this.main() && this.main() === this.spotify());

  readonly art = computed(() => this.assetUrl(this.main(), this.main()?.assets?.large_image));
  readonly smallArt = computed(() => this.assetUrl(this.main(), this.main()?.assets?.small_image));

  readonly elapsedMs = computed(() => {
    const start = this.main()?.timestamps?.start;
    return start ? this.now() - start : 0;
  });
  readonly durationMs = computed(() => {
    const t = this.main()?.timestamps;
    return t?.start && t?.end ? t.end - t.start : 0;
  });
  readonly progress = computed(() => {
    const d = this.durationMs();
    return d ? Math.min(100, (this.elapsedMs() / d) * 100) : 0;
  });
  readonly elapsedLabel = computed(() => formatTime(Math.min(this.elapsedMs(), this.durationMs() || Infinity)));
  readonly durationLabel = computed(() => formatTime(this.durationMs()));

  readonly trackUrl = computed(() => {
    const id = this.spotify()?.sync_id;
    return id ? `https://open.spotify.com/track/${id}` : null;
  });

  // ---- Lyrics ----
  readonly lyrics = signal<LyricLine[]>([]);
  readonly lyricsState = signal<'idle' | 'loading' | 'ready' | 'none'>('idle');
  readonly synced = computed(() => this.lyrics().some((l) => l.time > 0));

  /** Playback position used for lyrics, nudged slightly ahead. */
  private readonly lyricTime = computed(() => this.elapsedMs() + LYRIC_LEAD_MS);

  readonly activeLine = computed(() => {
    const lines = this.lyrics();
    if (!this.synced()) return -1;
    const t = this.lyricTime();
    // Binary search: last line whose time <= t
    let lo = 0;
    let hi = lines.length - 1;
    let idx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (lines[mid].time <= t) {
        idx = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return idx;
  });

  /**
   * How long the karaoke fill should take for line i: roughly how long it's
   * sung (by text length), never longer than the gap to the next line.
   */
  private sungDuration(i: number): number {
    const lines = this.lyrics();
    const line = lines[i];
    if (!line) return 0;
    const gap = (lines[i + 1]?.time ?? line.time + 6000) - line.time;
    return Math.max(500, Math.min(gap - 120, Math.max(1400, line.text.length * 85)));
  }

  readonly activeLineDuration = computed(() => this.sungDuration(this.activeLine()));

  /**
   * How far into the active line we already were when it became active.
   * Only recomputed when the line changes, so mid-line page loads start the
   * fill at the right spot (negative animation-delay) instead of from zero.
   */
  readonly activeLineOffset = computed(() => {
    const i = this.activeLine();
    const line = this.lyrics()[i];
    return line ? untracked(() => Math.max(0, this.lyricTime() - line.time)) : 0;
  });

  /**
   * Where the song has instrumental breaks, worked out up-front from the LRC
   * timings (-1 = intro before the first line). These rows are always in the
   * layout, so nothing reflows while playing — the track only slides.
   */
  readonly gapSlots = computed(() => {
    const lines = this.lyrics();
    const slots = new Set<number>();
    if (!this.synced() || !lines.length) return slots;
    if (lines[0].time - LYRIC_LEAD_MS > INTERLUDE_MIN_GAP_MS) slots.add(-1);
    for (let i = 0; i < lines.length - 1; i++) {
      const sungEnd = lines[i].time + this.sungDuration(i) + INTERLUDE_AFTER_MS;
      if (lines[i + 1].time - sungEnd > INTERLUDE_MIN_GAP_MS) slots.add(i);
    }
    return slots;
  });

  /** The break currently playing (index as in gapSlots), or null while singing. */
  readonly interludeAfter = computed<number | null>(() => {
    const lines = this.lyrics();
    const slots = this.gapSlots();
    if (!slots.size) return null;
    const t = this.lyricTime();
    const i = this.activeLine();
    if (i === -1) return slots.has(-1) ? -1 : null;
    if (!slots.has(i)) return null;
    const sungEnd = lines[i].time + this.sungDuration(i) + INTERLUDE_AFTER_MS;
    // Stay on the dots until the next line takes over (no bounce back to line i)
    return t > sungEnd ? i : null;
  });

  /** Distance (in lines) from the focus point — drives blur/fade of neighbours. */
  lineDistance(i: number): number {
    const active = this.activeLine();
    const gapAfter = this.interludeAfter();
    const focus = gapAfter !== null ? gapAfter + 0.5 : Math.max(active, 0);
    return Math.min(3, Math.abs(i - focus));
  }

  /** Accent sampled from the album art / game icon, pastelised in CSS. */
  readonly seed = signal(DEFAULT_SEED);

  private lastTrackKey: string | null = null;
  private lastArt: string | null = null;

  constructor() {
    interval(100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.main()?.timestamps?.start) this.now.set(Date.now());
      });

    // Fetch lyrics whenever the Spotify track changes
    effect(() => {
      const track = this.spotify();
      untracked(() => this.loadLyrics(track));
    });

    // Re-sample the accent colour when the artwork changes
    effect(() => {
      const art = this.art();
      untracked(() => this.sampleColour(art));
    });

    // After each render where the focus changed, slide the lyrics track so
    // the active line (or the interlude dots) sits in the middle of the box.
    afterRenderEffect(() => {
      this.activeLine();
      this.interludeAfter();
      this.lyrics();
      this.positionTrack();
    });

    // Line heights change when the tile resizes → re-centre
    afterRenderEffect((onCleanup) => {
      const box = this.lyricsBox()?.nativeElement;
      if (!box || typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver(() => this.positionTrack());
      ro.observe(box);
      onCleanup(() => ro.disconnect());
    });
  }

  private loadLyrics(track: Activity | null): void {
    const key = track ? track.sync_id || `${track.details}|${track.state}` : null;
    if (key === this.lastTrackKey) return;
    this.lastTrackKey = key;
    this.lyrics.set([]);

    if (!track) {
      this.lyricsState.set('idle');
      return;
    }

    this.lyricsState.set('loading');
    const t = track.timestamps;
    const seconds = t?.start && t?.end ? Math.round((t.end - t.start) / 1000) : 0;
    this.lyricsService
      .getLyrics(track.details ?? '', (track.state ?? '').split(';')[0].trim(), track.assets?.large_text ?? '', seconds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lines) => {
        if (key !== this.lastTrackKey) return; // track changed meanwhile
        this.lyrics.set(lines);
        this.lyricsState.set(lines.length ? 'ready' : 'none');
      });
  }

  private sampleColour(url: string): void {
    if (url === this.lastArt) return;
    this.lastArt = url;
    if (!url) {
      this.seed.set(DEFAULT_SEED);
      return;
    }
    this.fac
      .getColorAsync(url, { algorithm: 'dominant', ignoredColor: [[255, 255, 255, 255, 30], [0, 0, 0, 255, 30]] })
      .then((c) => {
        if (url === this.lastArt) this.seed.set(c.hex);
      })
      .catch(() => this.seed.set(DEFAULT_SEED));
  }

  private positionTrack(): void {
    const box = this.lyricsBox()?.nativeElement;
    const track = this.lyricsTrack()?.nativeElement;
    if (!box || !track) return;

    const gapAfter = untracked(() => this.interludeAfter());
    const active = untracked(() => this.activeLine());
    let centre: number;

    if (gapAfter !== null) {
      const gap = track.querySelector<HTMLElement>(`[data-gap="${gapAfter}"]`);
      centre = gap ? gap.offsetTop + gap.offsetHeight / 2 : 0;
    } else {
      const line = track.querySelector<HTMLElement>(`[data-line="${Math.max(active, 0)}"]`);
      centre = line ? line.offsetTop + line.offsetHeight / 2 : 0;
    }

    track.style.transform = `translateY(${Math.round(box.clientHeight / 2 - centre)}px)`;
  }

  private assetUrl(activity: Activity | null, image: string | undefined): string {
    if (!activity || !image) return '';
    if (image.startsWith('spotify:')) return `https://i.scdn.co/image/${image.slice('spotify:'.length)}`;
    if (image.startsWith('mp:external/')) return DiscordCdn.externalMedia(image);
    return DiscordCdn.appAsset(activity.application_id ?? '', image);
  }

  activityVerb(a: Activity): string {
    return ['Playing', 'Streaming', 'Listening to', 'Watching', '', 'Competing in'][a.type ?? 0] || 'Using';
  }

  artist(a: Activity): string {
    return (a.state ?? '').replaceAll(';', ',');
  }

  hideBrokenImage(event: Event): void {
    (event.target as HTMLImageElement).style.visibility = 'hidden';
  }
}
