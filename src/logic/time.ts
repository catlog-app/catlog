// Time zone logic. Each event keeps its own zone, local date and local time,
// so a trip or a rule change never moves old entries to another day.

import { fromMs, splitDate } from './dates';
import type { Settings } from '../types';

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(tz: string): Intl.DateTimeFormat {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(tz, f);
  }
  return f;
}

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || tz === '') return false;
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function getDeviceTimeZone(): string {
  const tz = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidTimeZone(tz) ? tz : 'UTC';
}

/** The zone that new entries use now. */
export function activeTimeZone(settings: Pick<Settings, 'timeZoneMode' | 'fixedTimeZone'>): string {
  if (settings.timeZoneMode === 'fixed' && isValidTimeZone(settings.fixedTimeZone)) {
    return settings.fixedTimeZone;
  }
  return getDeviceTimeZone();
}

export function listTimeZones(): string[] {
  // Older browsers may not have supportedValuesOf.
  return typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : ['UTC'];
}

/** Offset of `tz` from UTC at moment `at`, in minutes. */
export function offsetMinutes(at: number, tz: string): number {
  const parts: Record<string, number> = {};
  for (const p of formatterFor(tz).formatToParts(at)) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  const asUtc = Date.UTC(
    parts['year'] ?? 1970,
    (parts['month'] ?? 1) - 1,
    parts['day'] ?? 1,
    parts['hour'] ?? 0,
    parts['minute'] ?? 0,
    parts['second'] ?? 0,
  );
  return Math.round((asUtc - Math.floor(at / 1000) * 1000) / 60_000);
}

/** "+06:00" */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const h = String(Math.floor(abs / 60)).padStart(2, '0');
  const m = String(abs % 60).padStart(2, '0');
  return `${sign}${h}:${m}`;
}

export interface Stamp {
  at: number;
  tz: string;
  date: string;
  time: string;
}

/** Local date and time of a moment in a zone. */
export function stampFromMoment(at: number, tz: string): Stamp {
  const shifted = at + offsetMinutes(at, tz) * 60_000;
  const iso = new Date(shifted).toISOString(); // shifted time read as UTC
  return { at, tz, date: fromMs(shifted), time: iso.slice(11, 16) };
}

/** Moment for a local date and time in a zone. */
export function momentFromLocal(date: string, time: string, tz: string): number {
  const [y, mo, d] = splitDate(date);
  const [h, mi] = time.split(':').map(Number) as [number, number];
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes handle the case when the offset changes between the guess and the result.
  const first = guess - offsetMinutes(guess, tz) * 60_000;
  return guess - offsetMinutes(first, tz) * 60_000;
}

export function stampFromLocal(date: string, time: string, tz: string): Stamp {
  return { at: momentFromLocal(date, time, tz), tz, date, time };
}

/** Today's date in a zone. */
export function todayIn(tz: string, now = Date.now()): string {
  return stampFromMoment(now, tz).date;
}
