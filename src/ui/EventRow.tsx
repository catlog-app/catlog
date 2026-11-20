import type { CatEvent, Period } from '../types';
import { strings } from '../strings';
import { describeEvent } from './format';

interface EventRowProps {
  event: CatEvent;
  /** Periods that are active on the day of the event (shown as colored dots). */
  periods?: readonly Period[];
  onClick: () => void;
}

export function EventRow({ event, periods = [], onClick }: EventRowProps) {
  const line = describeEvent(event);
  return (
    <button type="button" class="row" onClick={onClick}>
      <span class="row__time">{event.time}</span>
      <span class="row__emoji" aria-hidden="true">
        {line.emoji}
      </span>
      <span class="row__main">
        <span class="row__title">{line.title}</span>
        {line.detail !== '' && <span class="row__detail">{line.detail}</span>}
        {event.note !== '' && <span class="row__note">{event.note}</span>}
      </span>
      {periods.length > 0 && (
        <span
          class="dots"
          role="img"
          aria-label={`${strings.day.activePeriods}: ${periods.map((p) => p.title).join(', ')}`}
        >
          {periods.map((p) => (
            <i key={p.id} class="dot" data-color={p.color} />
          ))}
        </span>
      )}
    </button>
  );
}
