import { useState } from 'preact/hooks';
import { strings } from '../strings';
import { store } from '../store';
import { DEFAULT_CAT_EMOJI, type CatEmoji } from '../types';
import { ImportBackup } from './Backup';
import { EmojiPicker } from './EmojiPicker';
import { Sheet } from './Sheet';

/** Shown when there is no cat yet. A person who lost the data can import a backup from here. */
export function Onboarding() {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [importing, setImporting] = useState(false);
  const [emoji, setEmoji] = useState<CatEmoji>(DEFAULT_CAT_EMOJI);
  const t = strings.onboarding;

  return (
    <main class="onboarding">
      <h1>
        <span aria-hidden="true">{emoji} </span>
        {t.title}
      </h1>
      <p>{t.intro}</p>
      <p>{t.privacy}</p>
      <form
        class="form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          if (name.trim() === '') {
            setInvalid(true);
            return;
          }
          setBusy(true);
          void store.addCat(name, emoji).finally(() => setBusy(false));
        }}
      >
        <fieldset class="group">
          <legend class="field__label">{t.emojiLabel}</legend>
          <EmojiPicker value={emoji} onChange={setEmoji} />
        </fieldset>
        <label class="field">
          <span class="field__label">{t.nameLabel}</span>
          <input
            class="input"
            type="text"
            maxLength={60}
            aria-invalid={invalid}
            value={name}
            onInput={(e) => {
              setName(e.currentTarget.value);
              setInvalid(false);
            }}
          />
          {invalid && (
            <span class="error" role="alert">
              {t.errName}
            </span>
          )}
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
