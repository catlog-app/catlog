import { useCallback, useEffect, useState } from 'preact/hooks';
import { strings } from '../strings';
import { store, useStore } from '../store';
import { DEFAULT_CAT_EMOJI, type EventType } from '../types';
import { backupReminderKey } from '../logic/reminders';
import { Analysis } from './Analysis';
import { BackupButton, ImportBackup } from './Backup';
import { Calendar } from './Calendar';
import { DaySheet } from './DaySheet';
import { EventForm } from './EventForm';
import { InfoText } from './InfoSheet';
import { Log } from './Log';
import { Onboarding } from './Onboarding';
import { PeriodForm } from './PeriodForm';
import { Periods } from './Periods';
import { Settings } from './Settings';
import { Sheet } from './Sheet';

type Tab = 'calendar' | 'log' | 'periods' | 'analysis';

/** What is open in the bottom sheet. Sheets form a stack: closing one returns to the one below. */
type SheetState =
  | { kind: 'event'; type: EventType; id?: string; date?: string }
  | { kind: 'day'; date: string }
  | { kind: 'period'; id?: string; start?: string }
  | { kind: 'settings' }
  | { kind: 'info'; which: 'data' | 'about' }
  | { kind: 'import' };

const TABS: Tab[] = ['calendar', 'log', 'periods', 'analysis'];
const QUICK: EventType[] = ['stool', 'water', 'sleep', 'stress'];

