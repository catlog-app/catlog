import { describe, expect, it } from 'vitest';
import { isBackupDue } from './reminders';
import { DEFAULT_SETTINGS, type Snapshot } from '../types';
import { makeCat, makeStool } from '../testing/factories';

const DAY = 86_400_000;
const now = Date.UTC(2026, 10, 20);
const cat = makeCat();

function snap(eventAge: number, lastBackupAge: number | null): Snapshot {
  const e = { ...makeStool(cat.id, '2026-11-01'), updatedAt: now - eventAge * DAY };
  return {
    cats: [{ ...cat, updatedAt: now - eventAge * DAY }],
    events: [e],
    periods: [],
    settings: {
      ...DEFAULT_SETTINGS,
      lastBackupAt: lastBackupAge === null ? null : now - lastBackupAge * DAY,
    },
  };
}

describe('backup reminder', () => {
  it('stays quiet when there is no data', () => {
    expect(isBackupDue({ ...snap(1, null), events: [] }, now)).toBe(false);
  });

  it('asks when there was never a backup and data is old enough', () => {
    expect(isBackupDue(snap(20, null), now)).toBe(true);
    expect(isBackupDue(snap(5, null), now)).toBe(false);
  });

  it('asks only if there are new entries after an old backup', () => {
    expect(isBackupDue(snap(2, 30), now)).toBe(true);
    expect(isBackupDue(snap(40, 30), now)).toBe(false); // nothing new since the backup
    expect(isBackupDue(snap(2, 5), now)).toBe(false); // backup is recent
  });
});
