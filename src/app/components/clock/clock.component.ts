import { Component, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({
    selector: 'app-clock',
    standalone: true,
    templateUrl: './clock.component.html',
    styleUrls: ['./clock.component.scss'],
    imports: []
})
export class ClockComponent {
  private destroyRef = inject(DestroyRef);

  hours = signal<string>('00');
  minutes = signal<string>('00');
  seconds = signal<string>('00');
  ampm = signal<string>('');
  day = signal<string>('');
  fullDate = signal<string>('');

  constructor() {
    // Initial update
    this.updateTime();
    
    // Update every second using RxJS interval with automatic cleanup
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateTime());
  }

  private updateTime(): void {
    const now = new Date();
    
    // Time
    let h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();

    this.ampm.set(h >= 12 ? 'PM' : 'AM');
    h = h % 12;
    h = h ? h : 12; // Handle 0 as 12

    this.hours.set(h < 10 ? '0' + h : h.toString());
    this.minutes.set(m < 10 ? '0' + m : m.toString());
    this.seconds.set(s < 10 ? '0' + s : s.toString());

    // Date
    // Capitalize first letter of day
    const dayStr = now.toLocaleDateString('en-US', { weekday: 'long' });
    this.day.set(dayStr.charAt(0).toUpperCase() + dayStr.slice(1));

    this.fullDate.set(now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }));
  }
}
