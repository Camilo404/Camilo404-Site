import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-clock',
  templateUrl: './clock.component.html',
  styleUrls: ['./clock.component.scss']
})
export class ClockComponent implements OnInit, OnDestroy {

  strTime: string = '';
  private timerSubscription?: Subscription;

  constructor() { }

  ngOnInit() {
    // Optimized: Use RxJS interval instead of setInterval
    // Update every 1 second but with proper subscription management
    this.timerSubscription = interval(1000).pipe(
      startWith(0), // Emit immediately
      map(() => this.formatTime())
    ).subscribe(time => this.strTime = time);
  }

  ngOnDestroy() {
    // Prevent memory leaks by unsubscribing
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  private formatTime(): string {
    // Obtener la hora local
    const date = new Date();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    // Convertir a formato de 12 horas
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // La hora '0' debe ser '12'
    const formattedHours = hours < 10 ? '0' + hours : hours;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;

    return formattedHours + ':' + formattedMinutes + ':' + formattedSeconds + ' ' + ampm;
  }
}
