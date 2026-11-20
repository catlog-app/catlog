import { useState } from 'preact/hooks';
import { strings } from '../strings';
import { store, useStore, type EventFields } from '../store';
import type { CatEvent, EventType } from '../types';
import { isDateString, isTimeString } from '../logic/dates';
import { stampFromLocal, stampFromMoment } from '../logic/time';
import { Chip } from './Chip';
import { ConfirmDelete } from './ConfirmDelete';

interface EventFormProps {
  type: EventType;
  catId: string;
  existing?: CatEvent;
  /** Date chosen in the calendar. The time is then set to noon. */
  defaultDate?: string;
  onDone: () => void;
}

function initialDateTime(tz: string, defaultDate?: string): string {
  const now = stampFromMoment(Date.now(), tz);
  if (!defaultDate || defaultDate === now.date) return `${now.date}T${now.time}`;
  return `${defaultDate}T12:00`;
}

export function EventForm({ type, catId, existing, defaultDate, onDone }: EventFormProps) {
  const { snapshot } = useStore();
  const cat = snapshot.cats.find((c) => c.id === catId);
  const tz = store.timeZone();

  // The start value is fixed when the form opens.
  const [startValue] = useState(() =>
    existing ? `${existing.date}T${existing.time}` : initialDateTime(tz, defaultDate),
  );
  const stool = existing?.type === 'stool' ? existing : undefined;
  const water = existing?.type === 'water' ? existing : undefined;
  const tagged = existing?.type === 'sleep' || existing?.type === 'stress' ? existing : undefined;
  const stress = existing?.type === 'stress' ? existing : undefined;

  const [dateTime, setDateTime] = useState(startValue);
  const [note, setNote] = useState(existing?.note ?? '');
  const [texture, setTexture] = useState<number | null>(stool?.texture ?? null);
  const [levels, setLevels] = useState({
    mucus: stool?.mucus ?? 0,
    blood: stool?.blood ?? 0,
    smell: stool?.smell ?? 0,
  });
  const [waterLevel, setWaterLevel] = useState<number | null>(water?.water ?? null);
  const [tags, setTags] = useState<string[]>(tagged?.tags ?? []);
  const [severity, setSeverity] = useState<number | null>(stress?.severity ?? null);
  const [ownTag, setOwnTag] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const toggleTag = (text: string) =>
    setTags((list) => (list.includes(text) ? list.filter((t) => t !== text) : [...list, text]));

  const addOwnTag = () => {
    const text = ownTag.trim().slice(0, 40);
    if (text !== '' && !tags.includes(text)) setTags((list) => [...list, text]);
    setOwnTag('');
  };

  function buildFields(): EventFields | null {
    switch (type) {
      case 'stool':
        return {
          type,
          texture: texture as 1 | 2 | 3 | 4 | 5 | null,
          mucus: levels.mucus,
          blood: levels.blood,
          smell: levels.smell,
        };
      case 'water':
        if (waterLevel === null) {
          setError(strings.form.errWater);
          return null;
        }
        return { type, water: waterLevel as 1 | 2 | 3 };
      case 'sleep':
        return { type, tags };
      case 'stress':
        return { type, tags, severity: severity as 1 | 2 | 3 | null };
    }
  }

  async function save() {
    setError('');
    const [date = '', time = ''] = dateTime.split('T');
    if (!isDateString(date) || !isTimeString(time)) {
      setError(strings.form.errDate);
      return;
    }
    const fields = buildFields();
    if (!fields) return;
    // Keep the saved zone and moment if the user did not change the time.
    const stamp =
      existing && dateTime === startValue
        ? { at: existing.at, tz: existing.tz, date: existing.date, time: existing.time }
        : stampFromLocal(date, time, tz);
    setBusy(true);
    try {
      await store.saveEvent({
        ...(existing ? { id: existing.id } : {}),
        catId,
        stamp,
        note,
        fields,
      });
      onDone();
    } catch {
      setError(strings.form.errSave);
      setBusy(false);
    }
  }

  async function remove() {
    if (!existing) return;
    await store.deleteEvent(existing.id);
    onDone();
  }

  return (
    <form
      class="form"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <label class="field">
        <span class="field__label">{strings.form.dateTime}</span>
        <input
          class="input"
          type="datetime-local"
          value={dateTime}
          onInput={(e) => setDateTime(e.currentTarget.value)}
          required
        />
      </label>

      {type === 'stool' && (
        <>
          <fieldset class="group">
            <legend class="field__label">{strings.form.textureOptional}</legend>
            <div class="chips">
              {strings.textures.map((t) => (
                <Chip
                  key={t.code}
                  selected={texture === t.code}
                  onClick={() => setTexture(texture === t.code ? null : t.code)}
                >
                  {t.emoji} {t.label}
                </Chip>
              ))}
            </div>
            <p class="hint">{strings.textures.find((t) => t.code === texture)?.hint ?? ''}</p>
          </fieldset>

          <fieldset class="group">
            <legend class="field__label">{strings.form.extras}</legend>
            {(['mucus', 'blood', 'smell'] as const).map((key) => (
              <div class="level" key={key}>
                <div class="level__name">
                  {strings.features[key].emoji} {strings.features[key].label}
                  <span class="hint"> {strings.features[key].hint}</span>
                </div>
                <div class="chips">
                  {strings.scale.map((label, code) => (
                    <Chip
                      key={code}
                      selected={levels[key] === code}
                      onClick={() => setLevels((l) => ({ ...l, [key]: code }))}
                    >
                      {label}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
          </fieldset>
        </>
      )}

      {type === 'water' && (
        <fieldset class="group">
          <legend class="field__label">{strings.form.waterQuestion}</legend>
          <div class="chips">
            {strings.waterLevels.map((w) => (
              <Chip
                key={w.code}
                selected={waterLevel === w.code}
                onClick={() => setWaterLevel(w.code)}
              >
                {w.emoji} {w.label}
              </Chip>
            ))}
          </div>
          <p class="hint">{strings.waterHint}</p>
        </fieldset>
      )}

      {type === 'stress' && (
        <fieldset class="group">
          <legend class="field__label">{strings.form.stressStrength}</legend>
          <div class="chips">
            {strings.stressSeverity.map((s) => (
              <Chip
                key={s.code}
                selected={severity === s.code}
                onClick={() => setSeverity(severity === s.code ? null : s.code)}
              >
                {s.emoji} {s.label}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      {(type === 'sleep' || type === 'stress') && (
        <fieldset class="group">
          <legend class="field__label">
            {type === 'sleep' ? strings.form.sleepQuestion : strings.form.stressCause}
          </legend>
          <TagPicker
            kind={type}
            own={cat?.customTags[type] ?? []}
            selected={tags}
            onToggle={toggleTag}
          />
          <div class="inline">
            <input
              class="input"
              type="text"
              maxLength={40}
              placeholder={strings.form.addOwn}
              aria-label={strings.form.addOwn}
              value={ownTag}
              onInput={(e) => setOwnTag(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addOwnTag();
                }
              }}
            />
            <button type="button" class="btn" onClick={addOwnTag}>
              {strings.form.addOwnButton}
            </button>
          </div>
        </fieldset>
      )}

      <label class="field">
        <span class="field__label">{strings.form.note}</span>
        <textarea
          class="input"
          rows={2}
          maxLength={2000}
          placeholder={strings.form.notePlaceholder}
          value={note}
          onInput={(e) => setNote(e.currentTarget.value)}
        />
      </label>

      {error !== '' && (
        <p class="error" role="alert">
          {error}
        </p>
      )}

      <div class="actions">
        <button type="submit" class="btn btn--primary" disabled={busy}>
          {strings.common.save}
        </button>
        {existing && <ConfirmDelete onConfirm={() => void remove()} />}
      </div>
    </form>
  );
}

interface TagPickerProps {
  kind: 'sleep' | 'stress';
  own: string[];
  selected: string[];
  onToggle: (text: string) => void;
}

/** Preset tags, the cat's own tags, and own tags added in this form. */
function TagPicker({ kind, own, selected, onToggle }: TagPickerProps) {
  const presets = kind === 'sleep' ? strings.sleepTags : strings.stressTags;
  const known = new Set([...presets.map((p) => p.text), ...own]);
  const extra = selected.filter((t) => !known.has(t));
  const items = [...presets, ...[...own, ...extra].map((text) => ({ text, emoji: '🏷️' }))];
  return (
    <div class="chips">
      {items.map((t) => (
        <Chip key={t.text} selected={selected.includes(t.text)} onClick={() => onToggle(t.text)}>
          {t.emoji} {t.text}
        </Chip>
      ))}
    </div>
  );
}
