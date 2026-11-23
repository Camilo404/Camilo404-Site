/** Shared formatters for the Homelab tile and dashboard. */

export function formatBytes(bytes: number, digits = 1): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : digits)} ${units[i]}`;
}

export function formatRate(bps: number): string {
  return `${formatBytes(bps)}/s`;
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Temperature scale: 30 °C empty → 90 °C full. */
export const TEMP_MIN = 30;
export const TEMP_MAX = 90;

export function tempFill(c: number): number {
  return Math.max(0, Math.min(100, ((c - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * 100));
}

/** "1:04:09 PM"-style clock time from Unix seconds. */
export function formatClock(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

/** "2m 40s" for short spans. */
export function formatSpan(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m ? `${m}m ${s}s` : `${s}s`;
}

/** Rounds `v` up to a friendly axis maximum (1, 2, 2.5, 5 × 10ⁿ). */
export function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

/**
 * SVG path through `values` spread evenly across a `w` × `h` box, scaled to
 * [min, max]. `closed` drops the path to the bottom edge for an area fill.
 */
export function seriesPath(values: number[], min: number, max: number, w: number, h: number, closed = false): string {
  if (values.length < 2 || max <= min) return '';
  const step = w / (values.length - 1);
  const y = (v: number) => h - ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * h;
  const line = `M${values.map((v, i) => `${(i * step).toFixed(2)},${y(v).toFixed(2)}`).join(' L')}`;
  return closed ? `${line} L${w},${h} L0,${h} Z` : line;
}
