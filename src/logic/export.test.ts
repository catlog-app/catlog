import { describe, expect, it } from 'vitest';
import {
  buildDailyTable,
  buildEventsTable,
  buildPeriodsTable,
  safeText,
  slug,
  toCsv,
} from './export';
import { buildVetSummary } from './vet';
import { makeCat, makeEvent, makePeriod, makeStool } from '../testing/factories';

const cat = makeCat({ name: 'Mila' });
const range = { from: '2026-11-01', to: '2026-11-04' };

function input() {
  const food = makePeriod(cat.id, '2026-11-02', null, { title: 'New food' });
  const med = makePeriod(cat.id, '2026-11-01', '2026-11-03', { title: 'Antibiotics', kind: 'med' });
  const events = [
    makeStool(cat.id, '2026-11-02', '08:00', { texture: null, mucus: 2 }, 'Asia/Dhaka'),
    makeEvent(cat.id, '2026-11-03', { type: 'water', water: 3 }),
  ];
  return { cat, events, periods: [food, med], ...range, today: '2026-11-10' };
}

describe('export tables', () => {
  it('writes a stool without texture as an empty cell', () => {
    const [header, row] = buildEventsTable(input());
    const textureCode = header?.indexOf('Texture (code 1-5)') ?? -1;
    expect(row?.[textureCode]).toBeNull();
    expect(row?.[header?.indexOf('Mucus (0-3)') ?? -1]).toBe(2);
    expect(row?.[header?.indexOf('Type') ?? -1]).toBe('Stool');
    expect(row?.[header?.indexOf('UTC offset') ?? -1]).toBe('UTC+06:00');
    expect(row?.[header?.indexOf('Active periods') ?? -1]).toBe('New food; Antibiotics');
  });

  it('lists every day in Daily, also empty days, with one 0/1 column per period', () => {
    const table = buildDailyTable(input());
    const [header, ...rows] = table;
    expect(rows).toHaveLength(4);
    const has = header?.indexOf('Has entries (0/1)') ?? -1;
    expect(rows.map((r) => r[has])).toEqual([0, 1, 1, 0]);
    const food = header?.indexOf('Period: New food') ?? -1;
    const med = header?.indexOf('Period: Antibiotics') ?? -1;
    expect(rows.map((r) => r[food])).toEqual([0, 1, 1, 1]);
    expect(rows.map((r) => r[med])).toEqual([1, 1, 1, 0]);
  });

  it('lists several texture codes of a day in one cell that no spreadsheet reads as a number', () => {
    const events = [
      makeStool(cat.id, '2026-11-02', '08:00', { texture: 2 }),
      makeStool(cat.id, '2026-11-02', '20:00', { texture: 5 }),
    ];
    const [header, ...rows] = buildDailyTable({ ...input(), events });
    const col = header?.indexOf('Textures (codes)') ?? -1;
    expect(rows[1]?.[col]).toBe('2; 5');
  });

  it('writes periods with duration and the ongoing flag', () => {
    const [, ...rows] = buildPeriodsTable(input());
    // Sorted by start date: Antibiotics first.
    expect(rows[0]?.slice(1, 7)).toEqual([
      'Antibiotics',
      'Medicine',
      '2026-11-01',
      '2026-11-03',
      0,
      3,
    ]);
    expect(rows[1]?.slice(1, 7)).toEqual(['New food', 'Food', '2026-11-02', null, 1, 9]);
  });

  it('stops spreadsheet formulas in user text', () => {
    expect(safeText('=1+1')).toBe("'=1+1");
    expect(safeText('Normal note')).toBe('Normal note');
  });

  it('builds CSV with BOM, quotes and the chosen delimiter', () => {
    const csv = toCsv(
      [
        ['a', 'b;c'],
        ['say "hi"', 2],
      ],
      ';',
    );
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('a;"b;c"\r\n');
    expect(csv).toContain('"say ""hi""";2\r\n');
  });

  it('makes safe file names', () => {
    expect(slug('Mila & Co!')).toBe('mila-co');
    expect(slug('???')).toBe('cat');
  });
});

describe('vet summary', () => {
  it('is readable text with the main facts', () => {
    const { events, periods } = input();
    const text = buildVetSummary(cat, range, events, periods);
    expect(text).toContain('Cat: Mila');
    expect(text).toContain('Poop with blood or mucus');
    expect(text).toContain('Mucus: Medium');
    expect(text).toContain('New food (Food)');
    expect(text).toContain('not a diagnosis');
  });
});
