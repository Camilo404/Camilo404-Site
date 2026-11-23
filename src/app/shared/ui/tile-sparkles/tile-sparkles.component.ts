import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Three small twinkling sparkles used as tile decoration (same look as the
 * clock tile). `variant` shifts their positions so neighbouring tiles don't
 * look stamped from the same mould. Place it as a child of a positioned card.
 */
@Component({
  selector: 'app-tile-sparkles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="spark s1">✦</span>
    <span class="spark s2">✧</span>
    <span class="spark s3">✦</span>
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
      border-radius: inherit;
    }

    .spark {
      position: absolute;
      color: #c9b3fb;
      animation: tile-twinkle 3.2s ease-in-out infinite;
    }
    .s2 { color: #f9b9d4; animation-delay: -1.2s; }
    .s3 { color: #a9d2f7; animation-delay: -2.1s; }

    /* variant 1 */
    :host(.v1) .s1 { top: 14px; right: 36%; font-size: 0.8rem; }
    :host(.v1) .s2 { bottom: 14px; right: 33%; font-size: 1rem; }
    :host(.v1) .s3 { top: 12px; right: 12px; font-size: 0.7rem; }

    /* variant 2 */
    :host(.v2) .s1 { top: 12px; right: 14px; font-size: 0.9rem; }
    :host(.v2) .s2 { bottom: 12px; left: 46%; font-size: 0.8rem; }
    :host(.v2) .s3 { top: 46%; right: 8px; font-size: 0.65rem; }

    /* variant 3 */
    :host(.v3) .s1 { bottom: 14px; right: 16px; font-size: 0.85rem; }
    :host(.v3) .s2 { top: 12px; right: 30%; font-size: 0.95rem; }
    :host(.v3) .s3 { bottom: 40%; left: 10px; font-size: 0.6rem; }

    @keyframes tile-twinkle {
      0%, 100% { opacity: 0.3; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1.2) rotate(15deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .spark { animation: none; opacity: 0.6; }
    }
  `,
  host: { 'aria-hidden': 'true', '[class]': "'v' + variant()" },
})
export class TileSparklesComponent {
  readonly variant = input<1 | 2 | 3>(1);
}
