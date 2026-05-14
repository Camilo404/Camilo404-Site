import { Component, ElementRef, OnDestroy, AfterViewInit, Renderer2, signal, inject } from '@angular/core';

import { Card3DEffectService } from '../../../../core/services/card-3d-effect.service';
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
export class HomePageComponent implements OnDestroy, AfterViewInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private card3DService = inject(Card3DEffectService);

  isActivityVisible = signal(false);
  nameplateAsset = signal<string | null>(null);

  private unlistenFunctions: (() => void)[] = [];
  private widgetCardRefs: ElementRef[] = [];

  ngAfterViewInit(): void {
    const cards = this.el.nativeElement.querySelectorAll('.widget-card');
    cards.forEach((card: HTMLElement) => {
      const unlistenMove = this.renderer.listen(card, 'mousemove', (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
      this.unlistenFunctions.push(unlistenMove);

      const ref = new ElementRef(card);
      this.widgetCardRefs.push(ref);
      this.card3DService.initCard3DEffect(ref, {
        maxRotation: 5,
        scale: 1.02
      });
    });
  }

  ngOnDestroy(): void {
    this.unlistenFunctions.forEach(unlisten => unlisten());
    this.unlistenFunctions = [];

    this.widgetCardRefs.forEach(ref => this.card3DService.destroyCard3DEffect(ref));
    this.widgetCardRefs = [];
  }

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
    return `https://cdn.discordapp.com/assets/collectibles/${asset}asset.webm`;
  }
}
