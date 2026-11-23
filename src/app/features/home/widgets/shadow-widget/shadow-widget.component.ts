import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Card3dDirective } from '../../../../shared/directives/card-3d.directive';
import { TileSparklesComponent } from '../../../../shared/ui/tile-sparkles/tile-sparkles.component';

const AUTO_ADVANCE_MS = 8000;

/**
 * Notes tile: rotating quotes that fade in word by word. Visitors can click
 * the quote to advance or jump with the dots; auto-advance pauses while the
 * tile is hovered or focused.
 */
@Component({
  selector: 'app-shadow-widget',
  standalone: true,
  templateUrl: './shadow-widget.component.html',
  styleUrls: ['./shadow-widget.component.scss'],
  imports: [Card3dDirective, TileSparklesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShadowWidgetComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly quotes: string[] = [
    "The world doesn't need heroes, it needs someone to pull the strings from the shadows.",
    'I am the one who lurks in the shadows to hunt the shadows.',
    'I seek neither power nor glory. I only seek to be the Eminence in Shadow.',
    'True power is not in the light, but in the darkness that swallows it.',
    'The hour of awakening is at hand.',
    'I am Atomic.',
  ];

  readonly index = signal(0);
  /** Single-item list keyed by index so the quote element is recreated → animation replays. */
  readonly current = computed(() => [{ key: this.index(), words: this.quotes[this.index()].split(' ') }]);
  readonly counter = computed(() => `${String(this.index() + 1).padStart(2, '0')} / ${String(this.quotes.length).padStart(2, '0')}`);

  private paused = false;
  private timer?: ReturnType<typeof setInterval>;

  constructor() {
    this.restartTimer();
    this.destroyRef.onDestroy(() => clearInterval(this.timer));
  }

  next(): void {
    this.goTo((this.index() + 1) % this.quotes.length);
  }

  goTo(i: number): void {
    this.index.set(i);
    this.restartTimer();
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  private restartTimer(): void {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (!this.paused && !document.hidden) this.index.update((i) => (i + 1) % this.quotes.length);
    }, AUTO_ADVANCE_MS);
  }
}
