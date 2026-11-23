import { Injectable } from '@angular/core';
import { EMPTY, Observable, concat, defer, from, interval, of, throwError } from 'rxjs';
import { catchError, concatWith, map, retry, shareReplay, tap } from 'rxjs/operators';
import { webSocket } from 'rxjs/webSocket';
import { environment } from 'src/environments/environment';

/**
 * Public, sanitised snapshot pushed by rust-server-status over `/ws`:
 * aggregates only — no process names, mount paths or interface names.
 */
export interface ServerStatus {
  online: boolean;
  uptimeSeconds: number;
  cpuPercent: number;
  /** One entry per logical core */
  cpuCores: number[];
  ramPercent: number;
  ramUsedBytes: number;
  ramTotalBytes: number;
  diskPercent: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  /** Hottest sensor */
  tempC: number;
  netUpBps: number;
  netDownBps: number;
  load1: number;
  /** Unix seconds */
  timestamp: number;
}

const TICK_MS = 2000;
const RECONNECT_MS = 5000;
const GiB = 1024 ** 3;
const MOCK_CORES = 12;

/** Random walk that stays inside [min, max]. */
function drift(value: number, step: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value + (Math.random() - 0.5) * 2 * step));
}

/**
 * Live server stats for the Homelab tile.
 *
 * Connects to `environment.serverStatusUrl` (rust-server-status, `wss://…/ws`).
 * While it is empty this emits simulated data instead.
 */
@Injectable({ providedIn: 'root' })
export class ServerStatusService {
  /** True while the tile is showing simulated numbers. */
  readonly isDemo = !environment.serverStatusUrl;

  readonly status$: Observable<ServerStatus> = (this.isDemo ? this.mock() : this.live()).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /**
   * WebSocket stream. The server replays its recent snapshots on connect, so the
   * sparkline fills right away. When the socket drops, the last snapshot is
   * emitted once with `online: false`, then it reconnects every RECONNECT_MS.
   */
  private live(): Observable<ServerStatus> {
    let last: ServerStatus | null = null;
    return defer(() => webSocket<ServerStatus>(environment.serverStatusUrl)).pipe(
      tap((s) => (last = s)),
      // A clean close completes the stream; treat it like an error so we reconnect.
      concatWith(throwError(() => new Error('server-status socket closed'))),
      catchError((err) => {
        const offline = last ? of({ ...last, online: false }) : EMPTY;
        last = null;
        return concat(offline, throwError(() => err));
      }),
      retry({ delay: RECONNECT_MS }),
    );
  }

  private mock(): Observable<ServerStatus> {
    return defer(() => {
      const bootedAt = Date.now() - (12 * 86400 + 4 * 3600 + 23 * 60) * 1000;
      let s: ServerStatus = {
        online: true,
        uptimeSeconds: 0,
        cpuPercent: 18,
        cpuCores: Array.from({ length: MOCK_CORES }, () => 18),
        ramPercent: 46,
        ramUsedBytes: 0,
        ramTotalBytes: 32 * GiB,
        diskPercent: 63.4,
        diskUsedBytes: 0,
        diskTotalBytes: 2000 * GiB,
        tempC: 47,
        netUpBps: 220_000,
        netDownBps: 1_400_000,
        load1: 0.8,
        timestamp: 0,
      };

      const next = (): ServerStatus => {
        const ram = drift(s.ramPercent, 0.6, 38, 62);
        const disk = Math.min(95, s.diskPercent + Math.random() * 0.002);
        // Cores wander on their own; the total is their average, like the real thing
        const cores = s.cpuCores.map((c) => drift(c, 14, 1, 100));
        s = {
          ...s,
          uptimeSeconds: Math.floor((Date.now() - bootedAt) / 1000),
          cpuCores: cores,
          cpuPercent: cores.reduce((a, b) => a + b, 0) / cores.length,
          ramPercent: ram,
          ramUsedBytes: (ram / 100) * s.ramTotalBytes,
          diskPercent: disk,
          diskUsedBytes: (disk / 100) * s.diskTotalBytes,
          tempC: drift(s.tempC, 1.2, 38, 72),
          netUpBps: drift(s.netUpBps, 120_000, 20_000, 2_000_000),
          netDownBps: drift(s.netDownBps, 700_000, 80_000, 12_000_000),
          load1: drift(s.load1, 0.15, 0.1, 3.5),
          timestamp: Math.floor(Date.now() / 1000),
        };
        return s;
      };

      // Backfill a minute of history so the sparkline isn't empty on load
      const backfill = Array.from({ length: 30 }, () => next());
      return concat(from(backfill), interval(TICK_MS).pipe(map(() => next())));
    });
  }
}
