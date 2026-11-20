import { useState } from 'preact/hooks';
import { strings } from '../strings';
import { store } from '../store';
import { MAX_BACKUP_BYTES, parseBackup, planImport, type BackupFile } from '../logic/backup';
import { backUpNow } from '../exporter';

/** "Back up now" with a clear message for every result. */
export function BackupButton({ primary = false }: { primary?: boolean }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setMessage('');
    try {
      const result = await backUpNow();
      setMessage(
        result === 'shared'
          ? strings.backup.shared
          : result === 'downloaded'
            ? strings.backup.savedToDownloads
            : strings.backup.cancelled,
      );
    } catch {
      setMessage(strings.backup.failed);
    }
    setBusy(false);
  }

  return (
    <div class="stack">
      <button
        type="button"
        class={primary ? 'btn btn--primary' : 'btn'}
        disabled={busy}
        onClick={() => void run()}
      >
        {strings.settings.backupNow}
      </button>
      {message !== '' && (
        <p class="ok" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

/** Choose a file, show what will change, then import. */
export function ImportBackup({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState('');
  const [backup, setBackup] = useState<BackupFile | null>(null);
  const [done, setDone] = useState(false);

  async function choose(file: File | undefined) {
    setError('');
    setBackup(null);
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      setError(strings.backup.errTooBig);
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setError(strings.backup.errRead);
      return;
    }
    const result = parseBackup(text);
    if (!result.ok) {
      setError(
        result.error === 'newer'
          ? strings.backup.errNewer
          : result.error === 'too-big'
            ? strings.backup.errTooBig
            : strings.backup.errFile,
      );
      return;
    }
    setBackup(result.backup);
  }

  async function confirm() {
    if (!backup) return;
    try {
      await store.applyImport(backup);
      setDone(true);
    } catch {
      setError(strings.backup.errRead);
    }
  }

  const plan = backup ? planImport(store.get().snapshot, backup) : null;

  return (
    <div class="stack">
      <p>{strings.backup.importChoose}</p>
      <input
        class="input"
        type="file"
        accept="application/json,.json"
        aria-label={strings.backup.importChoose}
        onChange={(e) => void choose(e.currentTarget.files?.[0])}
      />
      {error !== '' && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      {backup && plan && !done && (
        <>
          <p>
            {strings.backup.counts(backup.cats.length, backup.events.length, backup.periods.length)}
          </p>
          <p>{strings.backup.importPreview(plan.added, plan.updated, plan.same)}</p>
          <button type="button" class="btn btn--primary" onClick={() => void confirm()}>
            {strings.backup.importConfirm}
          </button>
        </>
      )}
      {done && (
        <>
          <p class="ok" role="status">
            {strings.backup.importDone}
          </p>
          <button type="button" class="btn" onClick={onDone}>
            {strings.common.close}
          </button>
        </>
      )}
    </div>
  );
}
