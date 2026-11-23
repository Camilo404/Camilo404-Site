import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';

/** Medellín; the API resolves the nearest grid cell. */
const LAT = 6.2529;
const LON = -75.5646;
const TIME_ZONE = 'America/Bogota';
/** Open-Meteo refreshes "current" every 15 min. */
const REFRESH_MS = 15 * 60 * 1000;
/**
 * Models flag 0.1 mm as "drizzle" (code 51) all the time over the valley's
 * mountain clouds. Below this, ignore the precipitation and describe the sky
 * from cloud cover instead.
 */
const MIN_RAIN_MM = 0.2;

export type WeatherKind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'storm' | 'snow';

export interface Weather {
  tempC: number;
  kind: WeatherKind;
  label: string;
  /** Minutes after local midnight */
  sunrise: number;
  sunset: number;
}

interface ApiResponse {
  current: { temperature_2m: number; weather_code: number; precipitation: number; cloud_cover: number };
  daily: { sunrise: string[]; sunset: string[] };
}

/** WMO weather code → our coarse kind + a short label. */
function describe(code: number): { kind: WeatherKind; label: string } {
  if (code === 0) return { kind: 'clear', label: 'Clear' };
  if (code === 1) return { kind: 'partly', label: 'Mostly clear' };
  if (code === 2) return { kind: 'partly', label: 'Partly cloudy' };
  if (code === 3) return { kind: 'cloudy', label: 'Cloudy' };
  if (code === 45 || code === 48) return { kind: 'fog', label: 'Foggy' };
  if (code >= 51 && code <= 57) return { kind: 'drizzle', label: 'Drizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { kind: 'rain', label: 'Rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { kind: 'snow', label: 'Snow' };
  if (code >= 95) return { kind: 'storm', label: 'Thunderstorm' };
  return { kind: 'partly', label: 'Fair' };
}

/** Codes that only mean "it's wet": drizzle, rain, showers. */
const isWetCode = (code: number) => (code >= 51 && code <= 67) || (code >= 80 && code <= 82);

/** Trace precipitation → read the sky from cloud cover instead of the wet code. */
function effectiveCode(code: number, precipitation: number, cloudCover: number): number {
  if (!isWetCode(code) || precipitation >= MIN_RAIN_MM) return code;
  if (cloudCover < 20) return 0;
  if (cloudCover < 60) return 2;
  return 3;
}

/** "2026-11-23T05:54" → 354 */
function minutesOf(iso: string | undefined, fallback: number): number {
  const m = iso?.match(/T(\d{2}):(\d{2})/);
  return m ? +m[1] * 60 + +m[2] : fallback;
}

/**
 * Current weather in Medellín from Open-Meteo (free, keyless, CORS open).
 * Shared and refreshed every 15 minutes; emits null when unavailable.
 */
@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);

  private readonly url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${LAT}&longitude=${LON}` +
    '&current=temperature_2m,weather_code,precipitation,cloud_cover&daily=sunrise,sunset&forecast_days=1' +
    `&timezone=${encodeURIComponent(TIME_ZONE)}`;

  readonly weather$: Observable<Weather | null> = timer(0, REFRESH_MS).pipe(
    switchMap(() =>
      this.http.get<ApiResponse>(this.url).pipe(
        map((r): Weather => ({
          tempC: Math.round(r.current.temperature_2m),
          ...describe(effectiveCode(r.current.weather_code, r.current.precipitation ?? 0, r.current.cloud_cover ?? 0)),
          sunrise: minutesOf(r.daily?.sunrise?.[0], 6 * 60),
          sunset: minutesOf(r.daily?.sunset?.[0], 18 * 60),
        })),
        catchError(() => of(null)),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
