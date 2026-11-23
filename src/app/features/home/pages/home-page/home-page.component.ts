import { Component, computed, viewChild } from '@angular/core';
import { faGithub, faYoutube, faInstagram, faSteam, faDiscord, faSpotify } from '@fortawesome/free-brands-svg-icons';
import { faCopy, faLink, faExpand, faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommandPaletteComponent, PaletteCommand } from '../../components/command-palette/command-palette.component';
import { environment } from 'src/environments/environment';

import { NekoComponent } from '../../components/neko/neko.component';
import { SparkleBackgroundComponent } from '../../components/sparkle-background/sparkle-background.component';
import { ClickSparklesComponent } from '../../components/click-sparkles/click-sparkles.component';
import { NowPlayingWidgetComponent } from '../../widgets/now-playing-widget/now-playing-widget.component';
import { CardProfileComponent } from '../../../../shared/ui/card-profile/card-profile.component';
import { ClockWidgetComponent } from '../../widgets/clock-widget/clock-widget.component';
import { ShadowWidgetComponent } from '../../widgets/shadow-widget/shadow-widget.component';
import { SocialWidgetComponent } from '../../widgets/social-widget/social-widget.component';
import { TechStackWidgetComponent } from '../../widgets/tech-stack-widget/tech-stack-widget.component';

@Component({
    selector: 'app-home-page',
    standalone: true,
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    imports: [
    NekoComponent,
    SparkleBackgroundComponent,
    ClickSparklesComponent,
    NowPlayingWidgetComponent,
    CardProfileComponent,
    ClockWidgetComponent,
    ShadowWidgetComponent,
    SocialWidgetComponent,
    TechStackWidgetComponent,
    CommandPaletteComponent,
    FontAwesomeModule
]
})
export class HomePageComponent {
  readonly year = new Date().getFullYear();

  private readonly nowPlaying = viewChild(NowPlayingWidgetComponent);
  private readonly notes = viewChild(ShadowWidgetComponent);
  readonly palette = viewChild(CommandPaletteComponent);

  readonly isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  /** ⌘K palette entries; the contextual ones only appear while they make sense. */
  readonly commands = computed<PaletteCommand[]>(() => {
    const player = this.nowPlaying();
    const playing = !!player?.main();
    const trackUrl = player?.trackUrl() ?? null;

    const list: PaletteCommand[] = [
      { id: 'github', group: 'Go to', label: 'GitHub', hint: '@Camilo404', icon: faGithub, keywords: 'code repos', href: 'https://github.com/Camilo404' },
      { id: 'youtube', group: 'Go to', label: 'YouTube', hint: 'Channel', icon: faYoutube, keywords: 'videos', href: 'https://www.youtube.com/channel/UChzlaSE1adSPVGYBBOQ1ibg' },
      { id: 'instagram', group: 'Go to', label: 'Instagram', hint: '@camiloxtz', icon: faInstagram, keywords: 'photos ig', href: 'https://www.instagram.com/camiloxtz/' },
      { id: 'steam', group: 'Go to', label: 'Steam', hint: 'Profile', icon: faSteam, keywords: 'games', href: 'https://steamcommunity.com/profiles/76561198832154348/' },
      { id: 'discord', group: 'Go to', label: 'Discord profile', hint: '@camilo404', icon: faDiscord, keywords: 'message dm chat', href: `https://discord.com/users/${environment.discordId}` },
    ];

    if (trackUrl) {
      list.push({ id: 'spotify', group: 'Go to', label: 'Current song on Spotify', icon: faSpotify, keywords: 'music track listening', href: trackUrl });
    }
    if (playing) {
      list.push({ id: 'expand', group: 'Actions', label: 'Expand now playing', icon: faExpand, keywords: 'player lyrics music fullscreen', run: () => player!.expand() });
    }

    list.push(
      { id: 'copy-discord', group: 'Actions', label: 'Copy Discord username', hint: 'camilo404', icon: faCopy, keywords: 'clipboard add friend', run: () => this.copy('camilo404', 'Discord username copied') },
      { id: 'copy-link', group: 'Actions', label: 'Copy link to this page', icon: faLink, keywords: 'share url clipboard', run: () => this.copy(location.href, 'Link copied') },
      { id: 'next-note', group: 'Actions', label: 'Next note', icon: faQuoteLeft, keywords: 'quote shadow', run: () => this.notes()?.next() },
    );
    return list;
  });

  private async copy(text: string, done: string): Promise<string> {
    try {
      await navigator.clipboard.writeText(text);
      return done;
    } catch {
      return 'Could not access the clipboard';
    }
  }

  /**
   * Discord profile theme colours drive the whole page palette. They're set on
   * :root as registered properties, so the change animates everywhere at once.
   * The card falls back to two greys when the profile has no theme — keep the
   * default palette in that case.
   */
  onThemeColorsChange(colors: string[]): void {
    const root = document.documentElement.style;
    const [first, second] = colors;
    if (!first || (first === '#5C5C5C' && (second ?? first) === '#5C5C5C')) {
      root.removeProperty('--profile-1');
      root.removeProperty('--profile-2');
      return;
    }
    root.setProperty('--profile-1', first);
    root.setProperty('--profile-2', second ?? first);
  }
}
