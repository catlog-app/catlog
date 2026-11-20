import { describe, expect, it } from 'vitest';
import {
  addDays,
  dateRange,
  diffDays,
  isDateString,
  monthGrid,
  shiftMonth,
  weekdayIndex,
  weekdayLabels,
} from './dates';

describe('dates', () => {
  it('adds days across month and year borders', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('counts days between dates', () => {
    expect(diffDays('2026-11-01', '2026-11-20')).toBe(19);
    expect(diffDays('2026-11-20', '2026-11-01')).toBe(-19);
  });

  it('lists a range with both ends', () => {
    expect(dateRange('2026-02-27', '2026-03-01')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
    ]);
  });

  it('validates date strings', () => {
    expect(isDateString('2026-02-29')).toBe(false);
    expect(isDateString('2024-02-29')).toBe(true);
    expect(isDateString('2026-2-3')).toBe(false);
    expect(isDateString(5)).toBe(false);
  });

  it('knows the weekday for both week starts', () => {
    // 2026-11-20 is a Friday.
    expect(weekdayIndex('2026-11-20', 'mon')).toBe(4);
    expect(weekdayIndex('2026-11-20', 'sun')).toBe(5);
    expect(weekdayLabels('mon')[0]).toBe('Mon');
    expect(weekdayLabels('sun')[0]).toBe('Sun');
  });

  it('builds full weeks for a month', () => {
    const weeks = monthGrid(2026, 11, 'mon');
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks[0]?.[0]).toBe('2026-10-26');
    expect(weeks.at(-1)?.[6]).toBe('2026-12-06');
  });

  it('shifts months', () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });
});
