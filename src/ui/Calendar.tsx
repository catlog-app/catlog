import { useMemo, useState } from 'preact/hooks';
import { strings } from '../strings';
import { store, useStore } from '../store';
import {
  addDays,
  formatDate,
  formatDay,
  formatMonth,
  monthGrid,
  monthOf,
  shiftMonth,
  weekdayLabels,
} from '../logic/dates';
import { summarizeDays, type DaySummary } from '../logic/daily';
import { assignLanes, laneSlots, monthLanes } from '../logic/lanes';
import { todayIn } from '../logic/time';
import { waterOf } from './format';

interface CalendarProps {
  catId: string;
  onOpenDay: (date: string) => void;
  onOpenPeriod: (id: string) => void;
}

/** Text for screen readers. The icons in the cell are hidden from them. */
function cellLabel(date: string, d: DaySummary): string {
  const f = strings.calendar.flags;
  const parts = [formatDay(date)];
  if (d.stoolCount > 0) parts.push(strings.calendar.poopCount(d.stoolCount));
  if (d.maxBlood > 0) parts.push(f.blood);
  if (d.maxMucus > 0) parts.push(f.mucus);
  if (d.maxSmell > 0) parts.push(f.smell);
  if (d.hasWatery) parts.push(f.watery);
  if (d.hasHard) parts.push(f.hard);
  const water = waterOf(d.waterLast);
  if (water) parts.push(strings.calendar.waterLabel(water.label));
  if (d.sleepProblem) parts.push(f.sleep);
  if (d.hasStress) parts.push(f.stress);
  return parts.join(', ');
}

export function Calendar({ catId, onOpenDay, onOpenPeriod }: CalendarProps) {
  const { snapshot } = useStore();
  const { weekStart } = snapshot.settings;
  const today = todayIn(store.timeZone());
  const [view, setView] = useState(() => monthOf(today));

  const periods = useMemo(
    () => snapshot.periods.filter((p) => p.catId === catId),
    [snapshot.periods, catId],
  );
  const lanes = useMemo(() => assignLanes(periods), [periods]);
  const weeks = useMemo(() => monthGrid(view.year, view.month, weekStart), [view, weekStart]);
  const firstDay = weeks[0]?.[0] ?? today;
  const lastDay = weeks.at(-1)?.[6] ?? today;
  const month = useMemo(
    () => monthLanes(periods, lanes, firstDay, lastDay),
    [periods, lanes, firstDay, lastDay],
  );
  const days = useMemo(() => {
    const events = snapshot.events.filter((e) => e.catId === catId);
    const dates = weeks.flat();
    return new Map(summarizeDays(events, [], dates).map((d) => [d.date, d]));
  }, [snapshot.events, catId, weeks]);

  const monthStart = `${view.year}-${String(view.month).padStart(2, '0')}-01`;
  const monthEnd = addDays(
    `${shiftMonth(view.year, view.month, 1).year}-${String(shiftMonth(view.year, view.month, 1).month).padStart(2, '0')}-01`,
    -1,
  );
  const monthPeriods = periods
    .filter((p) => p.start <= monthEnd && (p.end === null || p.end >= monthStart))
    .sort((a, b) => a.start.localeCompare(b.start));

  return (
    <section class="calendar">
      <div class="calendar__nav">
        <button
          type="button"
          class="btn btn--ghost"
          aria-label={strings.calendar.previous}
          onClick={() => setView(shiftMonth(view.year, view.month, -1))}
        >
          ‹
        </button>
        <h2 class="calendar__title">{formatMonth(view.year, view.month)}</h2>
        <button
          type="button"
          class="btn btn--ghost"
          aria-label={strings.calendar.next}
          onClick={() => setView(shiftMonth(view.year, view.month, 1))}
        >
          ›
        </button>
      </div>
      <button
        type="button"
        class="btn btn--ghost btn--small"
        onClick={() => setView(monthOf(today))}
      >
        {strings.common.today}
      </button>

      <div class="calendar__grid" role="grid">
        <div class="calendar__head" role="row">
          {weekdayLabels(weekStart).map((w) => (
            <span key={w} role="columnheader">
              {w}
            </span>
          ))}
        </div>
        {weeks.map((week) => (
          <div class="calendar__week" role="row" key={week[0]}>
            {week.map((date) => {
              const d = days.get(date);
              const inMonth = date >= monthStart && date <= monthEnd;
              const slots = laneSlots(date, periods, lanes, month.laneCount);
              const water = waterOf(d?.waterLast ?? null);
              return (
                <button
                  key={date}
                  type="button"
                  role="gridcell"
                  class="cell"
                  data-outside={inMonth ? undefined : 'true'}
                  data-today={date === today ? 'true' : undefined}
                  aria-label={d ? cellLabel(date, d) : formatDay(date)}
                  onClick={() => onOpenDay(date)}
                >
                  <span class="cell__num">{Number(date.slice(8))}</span>
                  <span class="cell__icons" aria-hidden="true">
                    {d && d.stoolCount > 0 && <span class="cell__count">💩{d.stoolCount}</span>}
                    {d && d.maxBlood > 0 && <span>🩸</span>}
                    {d && d.maxMucus > 0 && <span>🐌</span>}
                    {d && d.maxSmell > 0 && <span>👃</span>}
                    {d?.hasWatery && <span>💦</span>}
                    {d?.hasHard && <span>🪨</span>}
                    {water && <span>{water.emoji}</span>}
                    {d?.sleepProblem && <span>🌙</span>}
                    {d?.hasStress && <span>😿</span>}
                  </span>
                  <span class="cell__bars" aria-hidden="true">
                    {slots.map((slot, i) =>
                      slot ? (
                        <i
                          key={i}
                          class="bar"
                          data-color={periods.find((p) => p.id === slot.id)?.color}
                          data-start={slot.isStart ? 'true' : undefined}
                          data-end={slot.isEnd ? 'true' : undefined}
                        />
                      ) : (
                        <i key={i} class="bar bar--empty" />
                      ),
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <h3 class="subtitle">{strings.calendar.periodsThisMonth}</h3>
      {monthPeriods.length === 0 ? (
        <p class="muted">{strings.calendar.noPeriods}</p>
      ) : (
        <ul class="legend">
          {monthPeriods.map((p) => (
            <li key={p.id}>
              <button type="button" class="legend__item" onClick={() => onOpenPeriod(p.id)}>
                <i class="dot" data-color={p.color} />
                <span>
                  {p.title}
                  <span class="muted">
                    {' '}
                    ·{' '}
                    {p.end === null
                      ? strings.periods.since(formatDate(p.start))
                      : strings.periods.range(formatDate(p.start), formatDate(p.end))}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {month.hidden > 0 && <p class="muted">{strings.calendar.hiddenPeriods(month.hidden)}</p>}
    </section>
  );
}
