import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ServerStatusService } from '../../../../core/services/server-status.service';
import { formatUptime, tempFill } from '../../../../core/utils/server-format';
import { Card3dDirective } from '../../../../shared/directives/card-3d.directive';
import { TileSparklesComponent } from '../../../../shared/ui/tile-sparkles/tile-sparkles.component';

interface Meter {
  id: string;
  label: string;
  /** 0–100 */
  fill: number;
  value: string;
  color: string;
  hot: boolean;
}

/**
 * Glanceable Homelab summary for the home bento: one bar per vital.
 * The whole card links to the full dashboard at /homelab.
 */
@Component({
  selector: 'app-homelab-mini-widget',
  standalone: true,
  templateUrl: './homelab-mini-widget.component.html',
  styleUrls: ['./homelab-mini-widget.component.scss'],
  imports: [RouterLink, Card3dDirective, TileSparklesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomelabMiniWidgetComponent {
  private readonly status = toSignal(inject(ServerStatusService).status$, { initialValue: null });

  readonly online = computed(() => this.status()?.online ?? false);
  readonly uptime = computed(() => formatUptime(this.status()?.uptimeSeconds ?? 0));

  readonly meters = computed<Meter[]>(() => {
    const s = this.status();
    if (!s) return [];
    return [
      { id: 'cpu', label: 'CPU', fill: s.cpuPercent, value: `${Math.round(s.cpuPercent)}%`, color: '#a58bf0', hot: s.cpuPercent > 80 },
      { id: 'ram', label: 'RAM', fill: s.ramPercent, value: `${Math.round(s.ramPercent)}%`, color: '#ee9cc6', hot: s.ramPercent > 85 },
      { id: 'disk', label: 'Disk', fill: s.diskPercent, value: `${Math.round(s.diskPercent)}%`, color: '#8fc0f2', hot: s.diskPercent > 90 },
      { id: 'temp', label: 'Temp', fill: tempFill(s.tempC), value: `${Math.round(s.tempC)}°`, color: '#f6b58f', hot: s.tempC > 75 },
    ];
  });
}
