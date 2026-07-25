import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';

/**
 * Types out a title one char at a time with a cycling cursor glyph, and pauses
 * itself while the tab is hidden (no background CPU wakeups).
 */
@Injectable({ providedIn: 'root' })
export class TitleAnimatorService {
  private readonly titleService = inject(Title);

  private readonly text = 'C a m i l o 4 0 4';
  private readonly cursors = ['/', '$', '\\', '|', '$'];
  private readonly intervalMs = 250;

  private charIndex = 0;
  private cursorIndex = 0;
  private timer?: ReturnType<typeof setInterval>;
  private readonly onVisibilityChange = () => this.sync();

  start(): void {
    this.tick();
    this.sync();
    document.addEventListener('visibilitychange', this.onVisibilityChange, false);
  }

  stop(): void {
    this.pause();
    document.removeEventListener('visibilitychange', this.onVisibilityChange, false);
  }

  private sync(): void {
    if (document.hidden) {
      this.pause();
    } else if (!this.timer) {
      this.timer = setInterval(() => this.tick(), this.intervalMs);
    }
  }

  private pause(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private tick(): void {
    if (this.charIndex > this.text.length) {
      this.charIndex = 0;
      this.cursorIndex = 0;
    }
    if (this.cursorIndex > 3) {
      this.charIndex++;
      this.cursorIndex = 0;
    }
    this.titleService.setTitle(this.text.substring(0, this.charIndex) + this.cursors[this.cursorIndex]);
    this.cursorIndex++;
  }
}
