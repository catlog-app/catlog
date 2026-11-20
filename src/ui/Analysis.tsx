import { useMemo, useState } from 'preact/hooks';
import { strings } from '../strings';
import { store, useStore } from '../store';
import { dateRange, formatDay } from '../logic/dates';
import { summarizeDays } from '../logic/daily';
import { resolveRange, summarizeRange, type RangeChoice } from '../logic/summary';
import { todayIn } from '../logic/time';
import { buildVetSummary } from '../logic/vet';
import { copyText } from '../platform';
import { Chip } from './Chip';
import { textureOf, waterOf } from './format';

const CHOICES: RangeChoice[] = [7, 14, 30, 90, 'all'];

const percent = (share: number | null) =>
  share === null ? strings.analysis.noTexture : `${Math.round(share * 100)}%`;

interface AnalysisProps {
  catId: string;
}

export function Analysis({ catId }: AnalysisProps) {
  const { snapshot } = useStore();
  const [choice, setChoice] = useState<RangeChoice>(30);
  const [vetText, setVetText] = useState('');
  const [copyState, setCopyState] = useState<'' | 'ok' | 'failed'>('');

  const today = todayIn(store.timeZone());
  const events = useMemo(
    () => snapshot.events.filter((e) => e.catId === catId),
    [snapshot.events, catId],
  );
  const periods = useMemo(
    () => snapshot.periods.filter((p) => p.catId === catId),
    [snapshot.periods, catId],
  );
  const cat = snapshot.cats.find((c) => c.id === catId);

  const range = useMemo(() => resolveRange(choice, today, events), [choice, today, events]);
  const summary = useMemo(() => summarizeRange(events, range), [events, range]);
  const days = useMemo(
    () => summarizeDays(events, periods, dateRange(range.from, range.to)).reverse(),
    [events, periods, range],
  );

  async function copyVet() {
    if (!cat) return;
    const text = buildVetSummary(cat, range, snapshot.events, snapshot.periods);
    setVetText(text);
    setCopyState((await copyText(text)) ? 'ok' : 'failed');
  }

  const a = strings.analysis;
  const rows: [string, string][] = [
    [a.daysWithEntries, `${summary.daysWithEntries} / ${summary.days}`],
    [a.stoolTotal, String(summary.stoolTotal)],
    [a.stoolPerDay, summary.stoolPerDay.toFixed(2)],
    [a.wateryShare, percent(summary.wateryShare)],
    [a.hardShare, percent(summary.hardShare)],
    [a.sleepDays, String(summary.sleepProblemDays)],
    [a.stressDays, String(summary.stressDays)],
    [a.vomitDays, `${summary.vomitDays} (${summary.vomitTotal})`],
  ];
  const counts: [string, string, { any: number; strong: number }][] = [
    [strings.features.mucus.emoji, strings.features.mucus.label, summary.mucus],
    [strings.features.blood.emoji, strings.features.blood.label, summary.blood],
    [strings.features.smell.emoji, strings.features.smell.label, summary.smell],
  ];

  return (
    <section class="stack">
      <div class="chips" role="group" aria-label={a.range}>
        {CHOICES.map((c) => (
          <Chip key={String(c)} selected={choice === c} onClick={() => setChoice(c)}>
            {a.ranges[String(c) as keyof typeof a.ranges]}
          </Chip>
        ))}
      </div>

      <h3 class="subtitle">{a.summary}</h3>
      <dl class="facts">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <table class="table table--small">
        <thead>
          <tr>
            <th scope="col"> </th>
            <th scope="col">{a.anyDays}</th>
            <th scope="col">{a.strongDays}</th>
          </tr>
        </thead>
        <tbody>
          {counts.map(([emoji, label, c]) => (
            <tr key={label}>
              <th scope="row">
                {emoji} {label}
              </th>
              <td>{c.any}</td>
              <td>{c.strong}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 class="subtitle">{a.waterDays}</h3>
      <p>
        {strings.waterLevels
          .map(
            (w, i) =>
              `${w.emoji} ${w.label}: ${[summary.water.little, summary.water.enough, summary.water.aLot][i] ?? 0}`,
          )
          .join(' · ')}
      </p>

      {summary.topStressCauses.length > 0 && (
        <>
          <h3 class="subtitle">{a.causes}</h3>
          <p>{summary.topStressCauses.map(([t, n]) => `${t} (${n})`).join(' · ')}</p>
        </>
      )}
      {summary.topVomitTags.length > 0 && (
        <>
          <h3 class="subtitle">{a.vomitTags}</h3>
          <p>{summary.topVomitTags.map(([t, n]) => `${t} (${n})`).join(' · ')}</p>
        </>
      )}
      {summary.topSleepTags.length > 0 && (
        <>
          <h3 class="subtitle">{a.sleepTags}</h3>
          <p>{summary.topSleepTags.map(([t, n]) => `${t} (${n})`).join(' · ')}</p>
        </>
      )}

      <button type="button" class="btn" onClick={() => void copyVet()}>
        {a.copyVet}
      </button>
      {copyState === 'ok' && (
        <p class="ok" role="status">
          {a.copied}
        </p>
      )}
      {copyState === 'failed' && (
        <p class="error" role="alert">
          {a.copyFailed}
        </p>
      )}
      {vetText !== '' && (
        <textarea class="input vet" readOnly rows={12} value={vetText} aria-label={a.vetTitle} />
      )}

      <h3 class="subtitle">{a.table}</h3>
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">{a.colDay}</th>
              <th scope="col">{a.colPoop}</th>
              <th scope="col">{a.colExtras}</th>
              <th scope="col">{a.colWater}</th>
              <th scope="col">{a.colSleepStress}</th>
              <th scope="col">{a.colPeriods}</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date} class={d.hasEntries ? undefined : 'is-empty'}>
                <th scope="row">{formatDay(d.date)}</th>
                <td>
                  {d.stoolCount > 0
                    ? `${d.stoolCount}${d.textures.length > 0 ? ` (${d.textures.map((t) => textureOf(t)?.emoji ?? '').join('')})` : ''}`
                    : d.hasEntries
                      ? '0'
                      : ''}
                </td>
                <td>
                  {d.maxBlood > 0 ? '🩸' : ''}
                  {d.maxMucus > 0 ? '🐌' : ''}
                  {d.maxSmell > 0 ? '👃' : ''}
                </td>
                <td>{waterOf(d.waterLast)?.emoji ?? ''}</td>
                <td>
                  {d.sleepProblem ? '🌙' : ''}
                  {d.hasStress ? '😿' : ''}
                  {d.vomitCount > 0 ? '🤮' : ''}
                </td>
                <td>
                  {d.activePeriodIds.map((id) => {
                    const p = periods.find((x) => x.id === id);
                    return p ? (
                      <i key={id} class="dot" data-color={p.color} title={p.title} />
                    ) : null;
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {summary.daysWithEntries === 0 && <p class="muted">{a.none}</p>}
    </section>
  );
}
