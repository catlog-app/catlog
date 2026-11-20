// Backup file: create, check and merge. A backup is read as untrusted input.
// Every field is checked, and only known fields are copied.

import {
  CAT_EMOJIS,
  DEFAULT_SETTINGS,
  PALETTE,
  type Cat,
  type CatEmoji,
  type CatEvent,
  type Level,
  type PaletteColor,
  type Period,
  type PeriodKind,
  type Settings,
  type Snapshot,
  type Severity,
  type Texture,
  type WaterLevel,
} from '../types';
import { isDateString, isTimeString } from './dates';
import { isValidTimeZone } from './time';

const BACKUP_APP = 'catlog';
/** Raise this when the file format changes, and add a migration in `parseBackup`. */
const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;

const LIMITS = { name: 60, title: 100, tag: 40, tags: 50, note: 2000 } as const;

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: number;
  cats: Cat[];
  events: CatEvent[];
  periods: Period[];
  settings: Settings;
}

export function createBackup(snapshot: Snapshot, now = Date.now()): BackupFile {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now,
    cats: snapshot.cats,
    events: snapshot.events,
    periods: snapshot.periods,
    settings: snapshot.settings,
  };
}

export function backupFileName(now = Date.now()): string {
  return `catlog-backup-${new Date(now).toISOString().slice(0, 10)}.json`;
}

export type ParseResult =
  { ok: true; backup: BackupFile } | { ok: false; error: 'format' | 'newer' | 'too-big' };

type Rec = Record<string, unknown>;

const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
const isId = (v: unknown): v is string => isStr(v, 100) && v !== '';
const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

function tagList(v: unknown): string[] | null {
  if (!Array.isArray(v) || v.length > LIMITS.tags) return null;
  const list: unknown[] = v;
  return list.every((t): t is string => isStr(t, LIMITS.tag)) ? list : null;
}

function readCat(v: unknown): Cat | null {
  if (!isRec(v) || !isId(v['id']) || !isStr(v['name'], LIMITS.name)) return null;
  if (typeof v['archived'] !== 'boolean' || !isTime(v['createdAt']) || !isTime(v['updatedAt'])) {
    return null;
  }
  const tags = isRec(v['customTags']) ? v['customTags'] : {};
  const sleep = tagList(tags['sleep'] ?? []);
  const stress = tagList(tags['stress'] ?? []);
  // Cats saved before vomit entries existed have no list for it.
  const vomit = tagList(tags['vomit'] ?? []);
  if (!sleep || !stress || !vomit) return null;
  const emoji = v['emoji'];
  if (emoji !== undefined && !(CAT_EMOJIS as readonly unknown[]).includes(emoji)) return null;
  return {
    id: v['id'],
    name: v['name'],
    ...(emoji === undefined ? {} : { emoji: emoji as CatEmoji }),
    archived: v['archived'],
    customTags: { sleep, stress, vomit },
    createdAt: v['createdAt'],
    updatedAt: v['updatedAt'],
  };
}

function readEvent(v: unknown): CatEvent | null {
  if (!isRec(v) || !isId(v['id']) || !isId(v['catId'])) return null;
  if (!isTime(v['createdAt']) || !isTime(v['updatedAt']) || !isTime(v['at'])) return null;
  if (!isValidTimeZone(v['tz']) || !isDateString(v['date']) || !isTimeString(v['time']))
    return null;
  if (!isStr(v['note'], LIMITS.note)) return null;
  const base = {
    id: v['id'],
    catId: v['catId'],
    at: v['at'],
    tz: v['tz'],
    date: v['date'],
    time: v['time'],
    note: v['note'],
    createdAt: v['createdAt'],
    updatedAt: v['updatedAt'],
  };
  switch (v['type']) {
    case 'stool': {
      const texture = v['texture'] ?? null;
      if (texture !== null && !isInt(texture, 1, 5)) return null;
      const { mucus, blood, smell } = v;
      if (!isInt(mucus, 0, 3) || !isInt(blood, 0, 3) || !isInt(smell, 0, 3)) return null;
      return {
        ...base,
        type: 'stool',
        texture: texture as Texture | null,
        mucus: mucus as Level,
        blood: blood as Level,
        smell: smell as Level,
      };
    }
    case 'water':
      if (!isInt(v['water'], 1, 3)) return null;
      return { ...base, type: 'water', water: v['water'] as WaterLevel };
    case 'sleep':
    case 'vomit': {
      const tags = tagList(v['tags']);
      return tags ? { ...base, type: v['type'], tags } : null;
    }
    case 'stress': {
      const tags = tagList(v['tags']);
      const severity = v['severity'] ?? null;
      if (!tags || (severity !== null && !isInt(severity, 1, 3))) return null;
      return { ...base, type: 'stress', tags, severity: severity as Severity | null };
    }
    default:
      return null;
  }
}

