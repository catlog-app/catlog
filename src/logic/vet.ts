// Short plain-text summary that the owner can paste into a message to the vet.

import type { Cat, CatEvent, Period } from '../types';
import { strings } from '../strings';
import { formatDate } from './dates';
import { isActiveOn } from './lanes';
import { summarizeRange, type DateRange } from './summary';

const pct = (share: number | null) => (share === null ? '-' : `${Math.round(share * 100)}%`);

export function buildVetSummary(
  cat: Cat,
  range: DateRange,
  events: readonly CatEvent[],
  periods: readonly Period[],
): string {
  const v = strings.vet;
  const mine = events.filter((e) => e.catId === cat.id);
  const s = summarizeRange(mine, range);
  const lines: string[] = [];

  lines.push(v.title, '');
  lines.push(`${v.cat}: ${cat.name}`);
  lines.push(`${v.period}: ${formatDate(range.from)} - ${formatDate(range.to)} (${s.days} days)`);
  lines.push(`${v.daysWithEntries}: ${s.daysWithEntries} / ${s.days}`, '');

  lines.push(v.poop);
  lines.push(`- ${v.total}: ${s.stoolTotal} (${s.stoolPerDay.toFixed(2)} ${v.perDay})`);
  lines.push(`- ${v.wateryShare}: ${pct(s.wateryShare)}`);
  lines.push(`- ${v.hardShare}: ${pct(s.hardShare)}`);
  lines.push(`- ${v.mucusDays}: ${s.mucus.any} (${v.strongOnly}: ${s.mucus.strong})`);
  lines.push(`- ${v.bloodDays}: ${s.blood.any} (${v.strongOnly}: ${s.blood.strong})`);
  lines.push(`- ${v.smellDays}: ${s.smell.any} (${v.strongOnly}: ${s.smell.strong})`, '');

  const episodes = mine
    .filter(
      (e) =>
        e.type === 'stool' &&
        (e.blood > 0 || e.mucus > 0) &&
        e.date >= range.from &&
        e.date <= range.to,
    )
    .sort((a, b) => a.at - b.at);
  if (episodes.length > 0) {
    lines.push(v.episodes);
    for (const e of episodes) {
      if (e.type !== 'stool') continue;
      const parts: string[] = [];
      if (e.blood > 0)
        parts.push(`${strings.features.blood.label}: ${strings.scale[e.blood] ?? ''}`);
      if (e.mucus > 0)
        parts.push(`${strings.features.mucus.label}: ${strings.scale[e.mucus] ?? ''}`);
      lines.push(`- ${formatDate(e.date)} ${e.time}: ${parts.join(', ')}`);
    }
    lines.push('');
  }

  lines.push(`${v.water} (${v.waterNote})`);
  lines.push(
    `- ${strings.waterLevels[0]?.label}: ${s.water.little}, ${strings.waterLevels[1]?.label}: ${s.water.enough}, ${strings.waterLevels[2]?.label}: ${s.water.aLot}`,
    '',
  );

  lines.push(`${v.sleep}: ${s.sleepProblemDays} ${v.days}`);
  if (s.topSleepTags.length > 0) {
    lines.push(`- ${s.topSleepTags.map(([t, n]) => `${t} (${n})`).join(', ')}`);
  }
  lines.push(`${v.stress}: ${s.stressDays} ${v.days}`);
  if (s.topStressCauses.length > 0) {
    lines.push(`- ${s.topStressCauses.map(([t, n]) => `${t} (${n})`).join(', ')}`);
  }
  lines.push('');

  const active = periods
    .filter(
      (p) =>
        p.catId === cat.id &&
        (isActiveOn(p, range.from) ||
          isActiveOn(p, range.to) ||
          (p.start >= range.from && p.start <= range.to)),
    )
    .sort((a, b) => a.start.localeCompare(b.start));
  if (active.length > 0) {
    lines.push(v.periods);
    for (const p of active) {
      const end = p.end === null ? v.ongoing : formatDate(p.end);
      const note = p.note.trim() === '' ? '' : `. ${p.note.trim()}`;
      lines.push(
        `- ${p.title} (${strings.periodKinds[p.kind].label}): ${formatDate(p.start)} - ${end}${note}`,
      );
    }
    lines.push('');
  }

  lines.push(strings.app.notMedical);
  return lines.join('\n');
}
