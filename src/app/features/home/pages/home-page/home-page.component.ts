import { Component } from '@angular/core';

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
    TechStackWidgetComponent
]
})
export class HomePageComponent {
  readonly year = new Date().getFullYear();

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
