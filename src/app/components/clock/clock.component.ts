import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-clock',
  templateUrl: './clock.component.html',
  styleUrls: ['./clock.component.scss'],
  standalone: false
})
export class ClockComponent implements OnInit, OnDestroy {

  hours: string = '00';
  minutes: string = '00';
  seconds: string = '00';
  ampm: string = '';
  day: string = '';
  fullDate: string = '';

  private timerSubscription?: Subscription;

  constructor() { }

  ngOnInit() {
    this.timerSubscription = interval(1000).pipe(
      startWith(0),
      map(() => this.updateTime())
    ).subscribe();
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  private updateTime(): void {
    const now = new Date();
    
    // Time
    let h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();

    this.ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // Handle 0 as 12

    this.hours = h < 10 ? '0' + h : h.toString();
    this.minutes = m < 10 ? '0' + m : m.toString();
    this.seconds = s < 10 ? '0' + s : s.toString();

    // Date
    // Capitalize first letter of day
    const dayStr = now.toLocaleDateString('en-US', { weekday: 'long' });
    this.day = dayStr.charAt(0).toUpperCase() + dayStr.slice(1);

    this.fullDate = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
