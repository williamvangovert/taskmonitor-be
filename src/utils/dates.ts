/**
 * Whole-day difference between two YYYY-MM-DD dates (absolute value),
 * matching Laravel's Carbon diffInDays used for duration_days.
 */
export function diffInDays(start: string, end: string): number {
  const s = Date.parse(`${start}T00:00:00Z`);
  const e = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(s) || Number.isNaN(e)) return 0;
  return Math.abs(Math.floor((e - s) / 86_400_000));
}
