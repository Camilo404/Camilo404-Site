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

  strTime: string = '';
  private timerSubscription?: Subscription;

  constructor() { }

  ngOnInit() {
    this.timerSubscription = interval(1000).pipe(
      startWith(0),
      map(() => this.formatTime())
    ).subscribe(time => this.strTime = time);
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  private formatTime(): string {
    const date = new Date();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = hours < 10 ? '0' + hours : hours;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;

    return formattedHours + ':' + formattedMinutes + ':' + formattedSeconds + ' ' + ampm;
  }
}