const KINDS: readonly string[] = ['med', 'food', 'supp', 'other'];

function readPeriod(v: unknown): Period | null {
  if (!isRec(v) || !isId(v['id']) || !isId(v['catId'])) return null;
  if (!isTime(v['createdAt']) || !isTime(v['updatedAt'])) return null;
  if (!isStr(v['title'], LIMITS.title) || !isStr(v['note'], LIMITS.note)) return null;
  if (typeof v['kind'] !== 'string' || !KINDS.includes(v['kind'])) return null;
  if (typeof v['color'] !== 'string' || !(PALETTE as readonly string[]).includes(v['color'])) {
    return null;
  }
  const end = v['end'] ?? null;
  if (
    !isDateString(v['start']) ||
    (end !== null && !isDateString(end)) ||
    (end !== null && end < v['start'])
  ) {
    return null;
  }
  return {
    id: v['id'],
    catId: v['catId'],
    title: v['title'],
    kind: v['kind'] as PeriodKind,
    start: v['start'],
    end,
    note: v['note'],
    color: v['color'] as PaletteColor,
    createdAt: v['createdAt'],
    updatedAt: v['updatedAt'],
  };
}

function readSettings(v: unknown): Settings {
  const s: Settings = { ...DEFAULT_SETTINGS };
  if (!isRec(v)) return s;
  if (v['timeZoneMode'] === 'device' || v['timeZoneMode'] === 'fixed')
    s.timeZoneMode = v['timeZoneMode'];
  if (isValidTimeZone(v['fixedTimeZone'])) s.fixedTimeZone = v['fixedTimeZone'];
  if (v['weekStart'] === 'mon' || v['weekStart'] === 'sun') s.weekStart = v['weekStart'];
  return s;
}

function readAll<T>(list: unknown, read: (v: unknown) => T | null): T[] | null {
  if (!Array.isArray(list)) return null;
  const out: T[] = [];
  for (const item of list) {
    const r = read(item);
    if (r === null) return null; // One bad item rejects the whole file.
    out.push(r);
  }
  return out;
}

export function parseBackup(text: string): ParseResult {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, error: 'too-big' };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'format' };
  }
  if (!isRec(data) || data['app'] !== BACKUP_APP || typeof data['version'] !== 'number') {
    return { ok: false, error: 'format' };
  }
  if (data['version'] > BACKUP_VERSION) return { ok: false, error: 'newer' };
  // Older versions would be migrated here before the checks below.

  const cats = readAll(data['cats'], readCat);
  const events = readAll(data['events'], readEvent);
  const periods = readAll(data['periods'], readPeriod);
  if (!cats || !events || !periods || !isTime(data['exportedAt'])) {
    return { ok: false, error: 'format' };
  }
  const catIds = new Set(cats.map((c) => c.id));
  if (![...events, ...periods].every((x) => catIds.has(x.catId))) {
    return { ok: false, error: 'format' };
  }
  return {
    ok: true,
    backup: {
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      exportedAt: data['exportedAt'],
      cats,
      events,
      periods,
      settings: readSettings(data['settings']),
    },
  };
}

export interface ImportPlan {
  added: number;
  updated: number;
  same: number;
  /** Only the items that must be written. */
  cats: Cat[];
  events: CatEvent[];
  periods: Period[];
  /** Preferences to restore. Set only when this device has no data yet. */
  settingsPatch: Partial<Settings> | null;
}

/** Merge by id. The newer `updatedAt` wins. */
export function planImport(current: Snapshot, incoming: BackupFile): ImportPlan {
  const plan: ImportPlan = {
    added: 0,
    updated: 0,
    same: 0,
    cats: [],
    events: [],
    periods: [],
    settingsPatch: null,
  };
  const merge = <T extends { id: string; updatedAt: number }>(
    existing: readonly T[],
    from: readonly T[],
    out: T[],
  ) => {
    const byId = new Map(existing.map((x) => [x.id, x]));
    for (const item of from) {
      const old = byId.get(item.id);
      if (!old) {
        plan.added++;
        out.push(item);
      } else if (item.updatedAt > old.updatedAt) {
        plan.updated++;
        out.push(item);
      } else {
        plan.same++;
      }
    }
  };
  merge(current.cats, incoming.cats, plan.cats);
  merge(current.events, incoming.events, plan.events);
  merge(current.periods, incoming.periods, plan.periods);

  if (current.cats.length === 0 && current.events.length === 0) {
    const { timeZoneMode, fixedTimeZone, weekStart } = incoming.settings;
    plan.settingsPatch = { timeZoneMode, fixedTimeZone, weekStart };
  }
  return plan;
}
