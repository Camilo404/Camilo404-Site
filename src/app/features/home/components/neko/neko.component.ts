import { Component, HostListener, OnDestroy, AfterViewInit, ViewChild, ElementRef, signal } from '@angular/core';

type SpriteDirection = 'idle' | 'alert' | 'scratch' | 'tired' | 'sleeping' | 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

@Component({
    selector: 'app-neko',
    standalone: true,
    template: `
    <div #oneko id="oneko" style="width: 32px; height: 32px; position: fixed; background-image: url(/assets/images/oneko.gif); image-rendering: pixelated; z-index: 5; left: 16px; top: 16px;"></div>
  `,
    styles: [``],
    imports: []
})
export class NekoComponent implements AfterViewInit, OnDestroy {
  // Migrado a signals
  nekoPosX = signal(32);
  nekoPosY = signal(32);
  mousePosX = signal(0);
  mousePosY = signal(0);
  frameCount = signal(0);
  idleTime = signal(0);
  idleAnimation = signal<string | null>(null);
  idleAnimationFrame = signal(0);
  
  nekoSpeed = 10;
  nekoEl: HTMLElement | null = null;
  onekoInterval: any;

  @ViewChild('oneko') oneko!: ElementRef;

  spriteSets: { [key in SpriteDirection]: number[][] } = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratch: [
      [-5, 0],
      [-6, 0],
      [-7, 0],
    ],
    tired: [[-3, -2]],
    sleeping: [
      [-2, 0],
      [-2, -1],
    ],
    N: [
      [-1, -2],
      [-1, -3],
    ],
    NE: [
      [0, -2],
      [0, -3],
    ],
    E: [
      [-3, 0],
      [-3, -1],
    ],
    SE: [
      [-5, -1],
      [-5, -2],
    ],
    S: [
      [-6, -3],
      [-7, -2],
    ],
    SW: [
      [-5, -3],
      [-6, -1],
    ],
    W: [
      [-4, -2],
      [-4, -3],
    ],
    NW: [
      [-1, 0],
      [-1, -1],
    ],
  };


  ngAfterViewInit(): void {
    this.onekoInterval = setInterval(() => this.frame(), 100);
  }

  ngOnDestroy(): void {
    if (this.onekoInterval) {
      clearInterval(this.onekoInterval);
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.mousePosX.set(event.clientX);
    this.mousePosY.set(event.clientY);
  }

  setSprite(name: SpriteDirection, frame: number): void {
    const sprite = this.spriteSets[name][frame % this.spriteSets[name].length];
    if (this.oneko) {
      this.oneko.nativeElement.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
    }
  }

  resetIdleAnimation(): void {
    this.idleAnimation.set(null);
    this.idleAnimationFrame.set(0);
  }

  idle(): void {
    this.idleTime.update(t => t + 1);
    const currentIdleTime = this.idleTime();
    const currentIdleAnimation = this.idleAnimation();
    const currentIdleAnimationFrame = this.idleAnimationFrame();

    if (currentIdleTime > 10 && Math.floor(Math.random() * 200) === 0 && currentIdleAnimation === null) {
      this.idleAnimation.set(['sleeping', 'scratch'][Math.floor(Math.random() * 2)]);
    }

    switch (this.idleAnimation()) {
      case 'sleeping':
        if (currentIdleAnimationFrame < 8) {
          this.setSprite('tired', 0);
          break;
        }
        this.setSprite('sleeping', Math.floor(currentIdleAnimationFrame / 4));
        if (currentIdleAnimationFrame > 192) {
          this.resetIdleAnimation();
        }
        break;
      case 'scratch':
        this.setSprite('scratch', currentIdleAnimationFrame);
        if (currentIdleAnimationFrame > 9) {
          this.resetIdleAnimation();
        }
        break;
      default:
        this.setSprite('idle', 0);
        return;
    }
    this.idleAnimationFrame.update(f => f + 1);
  }

  frame(): void {
    this.frameCount.update(f => f + 1);
    const nekoPosX = this.nekoPosX();
    const nekoPosY = this.nekoPosY();
    const mousePosX = this.mousePosX();
    const mousePosY = this.mousePosY();
    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < this.nekoSpeed || distance < 48) {
      this.idle();
      return;
    }

    this.idleAnimation.set(null);
    this.idleAnimationFrame.set(0);

    const currentIdleTime = this.idleTime();
    if (currentIdleTime > 1) {
      this.setSprite('alert', 0);
      this.idleTime.set(Math.min(currentIdleTime, 7) - 1);
      return;
    }

    let direction = diffY / distance > 0.5 ? 'N' : '';
    direction += diffY / distance < -0.5 ? 'S' : '';
    direction += diffX / distance > 0.5 ? 'W' : '';
    direction += diffX / distance < -0.5 ? 'E' : '';
    this.setSprite(direction as SpriteDirection, this.frameCount());

    this.nekoPosX.update(x => x - (diffX / distance) * this.nekoSpeed);
    this.nekoPosY.update(y => y - (diffY / distance) * this.nekoSpeed);

    if (this.oneko) {
      this.oneko.nativeElement.style.left = `${this.nekoPosX() - 16}px`;
      this.oneko.nativeElement.style.top = `${this.nekoPosY() - 16}px`;
    }
  }
}