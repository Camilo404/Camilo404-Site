import { Component, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { Card3dDirective } from '../../../../shared/directives/card-3d.directive';

/** The site owner's time zone (Medellín uses Bogotá's zone) — the clock shows *my* time, not the visitor's. */
const MY_TIME_ZONE = 'America/Bogota';
const MY_PLACE = 'Medellín, CO';

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: MY_TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hourCycle: 'h23',
});

@Component({
  selector: 'app-clock-widget',
  standalone: true,
  templateUrl: './clock-widget.component.html',
  styleUrls: ['./clock-widget.component.scss'],
  imports: [Card3dDirective, FontAwesomeModule]
})
export class ClockWidgetComponent {
  private destroyRef = inject(DestroyRef);

  hours = signal<string>('00');
  minutes = signal<string>('00');
  seconds = signal<string>('00');
  ampm = signal<string>('');
  day = signal<string>('');
  fullDate = signal<string>('');

  readonly place = MY_PLACE;
  readonly faSun = faSun;
  readonly faMoon = faMoon;
  /** Hour 0–23 in my time zone. */
  private readonly hour24 = signal(0);
  readonly isDay = computed(() => this.hour24() >= 6 && this.hour24() < 18);
  /** Difference between my zone and the visitor's, in minutes (positive = visitor ahead). */
  private readonly offsetDiff = signal(0);
  readonly diffLabel = computed(() => {
    const diff = this.offsetDiff();
    if (diff === 0) return 'Same time as you';
    const abs = Math.abs(diff);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    const amount = m ? `${h}h ${m}m` : `${h}h`;
    return diff > 0 ? `You're ${amount} ahead` : `You're ${amount} behind`;
  });

  /** 0–9 strip rendered inside each odometer slot. */
  readonly strip = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  readonly hourDigits = computed(() => this.hours().split('').map(Number));
  readonly minuteDigits = computed(() => this.minutes().split('').map(Number));
  readonly secondDigits = computed(() => this.seconds().split('').map(Number));
  /**
   * Analog hand angles from local seconds since the epoch. They only ever grow,
   * so the CSS transition never spins a hand backwards at :00.
   */
  private readonly localSeconds = signal(0);
  readonly secondAngle = computed(() => Math.floor(this.localSeconds()) * 6);
  readonly minuteAngle = computed(() => this.localSeconds() / 10);
  readonly hourAngle = computed(() => this.localSeconds() / 120);
  readonly ticks = Array.from({ length: 12 }, (_, i) => i * 30);

  readonly spokenTime = computed(() => `${this.hours()}:${this.minutes()} ${this.ampm()}`);

  constructor() {
    this.updateTime();
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateTime());
  }

  private updateTime(): void {
    const now = new Date();
    const p = Object.fromEntries(partsFormatter.formatToParts(now).map((x) => [x.type, x.value]));
    const year = +p['year'];
    const month = +p['month'];
    const dayNum = +p['day'];
    const h24 = +p['hour'];
    const m = +p['minute'];
    const s = +p['second'];

    // My UTC offset (minutes) = wall clock in my zone read as UTC, minus real UTC
    const myOffset = Math.round((Date.UTC(year, month - 1, dayNum, h24, m, s) - Math.floor(now.getTime() / 1000) * 1000) / 60000);
    const visitorOffset = -now.getTimezoneOffset();
    this.offsetDiff.set(visitorOffset - myOffset);

    // Monotonic seconds in my zone → analog hands never spin backwards
    this.localSeconds.set(Math.floor(now.getTime() / 1000) + myOffset * 60);
    this.hour24.set(h24);

    this.ampm.set(h24 >= 12 ? 'PM' : 'AM');
    const h12 = h24 % 12 || 12;
    const pad = (n: number) => n.toString().padStart(2, '0');
    this.hours.set(pad(h12));
    this.minutes.set(pad(m));
    this.seconds.set(pad(s));

    this.day.set(now.toLocaleDateString('en-US', { weekday: 'long', timeZone: MY_TIME_ZONE }));
    this.fullDate.set(now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: MY_TIME_ZONE }));
  }
}
