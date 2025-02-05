import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, timer, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TimestampsService implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getElapsedTime(startTimestamp: number): Observable<string> {
    return timer(0, 1000).pipe(
      takeUntil(this.destroy$),
      map(() => this.calculateElapsedTime(startTimestamp)),
      map(seconds => this.formatTime(seconds))
    );
  }

  private calculateElapsedTime(start: number): number {
    return Math.floor((Date.now() - start) / 1000);
  }

  private formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map(v => v.toString().padStart(2, '0'))
      .filter((_, i) => i > 0 || hours > 0)
      .join(':');
  }
}