// App state. All data is kept in memory (a diary is small) and every change
// is written to IndexedDB first, then the screen updates.

import { useEffect, useState } from 'preact/hooks';
import { Database } from './db';
import {
  DEFAULT_CAT_EMOJI,
  DEFAULT_SETTINGS,
  PALETTE,
  type Cat,
  type CatEmoji,
  type CatEvent,
  type Period,
  type TagKind,
  type Settings,
  type Snapshot,
} from './types';
import { strings } from './strings';
import { activeTimeZone, getDeviceTimeZone, type Stamp } from './logic/time';
import { planImport, type BackupFile } from './logic/backup';
import { isBackupDue, backupReminderKey } from './logic/reminders';

export type EventFields =
  | {
      type: 'stool';
      texture: 1 | 2 | 3 | 4 | 5 | null;
      mucus: 0 | 1 | 2 | 3;
      blood: 0 | 1 | 2 | 3;
      smell: 0 | 1 | 2 | 3;
    }
  | { type: 'water'; water: 1 | 2 | 3 }
  | { type: 'sleep' | 'vomit'; tags: string[] }
  | { type: 'stress'; tags: string[]; severity: 1 | 2 | 3 | null };

export interface EventInput {
  /** Set when an existing entry is edited. */
  id?: string;
  catId: string;
  stamp: Stamp;
  note: string;
  fields: EventFields;
}

export interface PeriodInput {
  id?: string;
  catId: string;
  title: string;
  kind: Period['kind'];
  start: string;
  end: string | null;
  note: string;
  color: Period['color'];
}

export interface AppState {
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  snapshot: Snapshot;
  /** New zone of the device, shown once as a banner. */
  timeZoneNotice: string | null;
  /** Result of `navigator.storage.persisted()`, or null if the browser cannot tell. */
  persisted: boolean | null;
}

const EMPTY: Snapshot = { cats: [], events: [], periods: [], settings: { ...DEFAULT_SETTINGS } };

class Store {
  private state: AppState = {
    status: 'loading',
    error: null,
    snapshot: EMPTY,
    timeZoneNotice: null,
    persisted: null,
  };
  private listeners = new Set<() => void>();
  private db: Database | null = null;

  get = () => this.state;

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private set(patch: Partial<AppState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  private setSnapshot(patch: Partial<Snapshot>) {
    this.set({ snapshot: { ...this.state.snapshot, ...patch } });
  }

  async init(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      this.set({ status: 'error', error: strings.errors.noStorage });
      return;
    }
    try {
      this.db = await Database.open();
      const loaded = await this.db.load();
      // Cats saved before vomit entries existed have no list of own vomit tags.
      const cats = loaded.cats.map((c) => ({
        ...c,
        customTags: {
          ...c.customTags,
          vomit: (c.customTags as Partial<Cat['customTags']>).vomit ?? [],
        },
      }));
      this.set({ status: 'ready', snapshot: { ...loaded, cats } });
      await this.checkTimeZone();
      await this.refreshPersisted();
    } catch {
      this.set({ status: 'error', error: strings.errors.loadFailed });
    }
  }

  // ---------- helpers ----------

  private requireDb(): Database {
    if (!this.db) throw new Error('Database is not open');
    return this.db;
  }

  /** The time zone for new entries. */
  timeZone(): string {
    return activeTimeZone(this.state.snapshot.settings);
  }

  private async checkTimeZone() {
    const { settings } = this.state.snapshot;
    const device = getDeviceTimeZone();
    const changed = settings.lastSeenTimeZone !== null && settings.lastSeenTimeZone !== device;
    if (changed && settings.timeZoneMode === 'device') this.set({ timeZoneNotice: device });
    if (settings.lastSeenTimeZone !== device)
      await this.updateSettings({ lastSeenTimeZone: device });
  }

  async refreshPersisted() {
    try {
      this.set({ persisted: await navigator.storage.persisted() });
    } catch {
      this.set({ persisted: null });
    }
  }

  /** Ask the browser to keep our data. It may say no. This does not stop manual clearing. */
  private async requestPersistence() {
    try {
      if (!(await navigator.storage.persisted())) await navigator.storage.persist();
    } catch {
      // Not supported. The settings screen shows the real state.
    }
    await this.refreshPersisted();
  }

  // ---------- settings ----------

  async updateSettings(patch: Partial<Settings>) {
    const settings = { ...this.state.snapshot.settings, ...patch };
    await this.requireDb().saveSettings(settings);
    this.setSnapshot({ settings });
  }

  async dismissReminder(key: string) {
    const { dismissedReminders } = this.state.snapshot.settings;
    // Keep the list short: old week keys are not needed.
    const kept = dismissedReminders.filter((k) => !k.startsWith('backup:')).slice(-20);
    await this.updateSettings({ dismissedReminders: [...kept, key] });
  }

  dismissTimeZoneNotice() {
    this.set({ timeZoneNotice: null });
  }

  isBackupBannerVisible(now = Date.now()): boolean {
    const { snapshot } = this.state;
    return (
      isBackupDue(snapshot, now) &&
      !snapshot.settings.dismissedReminders.includes(backupReminderKey(now))
    );
  }

  // ---------- cats ----------

  async addCat(name: string, emoji: CatEmoji = DEFAULT_CAT_EMOJI): Promise<Cat> {
    const now = Date.now();
    const cat: Cat = {
      id: crypto.randomUUID(),
      name: name.trim(),
      emoji,
      archived: false,
      customTags: { sleep: [], stress: [], vomit: [] },
      createdAt: now,
      updatedAt: now,
    };
    await this.requireDb().putCat(cat);
    this.setSnapshot({ cats: [...this.state.snapshot.cats, cat] });
    await this.updateSettings({ activeCatId: cat.id });
    return cat;
  }

