import { describe, expect, it } from 'vitest';
import { assignLanes, laneSlots, MAX_LANES, monthLanes } from './lanes';

const p = (id: string, start: string, end: string | null) => ({ id, start, end });

describe('lanes', () => {
  it('puts overlapping periods in different lanes', () => {
    const lanes = assignLanes([p('a', '2026-11-01', '2026-11-10'), p('b', '2026-11-05', null)]);
    expect(lanes.get('a')).toBe(0);
    expect(lanes.get('b')).toBe(1);
  });

  it('reuses a lane after a period ends', () => {
    const lanes = assignLanes([
      p('a', '2026-11-01', '2026-11-03'),
      p('b', '2026-11-04', '2026-11-08'),
    ]);
    expect(lanes.get('b')).toBe(0);
  });

  it('does not reuse a lane on the day the period ends', () => {
    const lanes = assignLanes([
      p('a', '2026-11-01', '2026-11-03'),
      p('b', '2026-11-03', '2026-11-08'),
    ]);
    expect(lanes.get('b')).toBe(1);
  });

  it('keeps a lane blocked for an open period', () => {
    const lanes = assignLanes([p('a', '2026-01-01', null), p('b', '2026-06-01', '2026-06-02')]);
    expect(lanes.get('b')).toBe(1);
  });

  it('gives the same result for any input order', () => {
    const list = [p('b', '2026-11-05', null), p('a', '2026-11-01', '2026-11-10')];
    expect(assignLanes(list).get('a')).toBe(0);
    expect(assignLanes(list).get('b')).toBe(1);
  });

  it('draws transparent spacers for empty lanes', () => {
    const periods = [p('a', '2026-11-01', '2026-11-10'), p('b', '2026-11-05', '2026-11-06')];
    const lanes = assignLanes(periods);
    // On 2026-11-02 only lane 0 is active. Lane 1 stays empty, so bars do not jump.
    expect(laneSlots('2026-11-02', periods, lanes, 2)).toEqual([
      { id: 'a', isStart: false, isEnd: false },
      null,
    ]);
    expect(laneSlots('2026-11-05', periods, lanes, 2)[1]).toEqual({
      id: 'b',
      isStart: true,
      isEnd: false,
    });
    expect(laneSlots('2026-11-10', periods, lanes, 2)[0]?.isEnd).toBe(true);
  });

  it('shows at most six lanes and counts the hidden periods', () => {
    const periods = Array.from({ length: 8 }, (_, i) => p(`p${i}`, '2026-11-01', null));
    const lanes = assignLanes(periods);
    expect(monthLanes(periods, lanes, '2026-11-01', '2026-11-30')).toEqual({
      laneCount: MAX_LANES,
      hidden: 2,
    });
  });

  it('ignores periods outside the month', () => {
    const periods = [p('a', '2026-09-01', '2026-09-30')];
    expect(monthLanes(periods, assignLanes(periods), '2026-11-01', '2026-11-30').laneCount).toBe(0);
  });
});
