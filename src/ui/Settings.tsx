import { useState } from 'preact/hooks';
import { strings } from '../strings';
import { store, useStore } from '../store';
import { formatDate } from '../logic/dates';
import { listTimeZones, todayIn, getDeviceTimeZone } from '../logic/time';
import { resolveRange, type RangeChoice } from '../logic/summary';
import { exportXlsx } from '../exporter';
import { DEFAULT_CAT_EMOJI } from '../types';
import { EmojiPicker } from './EmojiPicker';
import { Chip } from './Chip';
import { ConfirmDelete } from './ConfirmDelete';
import { BackupButton } from './Backup';

interface SettingsProps {
  catId: string | null;
  onImport: () => void;
  onInfo: (which: 'data' | 'about') => void;
  onClose: () => void;
}

const RANGES: RangeChoice[] = [7, 14, 30, 90, 'all'];

export function Settings({ catId, onImport, onInfo, onClose }: SettingsProps) {
  const { snapshot, persisted } = useStore();
  const { settings, cats } = snapshot;
  const [newCat, setNewCat] = useState('');
  const [range, setRange] = useState<RangeChoice>('all');
  const [message, setMessage] = useState('');
  const s = strings.settings;

  const activeCat = cats.find((c) => c.id === catId);

  async function addCat() {
    if (newCat.trim() === '') return;
    await store.addCat(newCat);
    setNewCat('');
  }

  async function runExport() {
    if (!activeCat) return;
    setMessage('');
    const today = todayIn(store.timeZone());
    const r = resolveRange(
      range,
      today,
      snapshot.events.filter((e) => e.catId === activeCat.id),
    );
    const input = {
      cat: activeCat,
      events: snapshot.events,
      periods: snapshot.periods,
      ...r,
      today,
    };
    try {
      await exportXlsx(input);
      setMessage(strings.export.done);
    } catch {
      setMessage(strings.export.failed);
    }
  }

  return (
    <div class="stack stack--big">
      <section class="stack">
        <h3 class="subtitle">{s.cats}</h3>
        <ul class="plain">
          {cats.map((c) => (
            <CatRow key={c.id} id={c.id} />
          ))}
        </ul>
        <div class="inline">
          <input
            class="input"
            type="text"
            maxLength={60}
            placeholder={s.catName}
            aria-label={s.addCat}
            value={newCat}
            onInput={(e) => setNewCat(e.currentTarget.value)}
          />
          <button type="button" class="btn" onClick={() => void addCat()}>
            {s.addCat}
          </button>
        </div>
      </section>

      <section class="stack">
        <h3 class="subtitle">{s.timeZone}</h3>
        <div class="chips">
          <Chip
            selected={settings.timeZoneMode === 'device'}
            onClick={() => void store.updateSettings({ timeZoneMode: 'device' })}
          >
            {s.followDevice}
          </Chip>
          <Chip
            selected={settings.timeZoneMode === 'fixed'}
            onClick={() => void store.updateSettings({ timeZoneMode: 'fixed' })}
          >
            {s.fixed}
          </Chip>
        </div>
        {settings.timeZoneMode === 'fixed' && (
          <label class="field">
            <span class="hint">{s.fixedHint}</span>
            <select
              class="input"
              aria-label={s.fixed}
              value={settings.fixedTimeZone}
              onChange={(e) => void store.updateSettings({ fixedTimeZone: e.currentTarget.value })}
            >
              {[...new Set([settings.fixedTimeZone, getDeviceTimeZone(), ...listTimeZones()])].map(
                (tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ),
              )}
            </select>
          </label>
        )}
        <p class="muted">{s.currentZone(store.timeZone())}</p>
      </section>

      <section class="stack">
        <h3 class="subtitle">{s.weekStart}</h3>
        <div class="chips">
          <Chip
            selected={settings.weekStart === 'mon'}
            onClick={() => void store.updateSettings({ weekStart: 'mon' })}
          >
            {s.monday}
          </Chip>
          <Chip
            selected={settings.weekStart === 'sun'}
            onClick={() => void store.updateSettings({ weekStart: 'sun' })}
          >
            {s.sunday}
          </Chip>
        </div>
      </section>

      <section class="stack">
        <h3 class="subtitle">{s.data}</h3>
        <p class="muted">
          {settings.lastBackupAt === null
            ? s.neverBackedUp
            : s.lastBackup(formatDate(new Date(settings.lastBackupAt).toISOString().slice(0, 10)))}
        </p>
        <BackupButton />
        <button type="button" class="btn" onClick={onImport}>
          {s.importBackup}
        </button>
      </section>

      {activeCat && (
        <section class="stack">
          <h3 class="subtitle">{s.export}</h3>
          <div class="chips" role="group" aria-label={s.exportRange}>
            {RANGES.map((r) => (
              <Chip key={String(r)} selected={range === r} onClick={() => setRange(r)}>
                {strings.analysis.ranges[String(r) as keyof typeof strings.analysis.ranges]}
              </Chip>
            ))}
          </div>
          <button type="button" class="btn" onClick={() => void runExport()}>
            {s.exportXlsx}
          </button>
          <p class="hint">{s.exportJsonHint}</p>
          {message !== '' && (
            <p class="ok" role="status">
              {message}
            </p>
          )}
        </section>
      )}

      <section class="stack">
        <h3 class="subtitle">{s.storage}</h3>
        <p>
          {persisted === true
            ? s.storageProtected
            : persisted === false
              ? s.storageNotProtected
              : s.storageUnknown}
        </p>
        <button type="button" class="btn" onClick={() => onInfo('data')}>
          {s.whereIsData}
        </button>
        <button type="button" class="btn" onClick={() => onInfo('about')}>
          {s.about}
        </button>
      </section>

      <section class="stack">
        <p class="hint">{s.deleteAllHint}</p>
        <ConfirmDelete
          label={s.deleteAll}
          confirmLabel={s.deleteAllConfirm}
          onConfirm={() => {
            void store.deleteAll().then(onClose);
          }}
        />
      </section>
    </div>
  );
}

/** Rename and archive one cat. */
function CatRow({ id }: { id: string }) {
  const { snapshot } = useStore();
  const cat = snapshot.cats.find((c) => c.id === id);
  const [name, setName] = useState(cat?.name ?? '');
  if (!cat) return null;
  const s = strings.settings;
  const save = () => {
    if (name.trim() !== '' && name.trim() !== cat.name)
      void store.updateCat(id, { name: name.trim() });
  };
  return (
    <li class="stack">
      <div class="inline">
        <input
          class="input"
          type="text"
          maxLength={60}
          aria-label={s.rename}
          value={name}
          onInput={(e) => setName(e.currentTarget.value)}
          onBlur={save}
        />
        <button
          type="button"
          class="btn"
          onClick={() => void store.updateCat(id, { archived: !cat.archived })}
        >
          {cat.archived ? s.unarchive : s.archive}
        </button>
      </div>
      <EmojiPicker
        value={cat.emoji ?? DEFAULT_CAT_EMOJI}
        onChange={(emoji) => void store.updateCat(id, { emoji })}
      />
    </li>
  );
}
