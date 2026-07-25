import {
  Directive,
  ElementRef,
  Renderer2,
  DestroyRef,
  OnInit,
  input,
  inject,
} from '@angular/core';
import { MOBILE_MAX_WIDTH } from '../../core/constants';

export interface Card3DConfig {
  scale: number;
  perspective: number;
  transition: string;
  shadowIntensity: number;
  maxRotation: number;
}

const DEFAULT_CONFIG: Card3DConfig = {
  scale: 1.05,
  perspective: 1000,
  transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
  shadowIntensity: 0.3,
  maxRotation: 15,
};

/**
 * Adds a mouse/touch-driven 3D tilt to the host element. One instance per element,
 * so all per-element state lives in plain fields — no shared Maps, no leaks.
 *
 * Children marked with `data-offset` / `data-opacity` get parallax + opacity shifts.
 * Set `card3dSpotlight` to also expose `--mouse-x` / `--mouse-y` for CSS glare effects.
 */
@Directive({
  selector: '[appCard3d]',
  standalone: true,
})
export class Card3dDirective implements OnInit {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);

  readonly card3dConfig = input<Partial<Card3DConfig>>({});
  readonly card3dSpotlight = input(false);

  private cfg: Card3DConfig = DEFAULT_CONFIG;
  private rect?: DOMRect;
  private pointer?: { x: number; y: number };
  private rafId?: number;

  ngOnInit(): void {
    if (window.innerWidth <= MOBILE_MAX_WIDTH) return;

    this.cfg = { ...DEFAULT_CONFIG, ...this.card3dConfig() };
    const host = this.host;

    this.renderer.setStyle(host, 'transform-style', 'preserve-3d');
    this.renderer.setStyle(host, 'perspective', `${this.cfg.perspective}px`);
    this.renderer.setStyle(host, 'transition', `transform ${this.cfg.transition}`);
    this.renderer.setStyle(host, 'will-change', 'transform');

    const un = [
      this.renderer.listen(host, 'mouseenter', () => this.begin()),
      this.renderer.listen(host, 'mousemove', (e: MouseEvent) => this.move(e.clientX, e.clientY)),
      this.renderer.listen(host, 'mouseleave', () => this.reset()),
      this.renderer.listen(host, 'touchstart', (e: TouchEvent) => this.onTouchStart(e)),
      this.renderer.listen(host, 'touchmove', (e: TouchEvent) => this.onTouchMove(e)),
      this.renderer.listen(host, 'touchend', () => this.reset()),
    ];

    this.destroyRef.onDestroy(() => {
      un.forEach(fn => fn());
      this.cancelScheduled();
      this.renderer.removeStyle(host, 'transform');
      this.renderer.removeStyle(host, 'transition');
    });
  }

  private get host(): HTMLElement {
    return this.el.nativeElement as HTMLElement;
  }

  private begin(): void {
    this.renderer.setStyle(this.host, 'transition', 'transform 0.2s ease-out');
    this.renderer.setStyle(this.host, 'perspective', `${this.cfg.perspective}px`);
    this.rect = this.host.getBoundingClientRect();
  }

  private move(clientX: number, clientY: number): void {
    this.pointer = { x: clientX, y: clientY };
    this.schedule();
  }

  private onTouchStart(event: TouchEvent): void {
    if (window.innerWidth <= MOBILE_MAX_WIDTH) return;
    event.preventDefault();
    this.begin();
  }

  private onTouchMove(event: TouchEvent): void {
    if (window.innerWidth <= MOBILE_MAX_WIDTH) return;
    event.preventDefault();
    const touch = event.touches[0];
    if (touch) this.move(touch.clientX, touch.clientY);
  }

  /** Coalesce every pointer update into a single write per animation frame. */
  private schedule(): void {
    if (this.rafId !== undefined) return;

    this.rafId = requestAnimationFrame(() => {
      this.rafId = undefined;
      if (!this.pointer || !this.rect) return;

      const { left, top, width, height } = this.rect;
      const relX = this.pointer.x - left;
      const relY = this.pointer.y - top;

      const rotateY = ((relX - width / 2) / (width / 2)) * this.cfg.maxRotation;
      const rotateX = -((relY - height / 2) / (height / 2)) * this.cfg.maxRotation;

      this.renderer.setStyle(
        this.host,
        'transform',
        `perspective(${this.cfg.perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${this.cfg.scale})`,
      );

      if (this.card3dSpotlight()) {
        this.host.style.setProperty('--mouse-x', `${relX}px`);
        this.host.style.setProperty('--mouse-y', `${relY}px`);
      }

      this.applyChildrenEffects(rotateX, rotateY);
    });
  }

  private cancelScheduled(): void {
    if (this.rafId !== undefined) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
  }

  private reset(): void {
    this.cancelScheduled();
    this.rect = undefined;
    this.pointer = undefined;

    this.renderer.setStyle(this.host, 'transition', 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)');
    this.renderer.setStyle(
      this.host,
      'transform',
      `perspective(${this.cfg.perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`,
    );
    this.resetChildrenEffects();
  }

  private applyChildrenEffects(rotateX: number, rotateY: number): void {
    this.host.querySelectorAll<HTMLElement>('[data-offset]').forEach(child => {
      const offset = parseFloat(child.getAttribute('data-offset') || '1');
      this.renderer.setStyle(
        child,
        'transform',
        `translateZ(${offset * 10}px) rotateX(${rotateX * offset}deg) rotateY(${rotateY * offset}deg)`,
      );
      this.renderer.setStyle(child, 'transition', 'transform 0.15s ease-out');
    });

    this.host.querySelectorAll<HTMLElement>('[data-opacity]').forEach(child => {
      const [min, max] = (child.getAttribute('data-opacity') || '0.9;1').split(';').map(parseFloat);
      const intensity = Math.min((Math.abs(rotateX) + Math.abs(rotateY)) / 30, 1);
      this.renderer.setStyle(child, 'opacity', `${min + (max - min) * intensity}`);
      this.renderer.setStyle(child, 'transition', 'opacity 0.15s ease-out');
    });
  }

  private resetChildrenEffects(): void {
    this.host.querySelectorAll<HTMLElement>('[data-offset]').forEach(child => {
      this.renderer.setStyle(child, 'transform', 'translateZ(0px) rotateX(0deg) rotateY(0deg)');
      this.renderer.setStyle(child, 'transition', 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)');
    });

    this.host.querySelectorAll<HTMLElement>('[data-opacity]').forEach(child => {
      const min = parseFloat((child.getAttribute('data-opacity') || '0.9;1').split(';')[0]);
      this.renderer.setStyle(child, 'opacity', `${min}`);
      this.renderer.setStyle(child, 'transition', 'opacity 0.4s cubic-bezier(0.23, 1, 0.32, 1)');
    });
  }
}
