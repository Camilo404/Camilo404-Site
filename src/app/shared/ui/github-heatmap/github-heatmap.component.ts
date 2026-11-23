import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { ContributionDay, GithubContributionsService } from 'src/app/core/services/github-contributions.service';
import { TooltipDirective } from '../../directives/tooltip.directive';

/** Placeholder cell while loading (keeps the grid's footprint, no layout jump). */
interface Cell {
  date: string;
  count: number;
  level: number;
  empty?: boolean;
}

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/**
 * Compact GitHub contribution calendar: the last `weeks` weeks, one column per
 * week (Sun → Sat), pastel levels. Hidden entirely if the data can't load.
 */
@Component({
  selector: 'app-github-heatmap',
  standalone: true,
  templateUrl: './github-heatmap.component.html',
  styleUrls: ['./github-heatmap.component.scss'],
  imports: [FontAwesomeModule, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GithubHeatmapComponent {
  readonly user = input.required<string>();
  readonly weeks = input(20);

  private readonly service = inject(GithubContributionsService);
  readonly faGithub = faGithub;

  /** undefined = loading, null = failed, otherwise the data */
  private readonly data = toSignal(
    toObservable(this.user).pipe(switchMap((u) => this.service.getLastYear(u))),
    { initialValue: undefined },
  );

  readonly failed = computed(() => this.data() === null);
  readonly loading = computed(() => this.data() === undefined);
  readonly total = computed(() => this.data()?.total ?? 0);
  readonly profileUrl = computed(() => `https://github.com/${this.user()}`);

  /**
   * Cells laid out column-major (grid-auto-flow: column), starting on the
   * Sunday `weeks` weeks back so every column is a whole week; the current
   * week is cut at today.
   */
  readonly cells = computed<Cell[]>(() => {
    const weeks = this.weeks();
    const days = this.data()?.days;
    if (!days?.length) {
      return Array.from({ length: weeks * 7 }, (_, i) => ({ date: String(i), count: 0, level: 0, empty: true }));
    }

    const last = days[days.length - 1];
    const lastDow = new Date(last.date + 'T00:00:00Z').getUTCDay();
    const span = (weeks - 1) * 7 + lastDow + 1;
    return days.slice(-span);
  });

  label(day: ContributionDay): string {
    const when = dateFmt.format(new Date(day.date + 'T00:00:00Z'));
    if (!day.count) return `No contributions · ${when}`;
    return `${day.count} contribution${day.count === 1 ? '' : 's'} · ${when}`;
  }
}
