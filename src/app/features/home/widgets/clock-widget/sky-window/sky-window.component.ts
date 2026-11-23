import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { WeatherKind, WeatherService } from 'src/app/core/services/weather.service';
import { TooltipDirective } from 'src/app/shared/directives/tooltip.directive';

type Phase = 'night' | 'dawn' | 'day' | 'dusk';

/** Minutes around sunrise/sunset painted as dawn/dusk. */
const TWILIGHT = 40;
const DEFAULT_SUNRISE = 6 * 60;
const DEFAULT_SUNSET = 18 * 60;

/**
 * Little round window onto Medellín's sky, replacing the analog clock:
 * the sky colour follows the time of day, the sun (or moon) travels an arc
 * between sunrise and sunset, and clouds / rain / fog / lightning follow the
 * live weather. A pill shows the temperature.
 */
@Component({
  selector: 'app-sky-window',
  standalone: true,
  templateUrl: './sky-window.component.html',
  styleUrls: ['./sky-window.component.scss'],
  imports: [TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkyWindowComponent {
  /** Minutes after midnight in my time zone (fractional is fine). */
  readonly minute = input.required<number>();

  private readonly weatherService = inject(WeatherService);
  readonly weather = toSignal(this.weatherService.weather$, { initialValue: null });

  private readonly sunrise = computed(() => this.weather()?.sunrise ?? DEFAULT_SUNRISE);
  private readonly sunset = computed(() => this.weather()?.sunset ?? DEFAULT_SUNSET);

  readonly isDay = computed(() => this.minute() >= this.sunrise() && this.minute() < this.sunset());

  readonly phase = computed<Phase>(() => {
    const m = this.minute();
    if (Math.abs(m - this.sunrise()) <= TWILIGHT) return 'dawn';
    if (Math.abs(m - this.sunset()) <= TWILIGHT) return 'dusk';
    return this.isDay() ? 'day' : 'night';
  });

  readonly kind = computed<WeatherKind>(() => this.weather()?.kind ?? 'clear');

  /** 0 → 1 across the current day or night. */
  private readonly progress = computed(() => {
    const m = this.minute();
    const rise = this.sunrise();
    const set = this.sunset();
    if (this.isDay()) return (m - rise) / (set - rise);
    const nightLength = 1440 - (set - rise);
    return ((m - set + 1440) % 1440) / nightLength;
  });

  /** Orb position (% of the window) along a low arc; near the edges it sinks behind the hills. */
  readonly orbX = computed(() => 12 + 76 * this.progress());
  readonly orbY = computed(() => 66 - 46 * Math.sin(Math.PI * this.progress()));

  readonly ariaLabel = computed(() => {
    const w = this.weather();
    const when = { night: 'Night', dawn: 'Sunrise', day: 'Daytime', dusk: 'Sunset' }[this.phase()];
    return w ? `${when} in Medellín, ${w.label.toLowerCase()}, ${w.tempC}°C` : `${when} in Medellín`;
  });

  readonly stars = [
    { x: 22, y: 20, s: 0.55 },
    { x: 70, y: 16, s: 0.7 },
    { x: 48, y: 30, s: 0.45 },
    { x: 82, y: 38, s: 0.5 },
    { x: 30, y: 42, s: 0.4 },
    { x: 60, y: 46, s: 0.35 },
  ];
  readonly drops = Array.from({ length: 12 }, (_, i) => i);
}
