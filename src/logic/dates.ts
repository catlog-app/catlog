// Helpers for floating dates ("YYYY-MM-DD"). They use UTC math only,
// so the device time zone and daylight saving time cannot shift a date.

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export function splitDate(date: string): [number, number, number] {
  const m = DATE_RE.exec(date);
  if (!m) throw new Error(`Bad date: ${date}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export function isDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const [y, m, d] = splitDate(value);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

export function isTimeString(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function toMs(date: string): number {
  const [y, m, d] = splitDate(date);
  return Date.UTC(y, m - 1, d);
}

export function fromMs(ms: number): string {
  const t = new Date(ms);
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(t.getUTCFullYear(), 4)}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}`;
}

export function addDays(date: string, days: number): string {
  return fromMs(toMs(date) + days * DAY_MS);
}

/** Whole days from a to b (b - a). */
export function diffDays(a: string, b: string): number {
  return Math.round((toMs(b) - toMs(a)) / DAY_MS);
}

/** Every date from `from` to `to`, both included. */
export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Position of a date in the week: 0 = first day of the week. */
export function weekdayIndex(date: string, weekStart: 'mon' | 'sun'): number {
  const sunday0 = new Date(toMs(date)).getUTCDay();
  return weekStart === 'mon' ? (sunday0 + 6) % 7 : sunday0;
}

/** Weeks of a month as rows of 7 dates. Days from the next and previous month fill the gaps. */
export function monthGrid(year: number, month: number, weekStart: 'mon' | 'sun'): string[][] {
  const first = fromMs(Date.UTC(year, month - 1, 1));
  const last = fromMs(Date.UTC(year, month, 0));
  const gridStart = addDays(first, -weekdayIndex(first, weekStart));
  const gridEnd = addDays(last, 6 - weekdayIndex(last, weekStart));
  const days = dateRange(gridStart, gridEnd);
  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

export function monthOf(date: string): { year: number; month: number } {
  const [year, month] = splitDate(date);
  return { year, month };
}

export function shiftMonth(year: number, month: number, delta: number) {
  const t = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1 };
}

const longFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const dayFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const monthFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  month: 'long',
  year: 'numeric',
});

/** "20 Nov 2026" */
export const formatDate = (date: string) => longFmt.format(toMs(date));
/** "Fri, 20 Nov" */
export const formatDay = (date: string) => dayFmt.format(toMs(date));
/** "November 2026" */
export const formatMonth = (year: number, month: number) =>
  monthFmt.format(Date.UTC(year, month - 1, 1));

export function weekdayLabels(weekStart: 'mon' | 'sun'): string[] {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short' });
  // 2024-01-01 is a Monday.
  const start = weekStart === 'mon' ? '2024-01-01' : '2023-12-31';
  return dateRange(start, addDays(start, 6)).map((d) => fmt.format(toMs(d)));
}
