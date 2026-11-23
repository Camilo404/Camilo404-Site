import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';

type Kind = 'sparkle' | 'dot' | 'star';

interface Particle {
  kind: Kind;
  x: number;
  y: number;
  size: number;
  color: string;
  /** upward drift, px per second */
  vy: number;
  swayAmp: number;
  swaySpeed: number;
  phase: number;
  twinkleSpeed: number;
  rotation: number;
  spin: number;
  /** temporary push from the cursor */
  ox: number;
  oy: number;
}

const COLORS = ['#c9b3fb', '#f9b9d4', '#a9d2f7', '#9fe2c6', '#fcd0ad', '#ffffff'];
const REPEL_RADIUS = 120;

/**
 * Pastel particle field: four-point sparkles, five-point stars and soft dots that
 * float upward with a gentle sway and twinkle. The cursor nudges nearby particles.
 *
 * Runs on a single canvas outside Angular's change detection, scales particle
 * count with viewport area, pauses when the tab is hidden and renders one static
 * frame for prefers-reduced-motion.
 */
@Component({
  selector: 'app-sparkle-background',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas></canvas>`,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: -100;
      pointer-events: none;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
  host: { 'aria-hidden': 'true' },
})
export class SparkleBackgroundComponent {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;
  private rafId?: number;
  private lastTime = 0;
  private pointer = { x: -9999, y: -9999 };

  constructor() {
    afterNextRender(() => this.zone.runOutsideAngular(() => this.init()));
  }

  private init(): void {
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onResize = () => {
      this.resize();
      if (reduced) this.draw(0);
    };
    const onMove = (e: PointerEvent) => {
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
    };
    const onLeave = () => {
      this.pointer.x = this.pointer.y = -9999;
    };
    const onVisibility = () => {
      if (document.hidden) this.stop();
      else if (!reduced) this.start();
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);

    this.destroyRef.onDestroy(() => {
      this.stop();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    });

    this.resize();
    if (reduced) this.draw(0);
    else this.start();
  }

  private resize(): void {
    const canvas = this.canvasRef().nativeElement;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    canvas.width = Math.round(this.width * this.dpr);
    canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // ~1 particle per 18k px², clamped so phones stay light and 4K isn't busy
    const target = Math.round(Math.min(110, Math.max(28, (this.width * this.height) / 18000)));
    while (this.particles.length < target) this.particles.push(this.spawn(true));
    this.particles.length = target;
  }

  private spawn(anywhere: boolean): Particle {
    const roll = Math.random();
    const kind: Kind = roll < 0.45 ? 'sparkle' : roll < 0.6 ? 'star' : 'dot';
    const size =
      kind === 'dot' ? 1.2 + Math.random() * 2.2 : kind === 'star' ? 3 + Math.random() * 4 : 4 + Math.random() * 7;
    return {
      kind,
      x: Math.random() * this.width,
      y: anywhere ? Math.random() * this.height : this.height + 20,
      size,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      vy: 6 + Math.random() * 14,
      swayAmp: 6 + Math.random() * 18,
      swaySpeed: 0.2 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.6 + Math.random() * 1.6,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.4,
      ox: 0,
      oy: 0,
    };
  }

  private start(): void {
    if (this.rafId !== undefined) return;
    this.lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;
      this.update(dt, now / 1000);
      this.draw(now / 1000);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stop(): void {
    if (this.rafId !== undefined) cancelAnimationFrame(this.rafId);
    this.rafId = undefined;
  }

  private update(dt: number, t: number): void {
    const { x: px, y: py } = this.pointer;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.y -= p.vy * dt;
      p.rotation += p.spin * dt;

      // Cursor: push away softly, then ease back
      const sx = p.x + Math.sin(t * p.swaySpeed + p.phase) * p.swayAmp + p.ox;
      const sy = p.y + p.oy;
      const dx = sx - px;
      const dy = sy - py;
      const dist = Math.hypot(dx, dy);
      if (dist < REPEL_RADIUS && dist > 0.1) {
        const force = (1 - dist / REPEL_RADIUS) * 60 * dt;
        p.ox += (dx / dist) * force;
        p.oy += (dy / dist) * force;
      }
      p.ox *= 0.96;
      p.oy *= 0.96;

      if (p.y < -30) this.particles[i] = this.spawn(false);
    }
  }

  private draw(t: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    for (const p of this.particles) {
      const x = p.x + Math.sin(t * p.swaySpeed + p.phase) * p.swayAmp + p.ox;
      const y = p.y + p.oy;
      const twinkle = 0.55 + 0.45 * Math.sin(t * p.twinkleSpeed + p.phase);

      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = p.kind === 'dot' ? 0.5 + twinkle * 0.4 : 0.35 + twinkle * 0.6;
      ctx.fillStyle = p.color;

      if (p.kind === 'dot') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const s = p.size * (0.75 + twinkle * 0.35);
        ctx.rotate(p.rotation);
        // White-ish glow so pastel shapes read on the light background
        ctx.shadowColor = p.color;
        ctx.shadowBlur = s * 1.4;
        if (p.kind === 'sparkle') this.sparklePath(ctx, s);
        else this.starPath(ctx, s);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /** Four-point sparkle with concave sides. */
  private sparklePath(ctx: CanvasRenderingContext2D, r: number): void {
    const k = r * 0.18;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(k, -k, r, 0);
    ctx.quadraticCurveTo(k, k, 0, r);
    ctx.quadraticCurveTo(-k, k, -r, 0);
    ctx.quadraticCurveTo(-k, -k, 0, -r);
    ctx.closePath();
  }

  /** Rounded-ish five-point star. */
  private starPath(ctx: CanvasRenderingContext2D, r: number): void {
    const inner = r * 0.48;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : inner;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
  }
}
