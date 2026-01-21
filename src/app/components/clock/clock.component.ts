import { Component, signal, effect } from '@angular/core';

@Component({
    selector: 'app-clock',
    templateUrl: './clock.component.html',
    styleUrls: ['./clock.component.scss'],
    imports: []
})
export class ClockComponent {
  hours = signal<string>('00');
  minutes = signal<string>('00');
  seconds = signal<string>('00');
  ampm = signal<string>('');
  day = signal<string>('');
  fullDate = signal<string>('');

  private intervalId?: ReturnType<typeof setInterval>;

  constructor() {
    this.updateTime();
    this.intervalId = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
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
