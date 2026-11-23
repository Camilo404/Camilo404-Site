import { DestroyRef, Directive, ElementRef, NgZone, OnInit, inject, input } from '@angular/core';

const SHOW_DELAY = 120;
const GAP = 10;

/**
 * Single shared tooltip living in the top layer (Popover API).
 *
 * Positioning is done from getBoundingClientRect every frame while visible:
 * the cards tilt/scale in 3D on hover, and CSS anchor positioning anchors to
 * the *untransformed* layout box, which made the bubble drift away from the
 * element. The rect reflects transforms, so the bubble stays glued to it.
 */
class TooltipController {
  private tip: HTMLElement | null = null;
  private host: HTMLElement | null = null;
  private showTimer?: ReturnType<typeof setTimeout>;
  private rafId?: number;

  private ensureTip(): HTMLElement {
    if (!this.tip) {
      const tip = document.createElement('div');
      tip.className = 'pastel-tooltip';
      tip.id = 'pastel-tooltip';
      tip.setAttribute('popover', 'manual');
      tip.setAttribute('role', 'tooltip');
      document.body.appendChild(tip);
      this.tip = tip;
    }
    return this.tip;
  }

  private get isOpen(): boolean {
    return !!this.tip?.matches(':popover-open');
  }

  show(host: HTMLElement, text: string): void {
    clearTimeout(this.showTimer);
    const tip = this.ensureTip();

    this.host?.removeAttribute('aria-describedby');
    this.host = host;
    host.setAttribute('aria-describedby', tip.id);
    tip.textContent = text;

    if (this.isOpen) {
      // Moving between items: retarget without closing → no flicker
      this.place();
      return;
    }

    this.showTimer = setTimeout(() => {
      if (this.host !== host) return;
      tip.showPopover();
      this.place();
      this.follow();
    }, SHOW_DELAY);
  }

  hide(host: HTMLElement): void {
    if (this.host !== host) return;
    clearTimeout(this.showTimer);
    host.removeAttribute('aria-describedby');
    this.host = null;
    if (this.rafId !== undefined) cancelAnimationFrame(this.rafId);
    this.rafId = undefined;
    if (this.isOpen) this.tip!.hidePopover();
  }

  /** Re-place every frame while open so it tracks the tilting card. */
  private follow(): void {
    const loop = () => {
      if (!this.host || !this.isOpen) {
        this.rafId = undefined;
        return;
      }
      this.place();
      this.rafId = requestAnimationFrame(loop);
    };
    if (this.rafId === undefined) this.rafId = requestAnimationFrame(loop);
  }

  private place(): void {
    const host = this.host;
    const tip = this.tip;
    if (!host || !tip) return;

    const r = host.getBoundingClientRect();
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;

    // Prefer above; flip below when there's no room
    const below = r.top - h - GAP < 8;
    const top = below ? r.bottom + GAP : r.top - h - GAP;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);

    tip.classList.toggle('below', below);
    // Arrow follows the host centre even when the bubble is clamped to the viewport
    tip.style.setProperty('--arrow-x', `${r.left + r.width / 2 - left}px`);
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  }
}

let controller: TooltipController | null = null;

/** `appTooltip="text"` — pastel tooltip on hover/focus. */
@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnInit {
  readonly appTooltip = input<string | null | undefined>('');

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    controller ??= new TooltipController();
    const ctl = controller;
    const host = this.el.nativeElement as HTMLElement;

    const show = () => {
      const text = this.appTooltip();
      if (text) ctl.show(host, text);
    };
    const hide = () => ctl.hide(host);
    // Only keyboard focus should open it; a mouse click shouldn't leave it stuck open
    const onFocus = () => {
      if (host.matches(':focus-visible')) show();
    };

    this.zone.runOutsideAngular(() => {
      host.addEventListener('pointerenter', show);
      host.addEventListener('pointerleave', hide);
      host.addEventListener('pointerdown', hide);
      host.addEventListener('focus', onFocus);
      host.addEventListener('blur', hide);
    });

    this.destroyRef.onDestroy(() => {
      host.removeEventListener('pointerenter', show);
      host.removeEventListener('pointerleave', hide);
      host.removeEventListener('pointerdown', hide);
      host.removeEventListener('focus', onFocus);
      host.removeEventListener('blur', hide);
      ctl.hide(host);
    });
  }
}
