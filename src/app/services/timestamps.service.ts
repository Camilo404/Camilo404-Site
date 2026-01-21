import { Injectable } from '@angular/core';
import { Observable, timer, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimestampsService {
  getElapsedTime(startTimestamp: number): Observable<string> {
    return timer(0, 1000).pipe(
      map(() => this.calculateElapsedTime(startTimestamp)),
      map(seconds => this.formatTime(seconds))
    );
  }

  private calculateElapsedTime(start: number): number {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    return Math.max(0, elapsed);
  }

  getTotalDuration(startTimestamp: number, endTimestamp: number): string {
    const totalSeconds = Math.floor((endTimestamp - startTimestamp) / 1000);
    return this.formatTime(totalSeconds);
  }

  getProgressPercentage(startTimestamp: number, endTimestamp: number): Observable<number> {
    return timer(0, 1000).pipe(
      map(() => {
        const totalDuration = endTimestamp - startTimestamp;
        const elapsed = Date.now() - startTimestamp;
        const percentage = (elapsed / totalDuration) * 100;
        return Math.min(100, Math.max(0, percentage));
      })
    );
  }

  private formatTime(totalSeconds: number): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
  
    return hours > 0 
      ? `${hours}:${pad(minutes)}:${pad(seconds)}`
      : `${minutes}:${pad(seconds)}`;
  }
}
