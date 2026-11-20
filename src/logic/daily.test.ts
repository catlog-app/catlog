import { describe, expect, it } from 'vitest';
import { summarizeDays } from './daily';
import { summarizeRange } from './summary';
import { makeCat, makeEvent, makePeriod, makeStool } from '../testing/factories';

const cat = makeCat();

describe('daily summary', () => {
  it('lists days without entries and marks them', () => {
    const days = summarizeDays([makeStool(cat.id, '2026-11-02')], [], ['2026-11-01', '2026-11-02']);
    expect(days.map((d) => d.hasEntries)).toEqual([false, true]);
    expect(days[0]?.stoolCount).toBe(0);
  });

  it('takes the highest level of the day and keeps stool without texture', () => {
    const events = [
      makeStool(cat.id, '2026-11-02', '08:00', { texture: 2, blood: 1 }),
      makeStool(cat.id, '2026-11-02', '20:00', { texture: null, blood: 3, mucus: 2 }),
      makeStool(cat.id, '2026-11-02', '21:00', { texture: 5 }),
    ];
    const [day] = summarizeDays(events, [], ['2026-11-02']);
    expect(day).toMatchObject({
      stoolCount: 3,
      textures: [2, 5],
      maxTexture: 5,
      maxBlood: 3,
      maxMucus: 2,
      hasWatery: true,
      hasHard: false,
    });
  });

  it('uses the last water entry of the day', () => {
    const events = [
      makeEvent(cat.id, '2026-11-02', { type: 'water', water: 3 }, '09:00'),
      makeEvent(cat.id, '2026-11-02', { type: 'water', water: 1 }, '18:00'),
    ];
    const [day] = summarizeDays(events, [], ['2026-11-02']);
    expect(day?.waterLast).toBe(1);
    expect(day?.waterEntries).toBe(2);
  });

  it('counts a sleep entry with a custom tag and an empty stress entry', () => {
    const events = [
      makeEvent(cat.id, '2026-11-02', { type: 'sleep', tags: ['Plays at 3 am'] }),
      makeEvent(cat.id, '2026-11-02', { type: 'stress' }),
    ];
    const [day] = summarizeDays(events, [], ['2026-11-02']);
    expect(day).toMatchObject({
      sleepProblem: true,
      sleepTags: ['Plays at 3 am'],
      hasStress: true,
      maxStress: 0,
    });
  });

  it('marks all periods that are active on a day, including overlapping ones', () => {
    const a = makePeriod(cat.id, '2026-11-01', '2026-11-10');
    const b = makePeriod(cat.id, '2026-11-05', null);
    const days = summarizeDays([], [a, b], ['2026-11-04', '2026-11-06', '2026-11-12']);
    expect(days.map((d) => d.activePeriodIds.length)).toEqual([1, 2, 1]);
  });
});

describe('range summary', () => {
  it('counts days and shares', () => {
    const events = [
      makeStool(cat.id, '2026-11-01', '08:00', { texture: 5, mucus: 1 }),
      makeStool(cat.id, '2026-11-01', '12:00', { texture: 2, blood: 2 }),
      makeStool(cat.id, '2026-11-03', '08:00', { texture: 1 }),
      makeStool(cat.id, '2026-11-03', '09:00', { texture: null }),
    ];
    const s = summarizeRange(events, { from: '2026-11-01', to: '2026-11-04' });
    expect(s.days).toBe(4);
    expect(s.daysWithEntries).toBe(2);
    expect(s.stoolTotal).toBe(4);
    expect(s.stoolPerDay).toBe(1);
    expect(s.wateryShare).toBeCloseTo(1 / 3);
    expect(s.hardShare).toBeCloseTo(1 / 3);
    expect(s.mucus).toEqual({ any: 1, strong: 0 });
    expect(s.blood).toEqual({ any: 1, strong: 1 });
  });

  it('gives null shares when no stool has a texture', () => {
    const s = summarizeRange([], { from: '2026-11-01', to: '2026-11-04' });
    expect(s.wateryShare).toBeNull();
  });
});
