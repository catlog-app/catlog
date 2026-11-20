// Data model. See README "Data" for the storage rules.

export type EventType = 'stool' | 'water' | 'sleep' | 'stress';

/** Scale for mucus, blood and smell. 0 = none, 3 = strong. */
export type Level = 0 | 1 | 2 | 3;
/** 1 = hard ... 2 = normal ... 5 = watery. */
export type Texture = 1 | 2 | 3 | 4 | 5;
/** 1 = little, 2 = enough, 3 = a lot. */
export type WaterLevel = 1 | 2 | 3;
export type Severity = 1 | 2 | 3;

export type PeriodKind = 'med' | 'food' | 'supp' | 'other';

export const PALETTE = [
  'teal',
  'orange',
  'purple',
  'blue',
  'pink',
  'olive',
  'red',
  'brown',
  'gray',
  'gold',
] as const;
export type PaletteColor = (typeof PALETTE)[number];

interface Base {
  id: string;
  /** Creation and update time, UTC milliseconds. */
  createdAt: number;
  updatedAt: number;
}

export interface Cat extends Base {
  name: string;
  archived: boolean;
  /** Own tags, saved as text so exports stay readable. */
  customTags: { sleep: string[]; stress: string[] };
}

interface EventBase extends Base {
  catId: string;
  /** Moment of the event, UTC milliseconds. */
  at: number;
  /** IANA time zone at the time of writing. */
  tz: string;
  /** Local date (YYYY-MM-DD) and time (HH:mm) in `tz`. Saved, never recomputed. */
  date: string;
  time: string;
  note: string;
}

export interface StoolEvent extends EventBase {
  type: 'stool';
  texture: Texture | null;
  mucus: Level;
  blood: Level;
  smell: Level;
}
export interface WaterEvent extends EventBase {
  type: 'water';
  water: WaterLevel;
}
export interface SleepEvent extends EventBase {
  type: 'sleep';
  tags: string[];
}
export interface StressEvent extends EventBase {
  type: 'stress';
  tags: string[];
  severity: Severity | null;
}
export type CatEvent = StoolEvent | WaterEvent | SleepEvent | StressEvent;

export interface Period extends Base {
  catId: string;
  title: string;
  kind: PeriodKind;
  /** Floating dates (YYYY-MM-DD) without a time zone. `end` null = still running. */
  start: string;
  end: string | null;
  note: string;
  color: PaletteColor;
}

export interface Settings {
  timeZoneMode: 'device' | 'fixed';
  fixedTimeZone: string;
  weekStart: 'mon' | 'sun';
  activeCatId: string | null;
  lastBackupAt: number | null;
  lastSeenTimeZone: string | null;
  dismissedReminders: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  timeZoneMode: 'device',
  fixedTimeZone: 'UTC',
  weekStart: 'mon',
  activeCatId: null,
  lastBackupAt: null,
  lastSeenTimeZone: null,
  dismissedReminders: [],
};

/** Everything stored on the device. */
export interface Snapshot {
  cats: Cat[];
  events: CatEvent[];
  periods: Period[];
  settings: Settings;
}
