// Browser features that differ between Chrome and Firefox. Each one is checked before use,
// so the app does not crash when a feature is missing.

export type DeliverResult = 'shared' | 'downloaded' | 'cancelled';

/** Save a file with the normal browser download. */
function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  // Give the browser time to start the download before the URL is freed.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Chrome on Android can share a file (for example to Telegram or Drive).
 * Firefox on Android cannot, so we download the file instead.
 */
export async function deliverFile(file: File, title: string): Promise<DeliverResult> {
  const data: ShareData = { files: [file], title };
  if (typeof navigator.canShare === 'function' && navigator.canShare(data)) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // Other errors (for example a lost tap permission): fall back to download.
    }
  }
  downloadFile(file);
  return 'downloaded';
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
