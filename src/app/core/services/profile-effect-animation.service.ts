import { Injectable } from '@angular/core';
import { ProfileEffectLayer } from '../models/discord-profile.model';

export interface RenderedLayer {
  config: ProfileEffectLayer;
  isVisible: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProfileEffectAnimationService {
  private timerIds: ReturnType<typeof setTimeout>[] = [];

  initializeLayers(
    layers: ProfileEffectLayer[],
    onUpdate: (layers: RenderedLayer[]) => void
  ): RenderedLayer[] {
    this.destroyLayers(); // cancel previous timers
    const sorted = [...layers].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    const rendered: RenderedLayer[] = sorted.map(l => ({ config: l, isVisible: false }));

    rendered.forEach(rl => {
      const start = rl.config.start ?? 0;
      const show = () => {
        rl.isVisible = true;
        onUpdate([...rendered]);
        this.handleLayerLifecycle(rl, rendered, onUpdate);
      };
      if (start === 0) {
        show();
      } else {
        const id = setTimeout(show, start);
        this.timerIds.push(id);
      }
    });

    return rendered;
  }

  private handleLayerLifecycle(
    layer: RenderedLayer,
    all: RenderedLayer[],
    onUpdate: (layers: RenderedLayer[]) => void
  ): void {
    const duration = layer.config.duration ?? 0;
    const loopDelay = layer.config.loopDelay ?? 0;

    if (!layer.config.loop) {
      if (duration > 0) {
        const id = setTimeout(() => {
          layer.isVisible = false;
          onUpdate([...all]);
        }, duration);
        this.timerIds.push(id);
      }
    } else if (loopDelay > 0) {
      const cycle = () => {
        const hideId = setTimeout(() => {
          layer.isVisible = false;
          onUpdate([...all]);
          const showId = setTimeout(() => {
            layer.isVisible = true;
            onUpdate([...all]);
            cycle();
          }, loopDelay);
          this.timerIds.push(showId);
        }, duration);
        this.timerIds.push(hideId);
      };
      cycle();
    }
  }

  destroyLayers(): void {
    this.timerIds.forEach(id => clearTimeout(id));
    this.timerIds = [];
  }
}
