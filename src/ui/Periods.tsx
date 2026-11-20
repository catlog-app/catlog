import { strings } from '../strings';
import { store, useStore } from '../store';
import type { Period } from '../types';
import { diffDays, formatDate } from '../logic/dates';
import { todayIn } from '../logic/time';

interface PeriodsProps {
  catId: string;
  onAdd: () => void;
  onEdit: (id: string) => void;
}

function PeriodCard({
  period,
  today,
  onEdit,
}: {
  period: Period;
  today: string;
  onEdit: () => void;
}) {
  const length = diffDays(period.start, period.end ?? today) + 1;
  return (
    <div class="card" data-color={period.color}>
      <button type="button" class="card__main" onClick={onEdit}>
        <span class="card__title">
          <i class="dot" data-color={period.color} /> {strings.periodKinds[period.kind].emoji}{' '}
          {period.title}
        </span>
        <span class="muted">
          {period.end === null
            ? strings.periods.since(formatDate(period.start))
            : strings.periods.range(formatDate(period.start), formatDate(period.end))}
          {' · '}
          {strings.common.days(length)}
        </span>
        {period.note !== '' && <span class="row__note">{period.note}</span>}
      </button>
      {period.end === null && (
        <button
          type="button"
          class="btn btn--small"
          onClick={() =>
            void store.savePeriod({ ...period, end: today < period.start ? period.start : today })
          }
        >
          {strings.periods.endToday}
        </button>
      )}
    </div>
  );
}

export function Periods({ catId, onAdd, onEdit }: PeriodsProps) {
  const { snapshot } = useStore();
  const today = todayIn(store.timeZone());
  const mine = snapshot.periods.filter((p) => p.catId === catId);
  const ongoing = mine.filter((p) => p.end === null).sort((a, b) => b.start.localeCompare(a.start));
  const finished = mine
    .filter((p) => p.end !== null)
    .sort((a, b) => (b.end ?? '').localeCompare(a.end ?? ''));

  return (
    <section class="stack">
      <button type="button" class="btn btn--primary" onClick={onAdd}>
        {strings.periods.newPeriod}
      </button>
      {mine.length === 0 && <p class="muted">{strings.periods.empty}</p>}

      {mine.length > 0 && (
        <>
          <h3 class="subtitle">{strings.periods.ongoing}</h3>
          {ongoing.length === 0 && <p class="muted">{strings.periods.emptyOngoing}</p>}
          {ongoing.map((p) => (
            <PeriodCard key={p.id} period={p} today={today} onEdit={() => onEdit(p.id)} />
          ))}
        </>
      )}
      {finished.length > 0 && (
        <>
          <h3 class="subtitle">{strings.periods.finished}</h3>
          {finished.map((p) => (
            <PeriodCard key={p.id} period={p} today={today} onEdit={() => onEdit(p.id)} />
          ))}
        </>
      )}
    </section>
  );
}
