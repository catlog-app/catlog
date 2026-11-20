import { useMemo, useState } from 'preact/hooks';
import { strings } from '../strings';
import { useStore } from '../store';
import type { EventType } from '../types';
import { formatDay } from '../logic/dates';
import { isActiveOn } from '../logic/lanes';
import { Chip } from './Chip';
import { EventRow } from './EventRow';

const PAGE = 40;
const TYPES: EventType[] = ['stool', 'water', 'vomit', 'sleep', 'stress'];

interface LogProps {
  catId: string;
  onEditEvent: (id: string) => void;
}

export function Log({ catId, onEditEvent }: LogProps) {
  const { snapshot } = useStore();
  const [filter, setFilter] = useState<EventType[]>([]);
  const [limit, setLimit] = useState(PAGE);

  const events = useMemo(
    () =>
      snapshot.events
        .filter((e) => e.catId === catId && (filter.length === 0 || filter.includes(e.type)))
        .sort((a, b) => b.at - a.at),
    [snapshot.events, catId, filter],
  );
  const periods = useMemo(
    () => snapshot.periods.filter((p) => p.catId === catId),
    [snapshot.periods, catId],
  );

  const shown = events.slice(0, limit);
  // Group by local day. The list is already sorted from new to old.
  const groups: { date: string; items: typeof shown }[] = [];
  for (const e of shown) {
    const last = groups.at(-1);
    if (last?.date === e.date) last.items.push(e);
    else groups.push({ date: e.date, items: [e] });
  }

  const toggle = (t: EventType) => {
    setLimit(PAGE);
    setFilter((f) => (f.includes(t) ? f.filter((x) => x !== t) : [...f, t]));
  };

  return (
    <section class="stack">
      <div class="chips" role="group" aria-label={strings.log.filter}>
        <Chip selected={filter.length === 0} onClick={() => setFilter([])}>
          {strings.common.all}
        </Chip>
        {TYPES.map((t) => (
          <Chip key={t} selected={filter.includes(t)} onClick={() => toggle(t)}>
            {strings.types[t].emoji} {strings.types[t].label}
          </Chip>
        ))}
      </div>

      {events.length === 0 && <p class="muted">{strings.log.empty}</p>}

      {groups.map((g) => (
        <div key={g.date}>
          <h3 class="subtitle">{formatDay(g.date)}</h3>
          <div class="list">
            {g.items.map((e) => (
              <EventRow
                key={e.id}
                event={e}
                periods={periods.filter((p) => isActiveOn(p, e.date))}
                onClick={() => onEditEvent(e.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {events.length > shown.length && (
        <button type="button" class="btn" onClick={() => setLimit(limit + PAGE)}>
          {strings.common.showMore}
        </button>
      )}
    </section>
  );
}
