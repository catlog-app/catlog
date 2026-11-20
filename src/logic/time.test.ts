import { describe, expect, it } from 'vitest';
import {
  formatOffset,
  isValidTimeZone,
  momentFromLocal,
  offsetMinutes,
  stampFromLocal,
  stampFromMoment,
  todayIn,
} from './time';

describe('time zones', () => {
  it('finds the offset of a zone without daylight saving', () => {
    expect(offsetMinutes(Date.UTC(2026, 10, 20), 'Asia/Dhaka')).toBe(360);
  });

  it('follows daylight saving time', () => {
    expect(offsetMinutes(Date.UTC(2026, 0, 15), 'Europe/Berlin')).toBe(60);
    expect(offsetMinutes(Date.UTC(2026, 6, 15), 'Europe/Berlin')).toBe(120);
  });

  it('formats offsets', () => {
    expect(formatOffset(360)).toBe('+06:00');
    expect(formatOffset(-210)).toBe('-03:30');
    expect(formatOffset(0)).toBe('+00:00');
  });

  it('turns a moment into a local date and time', () => {
    // 20:30 UTC is already the next day in Dhaka.
    const stamp = stampFromMoment(Date.UTC(2026, 10, 20, 20, 30), 'Asia/Dhaka');
    expect(stamp.date).toBe('2026-11-21');
    expect(stamp.time).toBe('02:30');
  });

  it('turns local time into a moment and back', () => {
    const stamp = stampFromLocal('2026-07-01', '12:00', 'Europe/Berlin');
    expect(new Date(stamp.at).toISOString()).toBe('2026-07-01T10:00:00.000Z');
    expect(stampFromMoment(stamp.at, 'Europe/Berlin')).toMatchObject({
      date: '2026-07-01',
      time: '12:00',
    });
  });

  it('keeps old entries on their day after the zone changes', () => {
    // The saved date and time are the truth. The same moment looks different in another zone,
    // but the stored entry does not change.
    const saved = stampFromLocal('2026-11-20', '23:30', 'Asia/Dhaka');
    const elsewhere = stampFromMoment(saved.at, 'Europe/Berlin');
    expect(saved.date).toBe('2026-11-20');
    expect(elsewhere.date).toBe('2026-11-20');
    expect(elsewhere.time).toBe('18:30');
    expect(stampFromMoment(saved.at, 'Pacific/Auckland').date).toBe('2026-11-21');
  });

  it('handles the end of a daylight saving gap', () => {
    // 2026-03-29 02:30 does not exist in Berlin. We only need a stable, valid result.
    const at = momentFromLocal('2026-03-29', '02:30', 'Europe/Berlin');
    expect(Number.isFinite(at)).toBe(true);
  });

  it('checks zone names', () => {
    expect(isValidTimeZone('Asia/Dhaka')).toBe(true);
    expect(isValidTimeZone('Nowhere/City')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });

  it('gives today in a zone', () => {
    expect(todayIn('Asia/Dhaka', Date.UTC(2026, 10, 20, 20, 0))).toBe('2026-11-21');
    expect(todayIn('UTC', Date.UTC(2026, 10, 20, 20, 0))).toBe('2026-11-20');
  });
});
