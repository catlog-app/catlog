// Groups events by local day. A day without entries is not a day without stool,
// so every summary says whether the day has entries at all.

import type { CatEvent, Period, WaterLevel } from '../types';
import { isActiveOn } from './lanes';

export interface DaySummary {
  date: string;
  hasEntries: boolean;
  stoolCount: number;
  /** Texture codes in time order. Stool without a texture is not listed. */
  textures: number[];
  maxTexture: number | null;
  hasWatery: boolean; // texture 4 or 5
  hasHard: boolean; // texture 1
  maxMucus: number;
  maxBlood: number;
  maxSmell: number;
  /** Water level of the last water entry of the day. */
  waterLast: WaterLevel | null;
  waterEntries: number;
  sleepProblem: boolean;
  sleepTags: string[];
  hasStress: boolean;
  maxStress: number;
  stressTags: string[];
  vomitCount: number;
  vomitTags: string[];
  notes: string[];
  activePeriodIds: string[];
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

export function summarizeDays(
  events: readonly CatEvent[],
  periods: readonly Period[],
  dates: readonly string[],
): DaySummary[] {
  const byDate = new Map<string, CatEvent[]>();
  for (const e of events) {
    const list = byDate.get(e.date);
    if (list) list.push(e);
    else byDate.set(e.date, [e]);
  }

  return dates.map((date) => {
    const day = (byDate.get(date) ?? []).sort((a, b) => a.at - b.at);
    const s: DaySummary = {
      date,
      hasEntries: day.length > 0,
      stoolCount: 0,
      textures: [],
      maxTexture: null,
      hasWatery: false,
      hasHard: false,
      maxMucus: 0,
      maxBlood: 0,
      maxSmell: 0,
      waterLast: null,
      waterEntries: 0,
      sleepProblem: false,
      sleepTags: [],
      hasStress: false,
      maxStress: 0,
      stressTags: [],
      vomitCount: 0,
      vomitTags: [],
      notes: [],
      activePeriodIds: periods.filter((p) => isActiveOn(p, date)).map((p) => p.id),
    };
    for (const e of day) {
      if (e.note.trim() !== '') s.notes.push(e.note.trim());
      switch (e.type) {
        case 'stool':
          s.stoolCount++;
          if (e.texture !== null) s.textures.push(e.texture);
          s.maxMucus = Math.max(s.maxMucus, e.mucus);
          s.maxBlood = Math.max(s.maxBlood, e.blood);
          s.maxSmell = Math.max(s.maxSmell, e.smell);
          break;
        case 'water':
          s.waterEntries++;
          s.waterLast = e.water;
          break;
        case 'sleep':
          s.sleepProblem = true;
          s.sleepTags.push(...e.tags);
          break;
        case 'stress':
          s.hasStress = true;
          s.maxStress = Math.max(s.maxStress, e.severity ?? 0);
          s.stressTags.push(...e.tags);
          break;
        case 'vomit':
          s.vomitCount++;
          s.vomitTags.push(...e.tags);
          break;
      }
    }
    if (s.textures.length > 0) {
      s.maxTexture = Math.max(...s.textures);
      s.hasWatery = s.textures.some((t) => t >= 4);
      s.hasHard = s.textures.includes(1);
    }
    s.sleepTags = unique(s.sleepTags);
    s.stressTags = unique(s.stressTags);
    s.vomitTags = unique(s.vomitTags);
    return s;
  });
}
