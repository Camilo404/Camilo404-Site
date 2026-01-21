import { Component, ElementRef, input, OnDestroy, OnInit, ViewChild, NgZone, inject, PLATFORM_ID, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

export interface AnimationConfig {
  preview?: boolean;
  scale: number;
  speed: number;
}

export interface NoiseConfig {
  opacity: number;
  scale: number;
}

function mapRange(
  value: number,
  fromLow: number,
  fromHigh: number,
  toLow: number,
  toHigh: number
): number {
  if (fromLow === fromHigh) {
    return toLow;
  }
  const percentage = (value - fromLow) / (fromHigh - fromLow);
  return toLow + percentage * (toHigh - toLow);
}

@Component({
    selector: 'app-ethereal-shadow',
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div
      [class]="className()"
      [ngStyle]="{
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '100%'
      }"
      [style]="style()"
    >
      <div
        [ngStyle]="{
          position: 'absolute',
          inset: '-' + displacementScale + 'px',
          filter: animationEnabled ? 'url(#' + filterId + ') blur(4px)' : 'none'
        }"
      >
        @if (animationEnabled) {
          <svg style="position: absolute; width: 0; height: 0; overflow: hidden;">
            <defs>
              <filter [id]="filterId" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
                <feTurbulence
                  result="undulation"
                  numOctaves="2"
                  [attr.baseFrequency]="baseFrequency"
                  seed="0"
                  type="turbulence"
                />
                <feColorMatrix
                  #feColorMatrix
                  in="undulation"
                  type="hueRotate"
                  values="180"
                  result="hueShifted"
                />
                <feColorMatrix
                  in="hueShifted"
                  result="circulation"
                  type="matrix"
                  values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="circulation"
                  [attr.scale]="displacementScale"
                  result="dist"
                />
                <feDisplacementMap
                  in="dist"
                  in2="hueShifted"
                  [attr.scale]="displacementScale"
                  result="output"
                />
              </filter>
            </defs>
          </svg>
        }
        <div
          [ngStyle]="{
            backgroundColor: color(),
            maskImage: 'url(assets/images/ethereal-shadow/ceBGguIpUU8luwByxuQz79t7To.png)',
            maskSize: sizing() === 'stretch' ? '100% 100%' : 'cover',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            width: '100%',
            height: '100%',
            '-webkit-mask-image': 'url(assets/images/ethereal-shadow/ceBGguIpUU8luwByxuQz79t7To.png)',
            '-webkit-mask-size': sizing() === 'stretch' ? '100% 100%' : 'cover',
            '-webkit-mask-repeat': 'no-repeat',
            '-webkit-mask-position': 'center'
          }"
        ></div>
      </div>

      <div
        style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 10;
        "
      >
        <ng-content></ng-content>
      </div>

      @if (noise() && noise()!.opacity > 0) {
        <div
          [ngStyle]="{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(assets/images/ethereal-shadow/g0QcWrxr87K0ufOxIUFBakwYA8.png)',
            backgroundSize: (noise()!.scale * 200) + 'px',
            backgroundRepeat: 'repeat',
            opacity: noise()!.opacity / 2,
            zIndex: 1
          }"
        ></div>
      }
    </div>
  `
})
export class EtherealShadowComponent implements OnInit, OnDestroy {
  sizing = input<'fill' | 'stretch'>('fill');
  color = input<string>('rgba(128, 128, 128, 1)');
  animation = input<AnimationConfig | undefined>();
  noise = input<NoiseConfig | undefined>();
  style = input<{ [klass: string]: string | number }>({});
  className = input<string>('');

  @ViewChild('feColorMatrix') feColorMatrixRef?: ElementRef<SVGFEColorMatrixElement>;

  public filterId = 'shadowoverlay-' + Math.random().toString(36).substr(2, 9);
  private animationFrameId: number | null = null;
  private isMobile = false;

  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  get animationEnabled(): boolean {
    const anim = this.animation();
    return !!(anim && anim.scale > 0) && !this.isMobile;
  }

  get displacementScale(): number {
    const anim = this.animation();
    return anim ? mapRange(anim.scale, 1, 100, 20, 100) : 0;
  }

  get animationDuration(): number {
    const anim = this.animation();
    return anim ? mapRange(anim.speed, 1, 100, 1000, 50) : 1;
  }

  get baseFrequency(): string {
    const anim = this.animation();
    if (!anim) return '0.001,0.004';
    const freq1 = mapRange(anim.scale, 0, 100, 0.001, 0.0005);
    const freq2 = mapRange(anim.scale, 0, 100, 0.004, 0.002);
    return `${freq1},${freq2}`;
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.checkSystemPreferences();
      this.startAnimation();
    }
  }

  private checkSystemPreferences(): void {
    // Detect mobile devices to save battery/performance
    const userAgent = window.navigator.userAgent.toLowerCase();
    this.isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || window.innerWidth < 768;
  }

  ngOnDestroy(): void {
    this.stopAnimation();
  }

  private startAnimation(): void {
    if (!this.animationEnabled) return;

    this.ngZone.runOutsideAngular(() => {
      let startTime: number | null = null;
      let lastFrameTime = 0;
      const targetFps = 30; // Limit FPS to save resources
      const frameInterval = 1000 / targetFps;
      const cycleDurationMs = (this.animationDuration / 25) * 1000;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        
        // Throttling FPS
        const timeSinceLastFrame = timestamp - lastFrameTime;
        if (timeSinceLastFrame >= frameInterval) {
          lastFrameTime = timestamp - (timeSinceLastFrame % frameInterval);
          
          const elapsed = timestamp - startTime;
          const progress = (elapsed % cycleDurationMs) / cycleDurationMs;
          const value = progress * 360;

          if (this.feColorMatrixRef?.nativeElement) {
            this.feColorMatrixRef.nativeElement.setAttribute('values', value.toString());
          }
        }

        this.animationFrameId = requestAnimationFrame(animate);
      };

      this.animationFrameId = requestAnimationFrame(animate);
    });
  }

  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
