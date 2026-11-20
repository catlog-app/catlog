// Storage in IndexedDB. This is the only place where user data is saved.
// The service worker cache holds app code only.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import {
  DEFAULT_SETTINGS,
  type Cat,
  type CatEvent,
  type Period,
  type Settings,
  type Snapshot,
} from './types';

const DB_NAME = 'catlog';
/** Raise this number when a store or index changes, and add a step in `upgrade`. */
const DB_VERSION = 1;
const SETTINGS_KEY = 'main';

interface CatlogSchema extends DBSchema {
  cats: { key: string; value: Cat };
  events: { key: string; value: CatEvent; indexes: { 'by-cat': string } };
  periods: { key: string; value: Period; indexes: { 'by-cat': string } };
  settings: { key: string; value: Settings };
}

export class Database {
  private constructor(private readonly db: IDBPDatabase<CatlogSchema>) {}

  static async open(name = DB_NAME): Promise<Database> {
    const db = await openDB<CatlogSchema>(name, DB_VERSION, {
      upgrade(database, oldVersion) {
        // Each block runs once for a database that is older than that version.
        if (oldVersion < 1) {
          database.createObjectStore('cats', { keyPath: 'id' });
          database.createObjectStore('events', { keyPath: 'id' }).createIndex('by-cat', 'catId');
          database.createObjectStore('periods', { keyPath: 'id' }).createIndex('by-cat', 'catId');
          database.createObjectStore('settings');
        }
      },
      blocking() {
        // A newer tab wants to upgrade. Close this connection so it can go on.
        db.close();
      },
    });
    return new Database(db);
  }

  async load(): Promise<Snapshot> {
    const [cats, events, periods, settings] = await Promise.all([
      this.db.getAll('cats'),
      this.db.getAll('events'),
      this.db.getAll('periods'),
      this.db.get('settings', SETTINGS_KEY),
    ]);
    return { cats, events, periods, settings: { ...DEFAULT_SETTINGS, ...settings } };
  }

  async putCat(cat: Cat): Promise<void> {
    await this.db.put('cats', cat);
  }

  async putEvent(event: CatEvent): Promise<void> {
    await this.db.put('events', event);
  }

  async deleteEvent(id: string): Promise<void> {
    await this.db.delete('events', id);
  }

  async putPeriod(period: Period): Promise<void> {
    await this.db.put('periods', period);
  }

  async deletePeriod(id: string): Promise<void> {
    await this.db.delete('periods', id);
  }

  async saveSettings(settings: Settings): Promise<void> {
    await this.db.put('settings', settings, SETTINGS_KEY);
  }

  /** Writes many items in one transaction. Either all are saved or none. */
  async putMany(items: {
    cats?: Cat[];
    events?: CatEvent[];
    periods?: Period[];
    settings?: Settings;
  }) {
    const tx = this.db.transaction(['cats', 'events', 'periods', 'settings'], 'readwrite');
    const writes: Promise<unknown>[] = [];
    for (const c of items.cats ?? []) writes.push(tx.objectStore('cats').put(c));
    for (const e of items.events ?? []) writes.push(tx.objectStore('events').put(e));
    for (const p of items.periods ?? []) writes.push(tx.objectStore('periods').put(p));
    if (items.settings) writes.push(tx.objectStore('settings').put(items.settings, SETTINGS_KEY));
    await Promise.all([...writes, tx.done]);
  }

  async clearAll(): Promise<void> {
    const tx = this.db.transaction(['cats', 'events', 'periods', 'settings'], 'readwrite');
    await Promise.all([
      tx.objectStore('cats').clear(),
      tx.objectStore('events').clear(),
      tx.objectStore('periods').clear(),
      tx.objectStore('settings').clear(),
      tx.done,
    ]);
  }
}
