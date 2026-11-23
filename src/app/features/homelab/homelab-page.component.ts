import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { interval, map } from 'rxjs';
import { faHouse, faLink } from '@fortawesome/free-solid-svg-icons';
import { ServerStatusService } from '../../core/services/server-status.service';
import { formatBytes, formatRate, formatSpan, formatUptime, tempFill } from '../../core/utils/server-format';
import { TooltipDirective } from '../../shared/directives/tooltip.directive';
import { CommandPaletteComponent, PaletteCommand } from '../home/components/command-palette/command-palette.component';
import { ActivityChartComponent } from './components/activity-chart/activity-chart.component';
import { MetricCardComponent } from './components/metric-card/metric-card.component';

/** Points in the hero sparklines (× 2 s ≈ 1 minute). */
const SPARK_POINTS = 30;
/** Uptime dots shown before collapsing into "+N". */
const MAX_DAY_DOTS = 30;

interface Metric {
  id: string;
  label: string;
  value: string;
  sub: string;
  fill: number;
  color: string;
  hot: boolean;
  series: number[];
  peak: string;
}

/** /homelab: the full server dashboard, reached from the home summary tile or ⌘K. */
@Component({
  selector: 'app-homelab-page',
  standalone: true,
  templateUrl: './homelab-page.component.html',
  styleUrls: ['./homelab-page.component.scss'],
  imports: [
    RouterLink,
    CommandPaletteComponent,
    TooltipDirective,
    MetricCardComponent,
    ActivityChartComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomelabPageComponent {
  private readonly router = inject(Router);
  private readonly service = inject(ServerStatusService);

  readonly palette = viewChild(CommandPaletteComponent);
  readonly isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  readonly isDemo = this.service.isDemo;

  readonly history = this.service.history;
  readonly status = computed(() => this.history().at(-1) ?? null);
  readonly online = computed(() => this.status()?.online ?? false);

  /** Ticks every second so "updated Xs ago" stays honest. */
  private readonly now = toSignal(interval(1000).pipe(map(() => Date.now() / 1000)), { initialValue: Date.now() / 1000 });

  readonly updatedAgo = computed(() => {
    const s = this.status();
    if (!s) return '';
    const ago = Math.max(0, Math.round(this.now() - s.timestamp));
    return ago <= 2 ? 'just now' : `${formatSpan(ago)} ago`;
  });

  /** A friendly one-liner for visitors who don't care about percentages. */
  readonly mood = computed(() => {
    const s = this.status();
    if (!s) return { face: '(・・ )?', text: 'Waking up the server…' };
    if (!s.online) return { face: '(－_－) zzZ', text: 'Offline right now. These are the last numbers it sent.' };
    if (s.tempC > 75) return { face: '(;´Д`)', text: 'Running hot. Somebody open a window.' };
    if (s.cpuPercent > 75) return { face: '(ง •̀_•́)ง', text: 'Working really hard right now.' };
    if (s.cpuPercent > 35) return { face: '( •̀ ω •́ )', text: 'Busy, but handling it.' };
    if (s.cpuPercent > 10) return { face: '(｡•̀ᴗ-)', text: 'Cruising along.' };
    return { face: '(˘ω˘)', text: 'Taking it easy. Barely lifting a finger.' };
  });

  /** Hardware line derived from the totals the server reports. */
  readonly specs = computed(() => {
    const s = this.status();
    if (!s) return [];
    return [`${s.cpuCores.length} threads`, `${formatBytes(s.ramTotalBytes, 0)} RAM`, `${formatBytes(s.diskTotalBytes, 0)} disk`];
  });

  readonly metrics = computed<Metric[]>(() => {
    const s = this.status();
    if (!s) return [];
    const h = this.history();
    const recent = h.slice(-SPARK_POINTS);
    const peak = (values: number[], fmt: (v: number) => string) => `peak ${fmt(Math.max(...values))} · ${this.windowLabel()}`;
    const pct = (v: number) => `${Math.round(v)}%`;
    return [
      {
        id: 'cpu', label: 'CPU', value: pct(s.cpuPercent), sub: `load ${s.load1.toFixed(2)}`, fill: s.cpuPercent,
        color: '#a58bf0', hot: s.cpuPercent > 80, series: recent.map((x) => x.cpuPercent), peak: peak(h.map((x) => x.cpuPercent), pct),
      },
      {
        id: 'ram', label: 'Memory', value: pct(s.ramPercent), sub: `${formatBytes(s.ramUsedBytes)} used`, fill: s.ramPercent,
        color: '#ee9cc6', hot: s.ramPercent > 85, series: recent.map((x) => x.ramPercent), peak: peak(h.map((x) => x.ramPercent), pct),
      },
      {
        id: 'disk', label: 'Disk', value: pct(s.diskPercent), sub: `${formatBytes(s.diskTotalBytes - s.diskUsedBytes, 0)} free`, fill: s.diskPercent,
        color: '#8fc0f2', hot: s.diskPercent > 90, series: recent.map((x) => x.diskPercent), peak: '',
      },
      {
        id: 'temp', label: 'Temp', value: `${Math.round(s.tempC)}°C`, sub: 'hottest sensor', fill: tempFill(s.tempC),
        color: '#f6b58f', hot: s.tempC > 75, series: recent.map((x) => tempFill(x.tempC)), peak: peak(h.map((x) => x.tempC), (v) => `${Math.round(v)}°`),
      },
    ];
  });

  /** How much history the page has, e.g. "4m 10s". */
  private readonly windowLabel = computed(() => {
    const h = this.history();
    return h.length > 1 ? formatSpan(h.at(-1)!.timestamp - h[0].timestamp) : 'now';
  });

  // ---------- Cores ----------
  readonly cores = computed(() => {
    const c = this.status()?.cpuCores ?? [];
    const busiest = c.length ? c.indexOf(Math.max(...c)) : -1;
    return c.map((load, i) => ({ i, load, busiest: i === busiest && load >= 1 }));
  });
  readonly busiestCore = computed(() => this.cores().find((c) => c.busiest) ?? null);

  // ---------- Network ----------
  readonly network = computed(() => {
    const s = this.status();
    const h = this.history();
    if (!s) return null;
    // Integrate rate × time between snapshots for "transferred"
    let down = 0;
    let up = 0;
    for (let i = 1; i < h.length; i++) {
      const dt = h[i].timestamp - h[i - 1].timestamp;
      if (dt <= 0 || dt > 30) continue;
      down += h[i].netDownBps * dt;
      up += h[i].netUpBps * dt;
    }
    return {
      down: formatRate(s.netDownBps),
      up: formatRate(s.netUpBps),
      downTotal: formatBytes(down),
      upTotal: formatBytes(up),
      downPeak: formatRate(Math.max(...h.map((x) => x.netDownBps))),
      upPeak: formatRate(Math.max(...h.map((x) => x.netUpBps))),
      window: this.windowLabel(),
    };
  });

  // ---------- Memory & storage ----------
  readonly storage = computed(() => {
    const s = this.status();
    if (!s) return [];
    return [
      { id: 'ram', label: 'Memory', used: formatBytes(s.ramUsedBytes), total: formatBytes(s.ramTotalBytes, 0), free: formatBytes(s.ramTotalBytes - s.ramUsedBytes), pct: s.ramPercent, color: '#ee9cc6' },
      { id: 'disk', label: 'Disk', used: formatBytes(s.diskUsedBytes, 0), total: formatBytes(s.diskTotalBytes, 0), free: formatBytes(s.diskTotalBytes - s.diskUsedBytes, 0), pct: s.diskPercent, color: '#8fc0f2' },
    ];
  });

  // ---------- Uptime ----------
  readonly uptime = computed(() => {
    const s = this.status();
    if (!s) return null;
    const days = Math.floor(s.uptimeSeconds / 86400);
    const booted = new Date((s.timestamp - s.uptimeSeconds) * 1000);
    return {
      days,
      short: formatUptime(s.uptimeSeconds),
      since: booted.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      dots: Array.from({ length: Math.min(days, MAX_DAY_DOTS) }, (_, i) => i),
      extra: Math.max(0, days - MAX_DAY_DOTS),
    };
  });

  readonly commands: PaletteCommand[] = [
    { id: 'home', group: 'Go to', label: 'Home', hint: 'camilo404', icon: faHouse, keywords: 'back profile main', run: () => void this.router.navigateByUrl('/') },
    { id: 'copy-link', group: 'Actions', label: 'Copy link to this page', icon: faLink, keywords: 'share url clipboard', run: () => this.copy(location.href) },
  ];

  private async copy(text: string): Promise<string> {
    try {
      await navigator.clipboard.writeText(text);
      return 'Link copied';
    } catch {
      return 'Could not access the clipboard';
    }
  }
}
