import { Component, ViewEncapsulation, input, ViewChild, ElementRef, output, signal, computed, effect, inject, DestroyRef } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGamepad } from '@fortawesome/free-solid-svg-icons';
import { LanyardService } from 'src/app/core/services/lanyard.service';
import { TimestampsService } from 'src/app/core/services/timestamps.service';
import { LyricsService, LyricLine } from 'src/app/core/services/lyrics.service';
import { Activity } from 'src/app/core/models/lanyard-profile.model';
import { Subscription, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FastAverageColor } from 'fast-average-color';

@Component({
    selector: 'app-floating-activity',
    standalone: true,
    imports: [FontAwesomeModule],
    templateUrl: './floating-activity.component.html',
    styleUrls: ['./floating-activity.component.scss'],
    encapsulation: ViewEncapsulation.None,
    styles: [`
    app-floating-activity {
      display: block;
      width: 100%;
    }
  `]
})
export class FloatingActivityComponent {
  isMobileEmbedded = input<boolean>(false);
  visibilityChange = output<boolean>();
  
  @ViewChild('lyricsContainer') lyricsContainer!: ElementRef;
  
  private lanyardService = inject(LanyardService);
  private timestampsService = inject(TimestampsService);
  private lyricsService = inject(LyricsService);
  private destroyRef = inject(DestroyRef);
  
  // Font Awesome icons
  faGamepad = faGamepad;
  
  activities = signal<Activity[]>([]);
  currentIndex = signal(0);
  isSwitching = signal(false);
  
  percentage = signal(0);
  currentTime = signal('0:00');
  totalDuration = signal('0:00');

  // Theme State
  dynamicBgColor = signal('rgba(18, 18, 18, 0.85)');
  dynamicAccentColor = signal('#1db954');
  private fac = new FastAverageColor();
  private currentImageUrl = signal<string | null>(null);

  // Lyrics State
  showLyrics = signal(false);
  lyrics = signal<LyricLine[]>([]);
  currentLineIndex = signal(-1);
  lyricsLoading = signal(false);
  private lastTrackId = signal<string | null>(null);
  private lyricsSyncSubscription: Subscription = new Subscription();

  private activitiesSubscription: Subscription = new Subscription();

  constructor() {
    effect(() => {
      const data = this.lanyardService.getLanyardData()();
      if (data) {
        const allActivities = data?.d?.activities || [];
        const filtered = allActivities.filter((a: Activity) => a.id !== 'custom');
        this.activities.set(filtered);
        
        const hasActivities = filtered.length > 0;
        this.visibilityChange.emit(hasActivities);

        if (filtered.length === 0 || this.currentIndex() >= filtered.length) {
          this.currentIndex.set(0);
        }
      }
    });

    effect(() => {
      this.currentActivity();
      this.processCurrentActivity();
    });
  }

  currentActivity = computed(() => {
    const acts = this.activities();
    const idx = this.currentIndex();
    return acts[idx] || null;
  });

  nextActivity = computed(() => {
    const acts = this.activities();
    if (acts.length < 2) return null;
    const nextIndex = (this.currentIndex() + 1) % acts.length;
    return acts[nextIndex];
  });

  isSpotify = computed(() => {
    const activity = this.currentActivity();
    return !!activity && (activity.name === 'Spotify' || activity.id === 'spotify:1');
  });

  cycleActivity(): void {
    if (this.activities().length < 2 || this.isSwitching()) return;

    this.isSwitching.set(true);

    setTimeout(() => {
      this.currentIndex.update(idx => (idx + 1) % this.activities().length);
      this.isSwitching.set(false);
      this.processCurrentActivity();
    }, 300);
  }

  toggleLyrics(event: Event): void {
    event.stopPropagation();
    this.showLyrics.update(show => !show);
    if (this.showLyrics()) {
       setTimeout(() => this.scrollToActiveLine(), 100);
    }
  }

  private processCurrentActivity(): void {
    this.activitiesSubscription.unsubscribe();
    this.activitiesSubscription = new Subscription();
    this.lyricsSyncSubscription.unsubscribe();

    const activity = this.currentActivity();

    if (!activity) {
      this.percentage.set(0);
      this.currentTime.set('0:00');
      this.totalDuration.set('0:00');
      this.lyrics.set([]);
      this.currentLineIndex.set(-1);
      this.lastTrackId.set(null);
      return;
    }

    if (this.isSpotify()) {
      this.handleSpotifyLyrics(activity);
      
      const imageUrl = this.getActivityImage(activity);
       this.updateThemeFromImage(imageUrl);

    } else {
      if (this.lastTrackId()) {
         this.lyrics.set([]);
         this.currentLineIndex.set(-1);
         this.lastTrackId.set(null);
         this.showLyrics.set(false);
         this.resetTheme();
      }
    }

    if (activity.timestamps) {
      const { start, end } = activity.timestamps;

      if (end) {
        const progressSub = this.timestampsService.getProgressPercentage(start, end)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(percentage => {
            this.percentage.set(percentage);
          });
        this.activitiesSubscription.add(progressSub);

        this.totalDuration.set(this.timestampsService.getTotalDuration(start, end));
      } else {
        this.percentage.set(0);
        this.totalDuration.set('');
      }

      const elapsedSub = this.timestampsService.getElapsedTime(start)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(time => {
          this.currentTime.set(time);
        });
      this.activitiesSubscription.add(elapsedSub);
    }
  }

