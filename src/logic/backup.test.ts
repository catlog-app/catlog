import { describe, expect, it } from 'vitest';
import { backupFileName, createBackup, parseBackup, planImport } from './backup';
import { DEFAULT_SETTINGS, type Snapshot } from '../types';
import { makeCat, makeEvent, makePeriod, makeStool } from '../testing/factories';

const cat = makeCat();

function snapshot(over: Partial<Snapshot> = {}): Snapshot {
  return {
    cats: [cat],
    events: [
      makeStool(cat.id, '2026-11-02'),
      makeEvent(cat.id, '2026-11-02', { type: 'water', water: 1 }),
    ],
    periods: [makePeriod(cat.id, '2026-11-01', null)],
    settings: { ...DEFAULT_SETTINGS },
    ...over,
  };
}

const empty: Snapshot = { cats: [], events: [], periods: [], settings: { ...DEFAULT_SETTINGS } };

describe('backup', () => {
  it('survives a round trip', () => {
    const snap = snapshot();
    const result = parseBackup(JSON.stringify(createBackup(snap, 5000)));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.cats).toEqual(snap.cats);
      expect(result.backup.events).toEqual(snap.events);
      expect(result.backup.periods).toEqual(snap.periods);
    }
  });

  it('rejects files that are not backups', () => {
    expect(parseBackup('not json')).toEqual({ ok: false, error: 'format' });
    expect(parseBackup('{"app":"other","version":1}')).toEqual({ ok: false, error: 'format' });
    expect(parseBackup('[]')).toEqual({ ok: false, error: 'format' });
  });

  it('rejects a newer format version', () => {
    const file = { ...createBackup(snapshot()), version: 99 };
    expect(parseBackup(JSON.stringify(file))).toEqual({ ok: false, error: 'newer' });
  });

  it('rejects the whole file when one entry is broken', () => {
    const file = createBackup(snapshot());
    const bad = { ...file, events: [...file.events, { ...file.events[0], mucus: 9, id: 'x' }] };
    expect(parseBackup(JSON.stringify(bad))).toEqual({ ok: false, error: 'format' });
  });

  it('rejects entries of unknown cats', () => {
    const file = createBackup(snapshot());
    const bad = { ...file, cats: [] };
    expect(parseBackup(JSON.stringify(bad))).toEqual({ ok: false, error: 'format' });
  });

  it('drops unknown fields', () => {
    const file = createBackup(snapshot());
    const dirty = { ...file, cats: [{ ...file.cats[0], evil: '<script>' }] };
    const result = parseBackup(JSON.stringify(dirty));
    expect(result.ok && 'evil' in result.backup.cats[0]!).toBe(false);
  });

  it('keeps vomit entries and the emoji of a cat', () => {
    const pet = makeCat({ emoji: '🐶' });
    const vomit = makeEvent(pet.id, '2026-11-02', { type: 'vomit', tags: ['Foam'] });
    const snap = snapshot({ cats: [pet], events: [vomit], periods: [] });
    const result = parseBackup(JSON.stringify(createBackup(snap)));
    expect(result.ok && result.backup.events).toEqual([vomit]);
    expect(result.ok && result.backup.cats[0]?.emoji).toBe('🐶');
  });

  it('reads a cat from an older backup without own vomit tags', () => {
    const file = createBackup(snapshot());
    const old = { ...file, cats: [{ ...file.cats[0], customTags: { sleep: [], stress: [] } }] };
    const result = parseBackup(JSON.stringify(old));
    expect(result.ok && result.backup.cats[0]?.customTags.vomit).toEqual([]);
  });

  it('rejects an emoji that is not in the list', () => {
    const file = createBackup(snapshot());
    const bad = { ...file, cats: [{ ...file.cats[0], emoji: '<b>' }] };
    expect(parseBackup(JSON.stringify(bad))).toEqual({ ok: false, error: 'format' });
  });

  it('names the file with the date', () => {
    expect(backupFileName(Date.UTC(2026, 10, 20))).toBe('catlog-backup-2026-11-20.json');
  });
});

describe('import plan', () => {
  it('adds everything into an empty device and restores preferences', () => {
    const incoming = createBackup(
      snapshot({ settings: { ...DEFAULT_SETTINGS, weekStart: 'sun' } }),
    );
    const plan = planImport(empty, incoming);
    expect(plan).toMatchObject({ added: 4, updated: 0, same: 0 });
    expect(plan.settingsPatch?.weekStart).toBe('sun');
  });

  it('merges by id and lets the newer entry win', () => {
    const current = snapshot();
    const changed = {
      ...current.events[0]!,
      note: 'newer',
      updatedAt: current.events[0]!.updatedAt + 10,
    };
    const incoming = createBackup({ ...current, events: [changed, current.events[1]!] });
    const plan = planImport(current, incoming);
    expect(plan).toMatchObject({ added: 0, updated: 1, same: 3 });
    expect(plan.events).toEqual([changed]);
    expect(plan.settingsPatch).toBeNull();
  });

  it('does not replace a newer local entry with an older one', () => {
    const current = snapshot();
    const older = { ...current.events[0]!, note: 'old', updatedAt: 1 };
    const plan = planImport(current, createBackup({ ...current, events: [older] }));
    expect(plan.updated).toBe(0);
    expect(plan.events).toEqual([]);
  });
});