export function App() {
  const state = useStore();
  const [tab, setTab] = useState<Tab>('calendar');
  const [sheets, setSheets] = useState<SheetState[]>([]);

  useEffect(() => {
    void store.init();
  }, []);

  const open = useCallback((s: SheetState) => setSheets((list) => [...list, s]), []);
  const close = useCallback(() => setSheets((list) => list.slice(0, -1)), []);
  const closeAll = useCallback(() => setSheets([]), []);

  if (state.status === 'loading') return <p class="center muted">…</p>;
  if (state.status === 'error') {
    return (
      <main class="onboarding">
        <p class="error" role="alert">
          {state.error}
        </p>
      </main>
    );
  }

  const { snapshot } = state;
  const { settings } = snapshot;
  const cats = snapshot.cats.filter((c) => !c.archived);
  if (cats.length === 0) return <Onboarding />;
  const cat = cats.find((c) => c.id === settings.activeCatId) ?? cats[0];
  if (!cat) return <Onboarding />;

  const top = sheets.at(-1);
  const showBackup = store.isBackupBannerVisible();
  const showFirstRun = !settings.dismissedReminders.includes('first-run');

  function sheetTitle(s: SheetState): string {
    switch (s.kind) {
      case 'event': {
        const t = strings.types[s.type];
        return `${t.emoji} ${t.label}`;
      }
      case 'day':
        return strings.tabs.calendar.label;
      case 'period':
        return s.id ? strings.periods.editPeriod : strings.periods.newPeriod;
      case 'settings':
        return strings.settings.title;
      case 'info':
        return s.which === 'data' ? strings.dataInfo.title : strings.aboutInfo.title;
      case 'import':
        return strings.backup.importTitle;
    }
  }

  function renderSheet(s: SheetState) {
    if (!cat) return null;
    switch (s.kind) {
      case 'event': {
        const existing = s.id ? snapshot.events.find((e) => e.id === s.id) : undefined;
        return (
          <EventForm
            // A new key resets the form when another entry is opened.
            key={s.id ?? 'new'}
            type={s.type}
            catId={cat.id}
            {...(existing ? { existing } : {})}
            {...(s.date ? { defaultDate: s.date } : {})}
            onDone={close}
          />
        );
      }
      case 'day':
        return (
          <DaySheet
            catId={cat.id}
            date={s.date}
            onEditEvent={(id) => {
              const e = snapshot.events.find((x) => x.id === id);
              if (e) open({ kind: 'event', type: e.type, id });
            }}
            onEditPeriod={(id) => open({ kind: 'period', id })}
            onAddEvent={(type) => open({ kind: 'event', type, date: s.date })}
            onAddPeriod={() => open({ kind: 'period', start: s.date })}
          />
        );
      case 'period': {
        const existing = s.id ? snapshot.periods.find((p) => p.id === s.id) : undefined;
        return (
          <PeriodForm
            key={s.id ?? 'new'}
            catId={cat.id}
            {...(existing ? { existing } : {})}
            {...(s.start ? { defaultStart: s.start } : {})}
            onDone={close}
          />
        );
      }
      case 'settings':
        return (
          <Settings
            catId={cat.id}
            onImport={() => open({ kind: 'import' })}
            onInfo={(which) => open({ kind: 'info', which })}
            onClose={closeAll}
          />
        );
      case 'info':
        return <InfoText which={s.which} />;
      case 'import':
        return <ImportBackup onDone={closeAll} />;
    }
  }

  const editEvent = (id: string) => {
    const e = snapshot.events.find((x) => x.id === id);
    if (e) open({ kind: 'event', type: e.type, id });
  };

  return (
    <div class="app">
      <header class="header">
        <h1 class="header__title">
          <span aria-hidden="true">{cat.emoji ?? DEFAULT_CAT_EMOJI}</span>{' '}
          {cats.length > 1 ? '' : cat.name}
        </h1>
        {cats.length > 1 && (
          <select
            class="input header__cat"
            aria-label={strings.header.cat}
            value={cat.id}
            onChange={(e) => void store.updateSettings({ activeCatId: e.currentTarget.value })}
          >
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          class="btn btn--ghost header__settings"
          aria-label={strings.header.settings}
          onClick={() => open({ kind: 'settings' })}
        >
          ⚙️
        </button>
      </header>

      <div class="banners">
        {state.timeZoneNotice !== null && (
          <Banner onDismiss={() => store.dismissTimeZoneNotice()}>
            {strings.banners.timeZoneChanged(state.timeZoneNotice)}
          </Banner>
        )}
        {showBackup && (
          <Banner onDismiss={() => void store.dismissReminder(backupReminderKey(Date.now()))}>
            <p>{strings.banners.backupDue}</p>
            <BackupButton />
          </Banner>
        )}
        {showFirstRun && (
          <Banner onDismiss={() => void store.dismissReminder('first-run')}>
            <p>{strings.banners.firstRun}</p>
          </Banner>
        )}
      </div>

      {tab === 'calendar' && (
        <nav class="quick" aria-label={strings.quickBar.label}>
          {QUICK.map((t) => (
            <button
              key={t}
              type="button"
              class="quick__btn"
              onClick={() => open({ kind: 'event', type: t })}
            >
              <span class="quick__emoji" aria-hidden="true">
                {strings.types[t].emoji}
              </span>
              <span>{strings.types[t].label}</span>
            </button>
          ))}
        </nav>
      )}

      <main class="main">
        {tab === 'calendar' && (
          <Calendar
            catId={cat.id}
            onOpenDay={(date) => open({ kind: 'day', date })}
            onOpenPeriod={(id) => open({ kind: 'period', id })}
          />
        )}
        {tab === 'log' && <Log catId={cat.id} onEditEvent={editEvent} />}
        {tab === 'periods' && (
          <Periods
            catId={cat.id}
            onAdd={() => open({ kind: 'period' })}
            onEdit={(id) => open({ kind: 'period', id })}
          />
        )}
        {tab === 'analysis' && <Analysis catId={cat.id} />}
      </main>

      <nav class="tabs" aria-label="Screens">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            class="tabs__btn"
            aria-current={tab === t ? 'page' : undefined}
            onClick={() => setTab(t)}
          >
            <span aria-hidden="true">{strings.tabs[t].emoji}</span>
            <span>{strings.tabs[t].label}</span>
          </button>
        ))}
      </nav>

      {top && (
        <Sheet title={sheetTitle(top)} onClose={close}>
          {renderSheet(top)}
        </Sheet>
      )}
    </div>
  );
}

function Banner({
  children,
  onDismiss,
}: {
  children: preact.ComponentChildren;
  onDismiss: () => void;
}) {
  return (
    <div class="banner" role="status">
      <div class="banner__text">{children}</div>
      <button type="button" class="btn btn--ghost btn--small" onClick={onDismiss}>
        {strings.banners.dismiss}
      </button>
    </div>
  );
}
