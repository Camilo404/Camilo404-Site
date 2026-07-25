import { Component, signal, computed, inject } from '@angular/core';

import { ThemeService } from '../../../../shared/services/theme.service';
import { DiscordCdn } from '../../../../core/utils/discord-cdn';
import { NekoComponent } from '../../components/neko/neko.component';
import { EtherealShadowComponent } from '../../components/ethereal-shadow/ethereal-shadow.component';
import { CardProfileComponent } from '../../../../shared/ui/card-profile/card-profile.component';
import { FloatingActivityComponent } from '../../../../shared/ui/floating-activity/floating-activity.component';
import { ThemeToggleComponent } from '../../../../shared/ui/theme-toggle/theme-toggle.component';
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
    EtherealShadowComponent,
    CardProfileComponent,
    FloatingActivityComponent,
    ThemeToggleComponent,
    ClockWidgetComponent,
    ShadowWidgetComponent,
    SocialWidgetComponent,
    TechStackWidgetComponent
]
})
export class HomePageComponent {
  private readonly themeService = inject(ThemeService);

  isActivityVisible = signal(false);
  nameplateAsset = signal<string | null>(null);

  // The full-strength noise texture overwhelms the light background
  shadowNoise = computed(() => ({
    opacity: this.themeService.isDark() ? 1 : 0.35,
    scale: 1.2
  }));

  shadowColor = computed(() =>
    this.themeService.isDark() ? 'rgba(128, 128, 128, 1)' : 'rgba(170, 170, 170, 1)'
  );

  onActivityVisibilityChange(isVisible: boolean): void {
    this.isActivityVisible.set(isVisible);
  }

  onNameplateAssetChange(asset: string | null): void {
    this.nameplateAsset.set(asset);
  }

  get nameplateVideoUrl(): string | null {
    const asset = this.nameplateAsset();
    if (!asset) {
      return null;
    }
    return DiscordCdn.nameplate(asset);
  }
}