  async updateCat(id: string, patch: Partial<Pick<Cat, 'name' | 'emoji' | 'archived'>>) {
    const old = this.state.snapshot.cats.find((c) => c.id === id);
    if (!old) return;
    const cat: Cat = { ...old, ...patch, updatedAt: Date.now() };
    await this.requireDb().putCat(cat);
    this.setSnapshot({ cats: this.state.snapshot.cats.map((c) => (c.id === id ? cat : c)) });
  }

  // ---------- events ----------

  async saveEvent(input: EventInput): Promise<void> {
    const { snapshot } = this.state;
    const old = input.id ? snapshot.events.find((e) => e.id === input.id) : undefined;
    const now = Date.now();
    const event: CatEvent = {
      ...input.fields,
      id: old?.id ?? crypto.randomUUID(),
      catId: input.catId,
      ...input.stamp,
      note: input.note.trim(),
      createdAt: old?.createdAt ?? now,
      updatedAt: now,
    };
    const db = this.requireDb();
    await db.putEvent(event);
    const events = old
      ? snapshot.events.map((e) => (e.id === event.id ? event : e))
      : [...snapshot.events, event];
    this.setSnapshot({ events });

    if (event.type === 'sleep' || event.type === 'stress' || event.type === 'vomit') {
      await this.rememberCustomTags(event.catId, event.type, event.tags);
    }
    // After the first save the browser is more likely to accept the request.
    if (!old) void this.requestPersistence();
  }

  /** Own tags are offered again next time. Preset tags are not saved. */
  private async rememberCustomTags(catId: string, kind: TagKind, tags: string[]) {
    const cat = this.state.snapshot.cats.find((c) => c.id === catId);
    if (!cat) return;
    const presets: string[] = strings.tagPresets[kind].map((t) => t.text);
    const known = cat.customTags[kind];
    const fresh = tags.filter((t) => !presets.includes(t) && !known.includes(t));
    if (fresh.length === 0) return;
    const updated: Cat = {
      ...cat,
      customTags: { ...cat.customTags, [kind]: [...known, ...fresh] },
      updatedAt: Date.now(),
    };
    await this.requireDb().putCat(updated);
    this.setSnapshot({ cats: this.state.snapshot.cats.map((c) => (c.id === catId ? updated : c)) });
  }

  async deleteEvent(id: string) {
    await this.requireDb().deleteEvent(id);
    this.setSnapshot({ events: this.state.snapshot.events.filter((e) => e.id !== id) });
  }

  // ---------- periods ----------

  async savePeriod(input: PeriodInput): Promise<void> {
    const { snapshot } = this.state;
    const old = input.id ? snapshot.periods.find((p) => p.id === input.id) : undefined;
    const now = Date.now();
    const period: Period = {
      id: old?.id ?? crypto.randomUUID(),
      catId: input.catId,
      title: input.title.trim(),
      kind: input.kind,
      start: input.start,
      end: input.end,
      note: input.note.trim(),
      color: input.color,
      createdAt: old?.createdAt ?? now,
      updatedAt: now,
    };
    await this.requireDb().putPeriod(period);
    this.setSnapshot({
      periods: old
        ? snapshot.periods.map((p) => (p.id === period.id ? period : p))
        : [...snapshot.periods, period],
    });
  }

  async deletePeriod(id: string) {
    await this.requireDb().deletePeriod(id);
    this.setSnapshot({ periods: this.state.snapshot.periods.filter((p) => p.id !== id) });
  }

  /** The next color of the palette, so new periods differ from the last ones. */
  nextColor(catId: string): Period['color'] {
    const count = this.state.snapshot.periods.filter((p) => p.catId === catId).length;
    return PALETTE[count % PALETTE.length] ?? 'teal';
  }

  // ---------- backup and import ----------

  async markBackedUp(now = Date.now()) {
    await this.updateSettings({ lastBackupAt: now });
  }

  async applyImport(backup: BackupFile) {
    const { snapshot } = this.state;
    const plan = planImport(snapshot, backup);
    let settings: Settings | undefined;
    if (plan.settingsPatch) settings = { ...snapshot.settings, ...plan.settingsPatch };
    await this.requireDb().putMany({
      cats: plan.cats,
      events: plan.events,
      periods: plan.periods,
      ...(settings ? { settings } : {}),
    });
    const merge = <T extends { id: string }>(old: T[], changed: T[]): T[] => {
      const ids = new Set(changed.map((c) => c.id));
      return [...old.filter((o) => !ids.has(o.id)), ...changed];
    };
    this.setSnapshot({
      cats: merge(snapshot.cats, plan.cats),
      events: merge(snapshot.events, plan.events),
      periods: merge(snapshot.periods, plan.periods),
      ...(settings ? { settings } : {}),
    });
    if (!this.state.snapshot.settings.activeCatId && this.state.snapshot.cats[0]) {
      await this.updateSettings({ activeCatId: this.state.snapshot.cats[0].id });
    }
  }

  async deleteAll() {
    await this.requireDb().clearAll();
    this.set({ snapshot: { ...EMPTY, settings: { ...DEFAULT_SETTINGS } }, timeZoneNotice: null });
    await this.updateSettings({ lastSeenTimeZone: getDeviceTimeZone() });
  }
}

export const store = new Store();

/** Subscribe a component to the store. */
export function useStore(): AppState {
  const [state, setState] = useState(store.get());
  useEffect(() => {
    setState(store.get());
    return store.subscribe(() => setState(store.get()));
  }, []);
  return state;
}
