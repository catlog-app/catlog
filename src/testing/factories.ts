// Synthetic data for tests. These are not real entries.

import type { Cat, CatEvent, Period, StoolEvent } from '../types';
import { stampFromLocal } from '../logic/time';

let counter = 0;
const nextId = (prefix: string) => `${prefix}-${++counter}`;

export function makeCat(over: Partial<Cat> = {}): Cat {
  return {
    id: nextId('cat'),
    name: 'Test cat',
    archived: false,
    customTags: { sleep: [], stress: [], vomit: [] },
    createdAt: 1000,
    updatedAt: 1000,
    ...over,
  };
}

export function makeStool(
  catId: string,
  date: string,
  time = '08:00',
  over: Partial<StoolEvent> = {},
  tz = 'UTC',
): StoolEvent {
  const stamp = stampFromLocal(date, time, tz);
  return {
    id: nextId('ev'),
    catId,
    type: 'stool',
    ...stamp,
    note: '',
    texture: 2,
    mucus: 0,
    blood: 0,
    smell: 0,
    createdAt: stamp.at,
    updatedAt: stamp.at,
    ...over,
  };
}

export function makeEvent(
  catId: string,
  date: string,
  fields: Partial<CatEvent> & Pick<CatEvent, 'type'>,
  time = '12:00',
  tz = 'UTC',
): CatEvent {
  const stamp = stampFromLocal(date, time, tz);
  const base = {
    id: nextId('ev'),
    catId,
    ...stamp,
    note: '',
    createdAt: stamp.at,
    updatedAt: stamp.at,
  };
  switch (fields.type) {
    case 'water':
      return { ...base, water: 2, ...fields };
    case 'sleep':
    case 'vomit':
      return { ...base, tags: [], ...fields };
    case 'stress':
      return { ...base, tags: [], severity: null, ...fields };
    default:
      return { ...base, texture: 2, mucus: 0, blood: 0, smell: 0, ...fields };
  }
}

export function makePeriod(
  catId: string,
  start: string,
  end: string | null,
  over: Partial<Period> = {},
): Period {
  return {
    id: nextId('per'),
    catId,
    title: 'New food',
    kind: 'food',
    start,
    end,
    note: '',
    color: 'teal',
    createdAt: 1000,
    updatedAt: 1000,
    ...over,
  };
}
