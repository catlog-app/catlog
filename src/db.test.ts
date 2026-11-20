import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { Database } from './db';
import { DEFAULT_SETTINGS } from './types';
import { makeCat, makeEvent, makePeriod } from './testing/factories';

let n = 0;
let db: Database;
beforeEach(async () => {
  db = await Database.open(`test-${++n}`); // a fresh database for each test
});

describe('database', () => {
  it('starts empty with default settings', async () => {
    expect(await db.load()).toEqual({
      cats: [],
      events: [],
      periods: [],
      settings: DEFAULT_SETTINGS,
    });
  });

  it('saves, reads and deletes items', async () => {
    const cat = makeCat();
    const ev = makeEvent(cat.id, '2026-11-02', { type: 'water', water: 3 });
    const period = makePeriod(cat.id, '2026-11-01', null);
    await db.putCat(cat);
    await db.putEvent(ev);
    await db.putPeriod(period);
    await db.saveSettings({ ...DEFAULT_SETTINGS, weekStart: 'sun' });

    const loaded = await db.load();
    expect(loaded.cats).toEqual([cat]);
    expect(loaded.events).toEqual([ev]);
    expect(loaded.periods).toEqual([period]);
    expect(loaded.settings.weekStart).toBe('sun');

    await db.deleteEvent(ev.id);
    await db.deletePeriod(period.id);
    const after = await db.load();
    expect(after.events).toEqual([]);
    expect(after.periods).toEqual([]);
  });

  it('writes many items and clears everything', async () => {
    const cat = makeCat();
    await db.putMany({
      cats: [cat],
      events: [makeEvent(cat.id, '2026-11-02', { type: 'sleep', tags: ['x'] })],
    });
    expect((await db.load()).events).toHaveLength(1);
    await db.clearAll();
    expect(await db.load()).toEqual({
      cats: [],
      events: [],
      periods: [],
      settings: DEFAULT_SETTINGS,
    });
  });
});
