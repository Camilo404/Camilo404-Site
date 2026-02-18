import { Component, ElementRef, OnDestroy, AfterViewInit, Renderer2, signal, inject, effect } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { Card3DEffectService } from '../../services/card-3d-effect.service';
import { NekoComponent } from '../neko/neko.component';
import { EtherealShadowComponent } from '../ethereal-shadow/ethereal-shadow.component';
import { CardProfileComponent } from '../card-profile/card-profile.component';
import { FloatingActivityComponent } from '../floating-activity/floating-activity.component';
import { SearchModalComponent } from '../search-modal/search-modal.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { ClockWidgetComponent } from '../widgets/clock-widget/clock-widget.component';
import { ShadowWidgetComponent } from '../widgets/shadow-widget/shadow-widget.component';
import { SocialWidgetComponent } from '../widgets/social-widget/social-widget.component';
import { TechStackWidgetComponent } from '../widgets/tech-stack-widget/tech-stack-widget.component';

@Component({
    selector: 'app-main',
    standalone: true,
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
    imports: [
    RouterModule,
    NekoComponent,
    EtherealShadowComponent,
    CardProfileComponent,
    FloatingActivityComponent,
    SearchModalComponent,
    FontAwesomeModule,
    ClockWidgetComponent,
    ShadowWidgetComponent,
    SocialWidgetComponent,
    TechStackWidgetComponent
]
})
export class MainComponent implements OnDestroy, AfterViewInit {
  private router = inject(Router);
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private card3DService = inject(Card3DEffectService);

  faSearch = faSearch;

  isModalOpen = signal(false);
  isActivityVisible = signal(false);
  nameplateAsset = signal<string | null>(null);

  private unlistenFunctions: (() => void)[] = [];

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

      this.card3DService.initCard3DEffect(new ElementRef(card), {
        maxRotation: 5,
        scale: 1.02
      });
    });
  }

  ngOnDestroy(): void {
    this.unlistenFunctions.forEach(unlisten => unlisten());
    this.unlistenFunctions = [];
  }

  openSearchModal(): void {
    this.isModalOpen.set(true);
  }

  closeSearchModal(): void {
    this.isModalOpen.set(false);
  }

  onSearchProfile(userId: string): void {
    this.router.navigate(['/profile', userId]);
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
