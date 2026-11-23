import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { seriesPath } from '../../../../core/utils/server-format';

/**
 * One vital on the dashboard hero: ring + reading, with a sparkline of the
 * recent history underneath and the peak over that window.
 */
@Component({
  selector: 'app-metric-card',
  standalone: true,
  templateUrl: './metric-card.component.html',
  styleUrls: ['./metric-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly sub = input('');
  /** 0–100, how full the ring is */
  readonly fill = input(0);
  readonly color = input('#a58bf0');
  readonly hot = input(false);
  /** Recent values for the sparkline, already in the ring's 0–100 scale */
  readonly series = input<number[]>([]);
  readonly peak = input('');

  /** Sparkline scale: fit the data, but never stretch noise across the whole box. */
  private readonly range = computed(() => {
    const s = this.series();
    if (!s.length) return [0, 100] as const;
    const lo = Math.min(...s);
    const hi = Math.max(...s);
    const pad = Math.max(4, (hi - lo) * 0.25);
    return [Math.max(0, lo - pad), Math.min(100, hi + pad)] as const;
  });

  readonly area = computed(() => {
    const [lo, hi] = this.range();
    return seriesPath(this.series(), lo, hi, 100, 28, true);
  });
  readonly line = computed(() => {
    const [lo, hi] = this.range();
    return seriesPath(this.series(), lo, hi, 100, 28);
  });
}
