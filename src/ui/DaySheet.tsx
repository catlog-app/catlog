import { strings } from '../strings';
import { store, useStore } from '../store';
import type { EventType } from '../types';
import { isActiveOn } from '../logic/lanes';
import { formatDate } from '../logic/dates';
import { todayIn } from '../logic/time';
import { EventRow } from './EventRow';

interface DaySheetProps {
  catId: string;
  date: string;
  onEditEvent: (id: string) => void;
  onEditPeriod: (id: string) => void;
  onAddEvent: (type: EventType) => void;
  onAddPeriod: () => void;
}

const TYPES: EventType[] = ['stool', 'water', 'sleep', 'stress'];

export function DaySheet({
  catId,
  date,
  onEditEvent,
  onEditPeriod,
  onAddEvent,
  onAddPeriod,
}: DaySheetProps) {
  const { snapshot } = useStore();
  const events = snapshot.events
    .filter((e) => e.catId === catId && e.date === date)
    .sort((a, b) => a.at - b.at);
  const periods = snapshot.periods.filter((p) => p.catId === catId && isActiveOn(p, date));
  const isFuture = date > todayIn(store.timeZone());

  return (
    <div class="stack">
      <p class="muted">{formatDate(date)}</p>

      {events.length === 0 ? (
        <p class="muted">{strings.day.noEntries}</p>
      ) : (
        <div class="list">
          {events.map((e) => (
            <EventRow key={e.id} event={e} onClick={() => onEditEvent(e.id)} />
          ))}
        </div>
      )}

      {periods.length > 0 && (
        <>
          <h3 class="subtitle">{strings.day.activePeriods}</h3>
          <ul class="legend">
            {periods.map((p) => (
              <li key={p.id}>
                <button type="button" class="legend__item" onClick={() => onEditPeriod(p.id)}>
                  <i class="dot" data-color={p.color} />
                  <span>
                    {strings.periodKinds[p.kind].emoji} {p.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 class="subtitle">{strings.day.addEntry}</h3>
      {isFuture && <p class="muted">{strings.day.futureHint}</p>}
      <div class="chips">
        {!isFuture &&
          TYPES.map((t) => (
            <button key={t} type="button" class="btn" onClick={() => onAddEvent(t)}>
              {strings.types[t].emoji} {strings.types[t].label}
            </button>
          ))}
        <button type="button" class="btn" onClick={onAddPeriod}>
          {strings.tabs.periods.emoji} {strings.day.addPeriod}
        </button>
      </div>
    </div>
  );
}
