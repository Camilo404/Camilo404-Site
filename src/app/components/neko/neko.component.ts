import { Component, HostListener, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

type SpriteDirection = 'idle' | 'alert' | 'scratch' | 'tired' | 'sleeping' | 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

@Component({
  selector: 'app-neko',
  template: `
    <div #oneko id="oneko" style="width: 32px; height: 32px; position: fixed; background-image: url(/assets/images/oneko.gif); image-rendering: pixelated; z-index: 5; left: 16px; top: 16px;"></div>
  `,
  styles: [``]
})
export class NekoComponent implements AfterViewInit, OnDestroy {
  nekoPosX = 32;
  nekoPosY = 32;
  mousePosX = 0;
  mousePosY = 0;
  frameCount = 0;
  idleTime = 0;
  idleAnimation: string | null = null;
  idleAnimationFrame = 0;
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
    this.mousePosX = event.clientX;
    this.mousePosY = event.clientY;
  }

  setSprite(name: SpriteDirection, frame: number): void {
    const sprite = this.spriteSets[name][frame % this.spriteSets[name].length];
    if (this.oneko) {
      this.oneko.nativeElement.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
    }
  }

  resetIdleAnimation(): void {
    this.idleAnimation = null;
    this.idleAnimationFrame = 0;
  }

  idle(): void {
    this.idleTime += 1;

    if (this.idleTime > 10 && Math.floor(Math.random() * 200) === 0 && this.idleAnimation === null) {
      this.idleAnimation = ['sleeping', 'scratch'][Math.floor(Math.random() * 2)];
    }

    switch (this.idleAnimation) {
      case 'sleeping':
        if (this.idleAnimationFrame < 8) {
          this.setSprite('tired', 0);
          break;
        }
        this.setSprite('sleeping', Math.floor(this.idleAnimationFrame / 4));
        if (this.idleAnimationFrame > 192) {
          this.resetIdleAnimation();
        }
        break;
      case 'scratch':
        this.setSprite('scratch', this.idleAnimationFrame);
        if (this.idleAnimationFrame > 9) {
          this.resetIdleAnimation();
        }
        break;
      default:
        this.setSprite('idle', 0);
        return;
    }
    this.idleAnimationFrame += 1;
  }

  frame(): void {
    this.frameCount += 1;
    const diffX = this.nekoPosX - this.mousePosX;
    const diffY = this.nekoPosY - this.mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < this.nekoSpeed || distance < 48) {
      this.idle();
      return;
    }

    this.idleAnimation = null;
    this.idleAnimationFrame = 0;

    if (this.idleTime > 1) {
      this.setSprite('alert', 0);
      this.idleTime = Math.min(this.idleTime, 7);
      this.idleTime -= 1;
      return;
    }

    let direction = diffY / distance > 0.5 ? 'N' : '';
    direction += diffY / distance < -0.5 ? 'S' : '';
    direction += diffX / distance > 0.5 ? 'W' : '';
    direction += diffX / distance < -0.5 ? 'E' : '';
    this.setSprite(direction as SpriteDirection, this.frameCount);

    this.nekoPosX -= (diffX / distance) * this.nekoSpeed;
    this.nekoPosY -= (diffY / distance) * this.nekoSpeed;

    if (this.oneko) {
      this.oneko.nativeElement.style.left = `${this.nekoPosX - 16}px`;
      this.oneko.nativeElement.style.top = `${this.nekoPosY - 16}px`;
    }
  }
}