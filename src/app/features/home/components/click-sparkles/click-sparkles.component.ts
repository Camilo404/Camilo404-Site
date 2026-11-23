import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, NgZone, afterNextRender, inject } from '@angular/core';

const COLORS = ['#b79cf7', '#f39ac2', '#86c3f2', '#7fd8b3', '#f9be8c', '#f6d76b'];
const SPARKLE_SVG =
  '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 0c.6 5.6 2.4 7.4 12 12-9.6 4.6-11.4 6.4-12 12-.6-5.6-2.4-7.4-12-12C9.6 7.4 11.4 5.6 12 0z"/></svg>';

/**
 * Small burst of pastel sparkles wherever the visitor clicks/taps.
 * Pure DOM + Web Animations API, outside Angular; nodes remove themselves.
 */
@Component({
  selector: 'app-click-sparkles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  styles: `
    :host {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 10000;
      overflow: hidden;
    }
    :host ::ng-deep .click-sparkle {
      position: absolute;
      left: 0;
      top: 0;
      width: 14px;
      height: 14px;
      margin: -7px 0 0 -7px;
      filter: drop-shadow(0 0 4px currentColor);
    }
    :host ::ng-deep .click-sparkle svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  `,
  host: { 'aria-hidden': 'true' },
})
export class ClickSparklesComponent {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // 'click' (not pointerdown) so a finger starting a scroll on mobile doesn't burst
      const onClick = (e: MouseEvent) => {
        if (e.detail === 0) return; // keyboard-triggered click has no position
        this.burst(e.clientX, e.clientY);
      };
      this.zone.runOutsideAngular(() => window.addEventListener('click', onClick, { passive: true }));
      this.destroyRef.onDestroy(() => window.removeEventListener('click', onClick));
    });
  }

  private burst(x: number, y: number): void {
    const host = this.el.nativeElement as HTMLElement;
    const count = 9;
    for (let i = 0; i < count; i++) {
      const node = document.createElement('span');
      node.className = 'click-sparkle';
      node.innerHTML = SPARKLE_SVG;
      node.style.color = COLORS[(Math.random() * COLORS.length) | 0];
      host.appendChild(node);

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const distance = 28 + Math.random() * 34;
      const scale = 0.5 + Math.random() * 0.7;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      node
        .animate(
          [
            { transform: `translate(${x}px, ${y}px) scale(0) rotate(0deg)`, opacity: 1 },
            { transform: `translate(${x + dx * 0.7}px, ${y + dy * 0.7}px) scale(${scale}) rotate(90deg)`, opacity: 1, offset: 0.5 },
            { transform: `translate(${x + dx}px, ${y + dy + 10}px) scale(0) rotate(180deg)`, opacity: 0 },
          ],
          { duration: 650 + Math.random() * 250, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        )
        .finished.then(() => node.remove(), () => node.remove());
    }
  }
}
