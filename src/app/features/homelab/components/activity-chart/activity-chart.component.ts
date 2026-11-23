import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ServerStatus } from '../../../../core/services/server-status.service';
import { formatClock, formatRate, formatSpan, niceCeil, seriesPath } from '../../../../core/utils/server-format';

type TabId = 'cpu' | 'ram' | 'temp' | 'net';

interface Series {
  id: string;
  name: string;
  color: string;
  dashed?: boolean;
  values: number[];
}

interface ChartView {
  series: Series[];
  min: number;
  max: number;
  format: (v: number) => string;
}

const W = 600;
const H = 200;

const pct = (v: number) => `${v.toFixed(v < 10 ? 1 : 0)}%`;
const deg = (v: number) => `${v.toFixed(1)}°C`;

/**
 * Big time-series card: one tab per vital over everything collected this
 * visit (up to 10 minutes), with a hover crosshair that reads exact values.
 */
@Component({
  selector: 'app-activity-chart',
  standalone: true,
  templateUrl: './activity-chart.component.html',
  styleUrls: ['./activity-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityChartComponent {
  readonly history = input.required<ServerStatus[]>();

  readonly tabs: { id: TabId; label: string }[] = [
    { id: 'cpu', label: 'CPU' },
    { id: 'ram', label: 'Memory' },
    { id: 'temp', label: 'Temperature' },
    { id: 'net', label: 'Network' },
  ];
  readonly tab = signal<TabId>('cpu');
  readonly hoverIdx = signal<number | null>(null);

  readonly W = W;
  readonly H = H;

  readonly view = computed<ChartView>(() => {
    const h = this.history();
    switch (this.tab()) {
      case 'cpu': {
        const values = h.map((s) => s.cpuPercent);
        return { series: [{ id: 'cpu', name: 'CPU', color: '#a58bf0', values }], min: 0, max: Math.min(100, niceCeil(Math.max(5, ...values) * 1.2)), format: pct };
      }
      case 'ram': {
        const values = h.map((s) => s.ramPercent);
        return { series: [{ id: 'ram', name: 'RAM', color: '#ee9cc6', values }], min: 0, max: 100, format: pct };
      }
      case 'temp': {
        const values = h.map((s) => s.tempC);
        const lo = Math.floor((Math.min(...values, 100) - 4) / 5) * 5;
        const hi = Math.ceil((Math.max(...values, 0) + 4) / 5) * 5;
        return { series: [{ id: 'temp', name: 'Temp', color: '#f6b58f', values }], min: Math.max(0, lo), max: hi, format: deg };
      }
      case 'net': {
        const down = h.map((s) => s.netDownBps);
        const up = h.map((s) => s.netUpBps);
        return {
          series: [
            { id: 'down', name: 'Down', color: '#a58bf0', values: down },
            { id: 'up', name: 'Up', color: '#ee9cc6', dashed: true, values: up },
          ],
          min: 0,
          // Nice steps in KiB so the axis reads 20 KB/s, not 19.5
          max: niceCeil((Math.max(1024, ...down, ...up) * 1.15) / 1024) * 1024,
          format: formatRate,
        };
      }
    }
  });

  readonly paths = computed(() => {
    const { series, min, max } = this.view();
    return series.map((s) => ({
      ...s,
      line: seriesPath(s.values, min, max, W, H),
      area: seriesPath(s.values, min, max, W, H, true),
    }));
  });

  /** Gridlines at 0, ½ and full scale, as % from the top. */
  readonly ticks = computed(() => {
    const { min, max, format } = this.view();
    return [1, 0.5, 0].map((f) => ({ top: (1 - f) * 100, label: format(min + (max - min) * f) }));
  });

  /** Now / average / peak of the first series, shown above the plot. */
  readonly stats = computed(() => {
    const { series, format } = this.view();
    const v = series[0]?.values ?? [];
    if (!v.length) return [];
    const avg = v.reduce((a, b) => a + b, 0) / v.length;
    return [
      { label: 'Now', value: format(v.at(-1)!) },
      { label: 'Average', value: format(avg) },
      { label: 'Peak', value: format(Math.max(...v)) },
    ];
  });

  readonly span = computed(() => {
    const h = this.history();
    return h.length > 1 ? formatSpan(h.at(-1)!.timestamp - h[0].timestamp) : '';
  });

  readonly hover = computed(() => {
    const i = this.hoverIdx();
    const h = this.history();
    if (i === null || h.length < 2 || i >= h.length) return null;
    const { series, min, max, format } = this.view();
    const x = (i / (h.length - 1)) * 100;
    return {
      x,
      time: formatClock(h[i].timestamp),
      // Keep the bubble inside the card near the edges
      align: x > 75 ? 'end' : x < 25 ? 'start' : 'mid',
      points: series.map((s) => ({
        name: s.name,
        color: s.color,
        value: format(s.values[i]),
        y: (1 - (Math.min(max, Math.max(min, s.values[i])) - min) / (max - min)) * 100,
      })),
    };
  });

  onMove(event: PointerEvent, plot: HTMLElement): void {
    const n = this.history().length;
    if (n < 2) return;
    const rect = plot.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    this.hoverIdx.set(Math.round(f * (n - 1)));
  }
}
