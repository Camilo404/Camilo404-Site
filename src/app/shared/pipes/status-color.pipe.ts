import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'statusColor', standalone: true, pure: true })
export class StatusColorPipe implements PipeTransform {
  private readonly colorMap: Record<string, string> = {
    online:    '#43b581',
    idle:      '#faa61a',
    dnd:       '#f04747',
    streaming: '#593695',
  };

  transform(status: string | null | undefined): string {
    return this.colorMap[status ?? ''] ?? '#747f8d';
  }
}