  private updateThemeFromImage(imageUrl: string): void {
     if (!imageUrl) {
        this.currentImageUrl.set(null);
        this.resetTheme();
        return;
     }

     if (this.currentImageUrl() === imageUrl) {
        return;
     }

     this.currentImageUrl.set(imageUrl);

     this.fac.getColorAsync(imageUrl)
        .then(color => {
           // Default background based on dominant color
           this.dynamicBgColor.set(`rgba(${color.value[0]}, ${color.value[1]}, ${color.value[2]}, 0.85)`);
           
           if (color.isDark) {
              const lighten = (val: number) => Math.min(255, val + 150);
              this.dynamicAccentColor.set(`rgb(${lighten(color.value[0])}, ${lighten(color.value[1])}, ${lighten(color.value[2])})`);
           } else {
              this.dynamicBgColor.set(`rgba(${color.value[0] * 0.3}, ${color.value[1] * 0.3}, ${color.value[2] * 0.3}, 0.9)`);
              this.dynamicAccentColor.set(color.hex);
           }
        })
        .catch(() => {
           // Fallback to default colors but keep currentImageUrl set to avoid retry loop
           this.dynamicBgColor.set('rgba(18, 18, 18, 0.85)');
           this.dynamicAccentColor.set('#1db954');
        });
  }

  private resetTheme(): void {
     this.currentImageUrl.set(null);
     this.dynamicBgColor.set('rgba(18, 18, 18, 0.85)');
     this.dynamicAccentColor.set('#1db954');
  }

  private handleSpotifyLyrics(activity: Activity): void {
     const trackId = activity.sync_id || activity.details || '';
     
     // Fetch lyrics only if track changed
     if (this.lastTrackId() !== trackId) {
        this.lastTrackId.set(trackId);
        this.lyrics.set([]);
        this.currentLineIndex.set(-1);
        this.lyricsLoading.set(true);
        
        const durationSeconds = activity.timestamps?.end 
           ? Math.floor((activity.timestamps.end - activity.timestamps.start) / 1000) 
           : 0;

        this.lyricsService.getLyrics(
           activity.details || '',
           activity.state || '',
           activity.assets?.large_text || '',
           durationSeconds
        ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(lyrics => {
           this.lyrics.set(lyrics);
           this.lyricsLoading.set(false);
        });
     }

     // Start Sync Loop
     if (activity.timestamps?.start) {
        this.lyricsSyncSubscription = timer(0, 200).pipe(
           takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => {
           if (!this.lyrics().length) return;
           
           const elapsedMs = Date.now() - activity.timestamps!.start;
           this.updateCurrentLine(elapsedMs);
        });
        this.activitiesSubscription.add(this.lyricsSyncSubscription);
     }
  }

  private updateCurrentLine(elapsedMs: number): void {
     let activeIndex = -1;
     const lyricsArray = this.lyrics();
     for (let i = 0; i < lyricsArray.length; i++) {
        if (elapsedMs >= lyricsArray[i].time) {
           activeIndex = i;
        } else {
           break;
        }
     }
     
     if (this.currentLineIndex() !== activeIndex) {
        this.currentLineIndex.set(activeIndex);
        this.scrollToActiveLine();
     }
  }

  private scrollToActiveLine(): void {
     if (!this.lyricsContainer || this.currentLineIndex() === -1) return;
     
     const container = this.lyricsContainer.nativeElement as HTMLElement;
     const activeLineElement = container.children[this.currentLineIndex()] as HTMLElement;
     
     if (activeLineElement) {
        const containerHeight = container.clientHeight;
        const lineTop = activeLineElement.offsetTop;
        const lineHeight = activeLineElement.clientHeight;
        
        // Center the active line
        const scrollTarget = lineTop - (containerHeight / 2) + (lineHeight / 2);
        
        container.scrollTo({
           top: scrollTarget,
           behavior: 'smooth'
        });
     }
  }

  getActivityImage(activity: Activity): string {
    if (!activity || !activity.assets) return '';

    if (activity.assets.large_image) {
      if (activity.assets.large_image.startsWith('spotify:')) {
        return `https://i.scdn.co/image/${activity.assets.large_image.split(':')[1]}`;
      }
      if (activity.assets.large_image.startsWith('mp:external/')) {
         return activity.assets.large_image.replace('mp:external/', 'https://media.discordapp.net/external/');
      }
      return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
    }
    
    return '';
  }
  
  getSmallActivityImage(activity: Activity): string {
     if (!activity || !activity.assets || !activity.assets.small_image) return '';
     
     if (activity.assets.small_image.startsWith('spotify:')) {
        return `https://i.scdn.co/image/${activity.assets.small_image.split(':')[1]}`;
     }
     if (activity.assets.small_image.startsWith('mp:external/')) {
        return activity.assets.small_image.replace('mp:external/', 'https://media.discordapp.net/external/');
     }
     return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.small_image}.png`;
  }

  getServiceIcon(activity: Activity): string {
    if (!activity || !activity.name) return '';
    
    const lowerName = activity.name.toLowerCase();
    
    const iconMap: { [key: string]: string } = {
      'spotify': 'spotify',
      'visual studio code': 'github',
      'code': 'github',
      'battle.net': 'battlenet',
      'epic games': 'epicgames',
      'league of legends': 'leagueoflegends'
    };
    
    if (iconMap[lowerName]) {
      return `assets/images/connections/${iconMap[lowerName]}.svg`;
    }
    
    const normalizedName = lowerName.replace(/\s+/g, '');
    return `assets/images/connections/${normalizedName}.svg`;
  }

  handleImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/no-image-found.jpg';
    target.style.display = 'none';
  }

  handleIconError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.style.display = 'none';
    target.classList.add('icon-error');
  }

}
