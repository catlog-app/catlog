import { useState } from 'preact/hooks';
import { strings } from '../strings';
import { store } from '../store';
import { PALETTE, type Period, type PeriodKind } from '../types';
import { isDateString } from '../logic/dates';
import { todayIn } from '../logic/time';
import { Chip } from './Chip';
import { ConfirmDelete } from './ConfirmDelete';

interface PeriodFormProps {
  catId: string;
  existing?: Period;
  /** Start date for a new period. */
  defaultStart?: string;
  onDone: () => void;
}

const KINDS: PeriodKind[] = ['med', 'food', 'supp', 'other'];

export function PeriodForm({ catId, existing, defaultStart, onDone }: PeriodFormProps) {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [kind, setKind] = useState<PeriodKind>(existing?.kind ?? 'food');
  const [start, setStart] = useState(existing?.start ?? defaultStart ?? todayIn(store.timeZone()));
  const [end, setEnd] = useState(existing?.end ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [color, setColor] = useState(existing?.color ?? store.nextColor(catId));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    setError('');
    if (title.trim() === '') {
      setError(strings.periods.errTitle);
      return;
    }
    const endValue = end === '' ? null : end;
    if (
      !isDateString(start) ||
      (endValue !== null && (!isDateString(endValue) || endValue < start))
    ) {
      setError(strings.periods.errDates);
      return;
    }
    setBusy(true);
    try {
      await store.savePeriod({
        ...(existing ? { id: existing.id } : {}),
        catId,
        title,
        kind,
        start,
        end: endValue,
        note,
        color,
      });
      onDone();
    } catch {
      setError(strings.periods.errSave);
      setBusy(false);
    }
  }

  async function remove() {
    if (!existing) return;
    await store.deletePeriod(existing.id);
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
        <span class="field__label">{strings.periods.title}</span>
        <input
          class="input"
          type="text"
          list="period-names"
          maxLength={100}
          value={title}
          onInput={(e) => setTitle(e.currentTarget.value)}
          required
        />
        <datalist id="period-names">
          {strings.periodNameHints.map((h) => (
            <option key={h} value={h} />
          ))}
        </datalist>
      </label>

      <fieldset class="group">
        <legend class="field__label">{strings.periods.kind}</legend>
        <div class="chips">
          {KINDS.map((k) => (
            <Chip key={k} selected={kind === k} onClick={() => setKind(k)}>
              {strings.periodKinds[k].emoji} {strings.periodKinds[k].label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div class="two">
        <label class="field">
          <span class="field__label">{strings.periods.start}</span>
          <input
            class="input"
            type="date"
            value={start}
            onInput={(e) => setStart(e.currentTarget.value)}
            required
          />
        </label>
        <label class="field">
          <span class="field__label">{strings.periods.end}</span>
          <input
            class="input"
            type="date"
            value={end}
            onInput={(e) => setEnd(e.currentTarget.value)}
          />
        </label>
      </div>
      <p class="hint">{strings.periods.endHint}</p>

      <fieldset class="group">
        <legend class="field__label">{strings.periods.color}</legend>
        <div class="chips">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              class="swatch"
              data-color={c}
              aria-pressed={color === c}
              aria-label={strings.colors[c]}
              onClick={() => setColor(c)}
            >
              {color === c ? '✓' : ''}
            </button>
          ))}
        </div>
      </fieldset>

      <label class="field">
        <span class="field__label">{strings.periods.note}</span>
        <textarea
          class="input"
          rows={2}
          maxLength={2000}
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
