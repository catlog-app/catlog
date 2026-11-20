// When to ask for a backup.

import type { Snapshot } from '../types';

const DAY = 86_400_000;
const BACKUP_AFTER_DAYS = 14;

/** True if there are entries that are not in the last backup, and the backup is old. */
export function isBackupDue(snapshot: Snapshot, now: number): boolean {
  const { events, periods, cats, settings } = snapshot;
  const changes = [...cats, ...events, ...periods].map((x) => x.updatedAt);
  if (events.length === 0 && periods.length === 0) return false;

  const last = settings.lastBackupAt;
  if (last === null) {
    // No backup yet: count from the oldest item.
    return now - Math.min(...changes) > BACKUP_AFTER_DAYS * DAY;
  }
  const hasNew = changes.some((t) => t > last);
  return hasNew && now - last > BACKUP_AFTER_DAYS * DAY;
}

/** A reminder can be dismissed for one week. The key changes every week. */
export function backupReminderKey(now: number): string {
  return `backup:${Math.floor(now / (7 * DAY))}`;
}
