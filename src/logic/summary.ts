// Numbers for the Analysis screen. All math runs on the device.

import type { CatEvent } from '../types';
import { dateRange, diffDays, addDays } from './dates';
import { summarizeDays } from './daily';

export type RangeChoice = 7 | 14 | 30 | 90 | 'all';

export interface DateRange {
  from: string;
  to: string;
}

/** The range ends today. "All" starts at the first entry. */
export function resolveRange(
  choice: RangeChoice,
  today: string,
  events: readonly CatEvent[],
): DateRange {
  if (choice === 'all') {
    const first = events.reduce<string>((min, e) => (e.date < min ? e.date : min), today);
    return { from: first, to: today };
  }
  return { from: addDays(today, -(choice - 1)), to: today };
}

export interface Count {
  /** Days with any level (mild or more). */
  any: number;
  /** Days with medium or strong. */
  strong: number;
}

export interface RangeSummary extends DateRange {
  days: number;
  daysWithEntries: number;
  stoolTotal: number;
  /** Stool per calendar day in the range (empty days count as zero). */
  stoolPerDay: number;
  /** Share (0..1) of stools that have a texture. Null if there are none. */
  wateryShare: number | null;
  hardShare: number | null;
  mucus: Count;
  blood: Count;
  smell: Count;
  water: { little: number; enough: number; aLot: number };
  sleepProblemDays: number;
  stressDays: number;
  topStressCauses: [string, number][];
  topSleepTags: [string, number][];
  /** Days with at least one vomit, the number of vomit entries, and the common kinds. */
  vomitDays: number;
  vomitTotal: number;
  topVomitTags: [string, number][];
}

function top(items: string[], limit = 5): [string, number][] {
  const counts = new Map<string, number>();
  for (const i of items) counts.set(i, (counts.get(i) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

export function summarizeRange(events: readonly CatEvent[], range: DateRange): RangeSummary {
  const dates = dateRange(range.from, range.to);
  const inRange = events.filter((e) => e.date >= range.from && e.date <= range.to);
  const days = summarizeDays(inRange, [], dates);

  const textures = days.flatMap((d) => d.textures);
  const count = (pick: (d: (typeof days)[number]) => number): Count => ({
    any: days.filter((d) => pick(d) >= 1).length,
    strong: days.filter((d) => pick(d) >= 2).length,
  });
  const share = (n: number) => (textures.length === 0 ? null : n / textures.length);

  const waterDays = days.filter((d) => d.waterLast !== null);
  return {
    ...range,
    days: Math.max(1, diffDays(range.from, range.to) + 1),
    daysWithEntries: days.filter((d) => d.hasEntries).length,
    stoolTotal: days.reduce((sum, d) => sum + d.stoolCount, 0),
    stoolPerDay: days.reduce((sum, d) => sum + d.stoolCount, 0) / Math.max(1, days.length),
    wateryShare: share(textures.filter((t) => t >= 4).length),
    hardShare: share(textures.filter((t) => t === 1).length),
    mucus: count((d) => d.maxMucus),
    blood: count((d) => d.maxBlood),
    smell: count((d) => d.maxSmell),
    // Water is counted per day by the last entry of that day.
    water: {
      little: waterDays.filter((d) => d.waterLast === 1).length,
      enough: waterDays.filter((d) => d.waterLast === 2).length,
      aLot: waterDays.filter((d) => d.waterLast === 3).length,
    },
    sleepProblemDays: days.filter((d) => d.sleepProblem).length,
    stressDays: days.filter((d) => d.hasStress).length,
    topStressCauses: top(days.flatMap((d) => d.stressTags)),
    topSleepTags: top(days.flatMap((d) => d.sleepTags)),
    vomitDays: days.filter((d) => d.vomitCount > 0).length,
    vomitTotal: days.reduce((sum, d) => sum + d.vomitCount, 0),
    topVomitTags: top(days.flatMap((d) => d.vomitTags)),
  };
}
