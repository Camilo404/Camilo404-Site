import { Component, Input, ViewChild, ElementRef, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({
  selector: 'app-clock-widget',
  standalone: true,
  templateUrl: './clock-widget.component.html',
  styleUrls: ['./clock-widget.component.scss'],
  imports: []
})
export class ClockWidgetComponent {
  @Input() nameplateVideoUrl: string | null = null;

  @ViewChild('nameplateVideo') nameplateVideoRef?: ElementRef<HTMLVideoElement>;

  private destroyRef = inject(DestroyRef);

  hours = signal<string>('00');
  minutes = signal<string>('00');
  seconds = signal<string>('00');
  ampm = signal<string>('');
  day = signal<string>('');
  fullDate = signal<string>('');

  constructor() {
    this.updateTime();
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateTime());
  }

  private updateTime(): void {
    const now = new Date();

    let h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();

    this.ampm.set(h >= 12 ? 'PM' : 'AM');
    h = h % 12;
    h = h ? h : 12;

    this.hours.set(h < 10 ? '0' + h : h.toString());
    this.minutes.set(m < 10 ? '0' + m : m.toString());
    this.seconds.set(s < 10 ? '0' + s : s.toString());

    const dayStr = now.toLocaleDateString('en-US', { weekday: 'long' });
    this.day.set(dayStr.charAt(0).toUpperCase() + dayStr.slice(1));
    this.fullDate.set(now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }));
  }

  onVideoCanPlay(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (video.paused && this.nameplateVideoUrl) {
      video.play().catch((error) => {
        console.warn('Autoplay bloqueado por el navegador:', error);
      });
    }
  }

  onVideoLoaded(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (this.nameplateVideoUrl) {
      video.play().catch((error) => {
        console.debug('Reproducción en loadeddata falló, esperando canplay...', error);
      });
    }
  }

  onVideoError(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (video.error && this.nameplateVideoUrl) {
      console.error('Error al cargar el video del nameplate:', video.error);
    }
  }
}
