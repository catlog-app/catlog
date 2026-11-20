import { useState } from 'preact/hooks';
import { strings } from '../strings';
import { store } from '../store';
import { ImportBackup } from './Backup';
import { Sheet } from './Sheet';

/** Shown when there is no cat yet. A person who lost the data can import a backup from here. */
export function Onboarding() {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const t = strings.onboarding;

  return (
    <main class="onboarding">
      <h1>
        <span aria-hidden="true">🐈 </span>
        {t.title}
      </h1>
      <p>{t.intro}</p>
      <p>{t.privacy}</p>
      <form
        class="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() === '' || busy) return;
          setBusy(true);
          void store.addCat(name).finally(() => setBusy(false));
        }}
      >
        <label class="field">
          <span class="field__label">{t.nameLabel}</span>
          <input
            class="input"
            type="text"
            maxLength={60}
            required
            value={name}
            onInput={(e) => setName(e.currentTarget.value)}
          />
        </label>
        <button type="submit" class="btn btn--primary" disabled={busy}>
          {t.start}
        </button>
      </form>
      <button type="button" class="btn" onClick={() => setImporting(true)}>
        {t.haveBackup}
      </button>
      <p class="muted">{strings.app.notMedical}</p>
      {importing && (
        <Sheet title={strings.backup.importTitle} onClose={() => setImporting(false)}>
          <ImportBackup onDone={() => setImporting(false)} />
        </Sheet>
      )}
    </main>
  );
}
