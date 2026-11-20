// Tables for export. Every scale has a number code and a text label side by side,
// so the data is easy to filter and to chart.

import type { Cat, CatEvent, Period } from '../types';
import { strings } from '../strings';
import { dateRange, diffDays } from './dates';
import { summarizeDays } from './daily';
import { isActiveOn } from './lanes';
import { formatOffset, offsetMinutes } from './time';

export type Cell = string | number | null;
export type Table = Cell[][]; // first row = header

export type Sheet = 'Events' | 'Daily' | 'Periods';
export type SheetSet = Record<Sheet, Table>;

export interface ExportInput {
  cat: Cat;
  events: readonly CatEvent[];
  periods: readonly Period[];
  from: string;
  to: string;
  /** Used for the length of periods that are still running. */
  today: string;
}

/**
 * Text typed by the user can start with = + - or @. A spreadsheet may read it as a formula,
 * so we add a quote in front. Numbers and our own codes are not touched.
 */
export function safeText(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

const textureLabel = (n: number | null) =>
  strings.textures.find((t) => t.code === n)?.label ?? null;
const waterLabel = (n: number | null) =>
  strings.waterLevels.find((w) => w.code === n)?.label ?? null;

function inRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

function overlaps(p: Period, from: string, to: string): boolean {
  return p.start <= to && (p.end === null || p.end >= from);
}

/** Period names for column headers. Equal names get the start date, so headers stay unique. */
function periodColumnNames(periods: readonly Period[]): Map<string, string> {
  const counts = new Map<string, number>();
  for (const p of periods) counts.set(p.title, (counts.get(p.title) ?? 0) + 1);
  const names = new Map<string, string>();
  for (const p of periods) {
    const unique = (counts.get(p.title) ?? 0) > 1 ? `${p.title} (${p.start})` : p.title;
    names.set(p.id, `Period: ${safeText(unique)}`);
  }
  return names;
}

export function buildEventsTable({ cat, events, periods, from, to }: ExportInput): Table {
  const header: Cell[] = [
    'Cat',
    'UTC timestamp (ISO)',
    'Local date',
    'Local time',
    'UTC offset',
    'Time zone',
    'Type',
    'Texture (code 1-5)',
    'Texture',
    'Mucus (0-3)',
    'Blood (0-3)',
    'Smell (0-3)',
    'Water (code 1-3)',
    'Water',
    'Sleep tags',
    'Stress tags',
    'Stress severity (0-3)',
    'Note',
    'Active periods',
  ];
  const rows = events
    .filter((e) => e.catId === cat.id && inRange(e.date, from, to))
    .sort((a, b) => a.at - b.at)
    .map((e): Cell[] => {
      const active = periods
        .filter((p) => p.catId === cat.id && isActiveOn(p, e.date))
        .map((p) => safeText(p.title))
        .join('; ');
      const stool = e.type === 'stool' ? e : null;
      const water = e.type === 'water' ? e.water : null;
      return [
        safeText(cat.name),
        new Date(e.at).toISOString(),
        e.date,
        e.time,
        `UTC${formatOffset(offsetMinutes(e.at, e.tz))}`,
        e.tz,
        strings.types[e.type].exportLabel,
        stool?.texture ?? null,
        stool ? textureLabel(stool.texture) : null,
        stool ? stool.mucus : null,
        stool ? stool.blood : null,
        stool ? stool.smell : null,
        water,
        waterLabel(water),
        e.type === 'sleep' ? e.tags.map(safeText).join('; ') : null,
        e.type === 'stress' ? e.tags.map(safeText).join('; ') : null,
        e.type === 'stress' ? (e.severity ?? 0) : null,
        e.note === '' ? null : safeText(e.note),
        active === '' ? null : active,
      ];
    });
  return [header, ...rows];
}

export function buildDailyTable({ cat, events, periods, from, to }: ExportInput): Table {
  const catPeriods = periods.filter((p) => p.catId === cat.id && overlaps(p, from, to));
  const names = periodColumnNames(catPeriods);
  const header: Cell[] = [
    'Cat',
    'Date',
    'Has entries (0/1)',
    'Stool count',
    'Textures (codes)',
    'Max texture code',
    'Max mucus',
    'Max blood',
    'Max smell',
    'Water (last entry, code)',
    'Water (last entry)',
    'Water entries',
    'Sleep problem (0/1)',
    'Sleep tags',
    'Max stress severity',
    'Stress tags',
    'Notes',
    'Active periods',
    ...catPeriods.map((p) => names.get(p.id) ?? p.title),
  ];

  const catEvents = events.filter((e) => e.catId === cat.id);
  // Every calendar day is listed, also days without entries.
  const days = summarizeDays(catEvents, catPeriods, dateRange(from, to));
  const rows = days.map((d): Cell[] => [
    safeText(cat.name),
    d.date,
    d.hasEntries ? 1 : 0,
    d.stoolCount,
    // "; " and not ",": a spreadsheet can read "2,3" as the number 2.3 or 23.
    d.textures.length > 0 ? d.textures.join('; ') : null,
    d.maxTexture,
    d.maxMucus,
    d.maxBlood,
    d.maxSmell,
    d.waterLast,
    waterLabel(d.waterLast),
    d.waterEntries,
    d.sleepProblem ? 1 : 0,
    d.sleepTags.length > 0 ? d.sleepTags.map(safeText).join('; ') : null,
    d.maxStress,
    d.stressTags.length > 0 ? d.stressTags.map(safeText).join('; ') : null,
    d.notes.length > 0 ? safeText(d.notes.join(' | ')) : null,
    d.activePeriodIds.length > 0
      ? catPeriods
          .filter((p) => d.activePeriodIds.includes(p.id))
          .map((p) => safeText(p.title))
          .join('; ')
      : null,
    ...catPeriods.map((p) => (d.activePeriodIds.includes(p.id) ? 1 : 0)),
  ]);
  return [header, ...rows];
}

export function buildPeriodsTable({ cat, periods, from, to, today }: ExportInput): Table {
  const header: Cell[] = [
    'Cat',
    'Title',
    'Kind',
    'Start',
    'End',
    'Ongoing (0/1)',
    'Duration (days)',
    'Note',
  ];
  const rows = periods
    .filter((p) => p.catId === cat.id && overlaps(p, from, to))
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((p): Cell[] => [
      safeText(cat.name),
      safeText(p.title),
      strings.periodKinds[p.kind].label,
      p.start,
      p.end,
      p.end === null ? 1 : 0,
      diffDays(p.start, p.end ?? today) + 1,
      p.note === '' ? null : safeText(p.note),
    ]);
  return [header, ...rows];
}

export function buildSheets(input: ExportInput): SheetSet {
  return {
    Events: buildEventsTable(input),
    Daily: buildDailyTable(input),
    Periods: buildPeriodsTable(input),
  };
}

/** CSV with a BOM, so Excel reads UTF-8 correctly. */
export function toCsv(table: Table, delimiter: ',' | ';' = ','): string {
  const escape = (cell: Cell): string => {
    if (cell === null) return '';
    const text = String(cell);
    return /[",;\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return '﻿' + table.map((row) => row.map(escape).join(delimiter)).join('\r\n') + '\r\n';
}

/** Letters and digits only, for file names. */
export function slug(text: string): string {
  const s = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s === '' ? 'cat' : s;
}
