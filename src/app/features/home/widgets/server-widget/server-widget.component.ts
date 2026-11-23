import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { scan } from 'rxjs/operators';
import { ServerStatus, ServerStatusService } from '../../../../core/services/server-status.service';
import { Card3dDirective } from '../../../../shared/directives/card-3d.directive';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';
import { TileSparklesComponent } from '../../../../shared/ui/tile-sparkles/tile-sparkles.component';

/** Points kept for the network sparkline (× 2 s ≈ 1 minute). */
const HISTORY = 30;
/** Temperature ring range: 30 °C empty → 90 °C full. */
const TEMP_MIN = 30;
const TEMP_MAX = 90;

interface Gauge {
  id: string;
  label: string;
  /** 0–100, how full the ring is */
  fill: number;
  value: string;
  sub: string;
  color: string;
  /** Turns the ring warm above this fill */
  hot: boolean;
}

function formatBytes(bytes: number, digits = 1): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : digits)} ${units[i]}`;
}

function formatRate(bps: number): string {
  return `${formatBytes(bps)}/s`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

/** SVG path for an area sparkline in a 100 × 30 box, scaled to `max`. */
function sparkPath(values: number[], max: number, closed: boolean): string {
  if (values.length < 2 || max <= 0) return '';
  const step = 100 / (HISTORY - 1);
  const offset = (HISTORY - values.length) * step;
  const pts = values.map((v, i) => `${(offset + i * step).toFixed(2)},${(28 - (v / max) * 26).toFixed(2)}`);
  const line = `M${pts.join(' L')}`;
  return closed ? `${line} L100,30 L${offset.toFixed(2)},30 Z` : line;
}

/**
 * Homelab tile: live stats of my home server (CPU, RAM, disk, temperature,
 * network), streamed from rust-server-status. Falls back to simulated data
 * while `serverStatusUrl` is empty — see ServerStatusService.
 */
@Component({
  selector: 'app-server-widget',
  standalone: true,
  templateUrl: './server-widget.component.html',
  styleUrls: ['./server-widget.component.scss'],
  imports: [Card3dDirective, TooltipDirective, TileSparklesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerWidgetComponent {
  private readonly service = inject(ServerStatusService);
  readonly isDemo = this.service.isDemo;

  /**
   * Rolling window of snapshots for the sparkline. One subscription only:
   * the stream is shareReplay(1), so a second subscriber would miss the backfill.
   */
  private readonly history = toSignal(
    this.service.status$.pipe(scan((acc: ServerStatus[], s) => [...acc, s].slice(-HISTORY), [])),
    { initialValue: [] as ServerStatus[] },
  );
  readonly status = computed(() => this.history().at(-1) ?? null);

  readonly online = computed(() => this.status()?.online ?? false);
  readonly uptime = computed(() => formatUptime(this.status()?.uptimeSeconds ?? 0));

  readonly gauges = computed<Gauge[]>(() => {
    const s = this.status();
    if (!s) return [];
    const tempFill = ((s.tempC - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * 100;
    return [
      { id: 'cpu', label: 'CPU', fill: s.cpuPercent, value: `${Math.round(s.cpuPercent)}%`, sub: `${s.cpuCores.length} cores · load ${s.load1.toFixed(2)}`, color: '#a58bf0', hot: s.cpuPercent > 80 },
      { id: 'ram', label: 'RAM', fill: s.ramPercent, value: `${Math.round(s.ramPercent)}%`, sub: `${formatBytes(s.ramUsedBytes)} / ${formatBytes(s.ramTotalBytes, 0)}`, color: '#ee9cc6', hot: s.ramPercent > 85 },
      { id: 'disk', label: 'Disk', fill: s.diskPercent, value: `${Math.round(s.diskPercent)}%`, sub: `${formatBytes(s.diskUsedBytes, 2)} / ${formatBytes(s.diskTotalBytes, 0)}`, color: '#8fc0f2', hot: s.diskPercent > 90 },
      { id: 'temp', label: 'Temp', fill: Math.max(0, Math.min(100, tempFill)), value: `${Math.round(s.tempC)}°`, sub: 'hottest sensor', color: '#f6b58f', hot: s.tempC > 75 },
    ];
  });

  readonly upRate = computed(() => formatRate(this.status()?.netUpBps ?? 0));
  readonly downRate = computed(() => formatRate(this.status()?.netDownBps ?? 0));

  /** Both series share one scale so their heights are comparable. */
  private readonly netMax = computed(() =>
    Math.max(1, ...this.history().flatMap((s) => [s.netUpBps, s.netDownBps])) * 1.1,
  );
  readonly downArea = computed(() => sparkPath(this.history().map((s) => s.netDownBps), this.netMax(), true));
  readonly downLine = computed(() => sparkPath(this.history().map((s) => s.netDownBps), this.netMax(), false));
  readonly upLine = computed(() => sparkPath(this.history().map((s) => s.netUpBps), this.netMax(), false));
}
