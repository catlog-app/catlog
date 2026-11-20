// Calendar lanes for periods. Each period gets one lane (row) for its whole life,
// so its colored bar stays on the same height in every day cell.

export interface LanePeriod {
  id: string;
  start: string;
  end: string | null;
}

export const MAX_LANES = 6;
const FOREVER = '9999-12-31';

/** Greedy assignment by start date. A lane is free again after its period ends. */
export function assignLanes(periods: readonly LanePeriod[]): Map<string, number> {
  const sorted = [...periods].sort(
    (a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id),
  );
  const laneEnds: string[] = [];
  const result = new Map<string, number>();
  for (const p of sorted) {
    let lane = laneEnds.findIndex((end) => end < p.start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = p.end ?? FOREVER; // an open period blocks its lane
    result.set(p.id, lane);
  }
  return result;
}

export function isActiveOn(p: LanePeriod, date: string): boolean {
  return p.start <= date && (p.end === null || date <= p.end);
}

export interface LaneSlot {
  id: string;
  isStart: boolean;
  isEnd: boolean;
}

export interface MonthLanes {
  /** Number of lanes to draw (at most MAX_LANES). */
  laneCount: number;
  /** Periods in the month that did not fit into MAX_LANES. */
  hidden: number;
}

export function monthLanes(
  periods: readonly LanePeriod[],
  lanes: ReadonlyMap<string, number>,
  firstDay: string,
  lastDay: string,
): MonthLanes {
  let max = -1;
  let hidden = 0;
  for (const p of periods) {
    if (p.start > lastDay || (p.end !== null && p.end < firstDay)) continue;
    const lane = lanes.get(p.id) ?? 0;
    if (lane >= MAX_LANES) hidden++;
    else max = Math.max(max, lane);
  }
  return { laneCount: max + 1, hidden };
}

/** One entry per lane. Empty lanes are null, so the cell can draw a transparent spacer. */
export function laneSlots(
  date: string,
  periods: readonly LanePeriod[],
  lanes: ReadonlyMap<string, number>,
  laneCount: number,
): (LaneSlot | null)[] {
  const slots: (LaneSlot | null)[] = Array.from({ length: laneCount }, () => null);
  for (const p of periods) {
    const lane = lanes.get(p.id);
    if (lane === undefined || lane >= laneCount || !isActiveOn(p, date)) continue;
    slots[lane] = { id: p.id, isStart: p.start === date, isEnd: p.end === date };
  }
  return slots;
}
