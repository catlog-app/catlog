// Export and backup actions. They build a file and hand it to the browser.

import { store } from './store';
import { backupFileName, createBackup } from './logic/backup';
import { buildSheets, slug, type ExportInput, type Table } from './logic/export';
import { deliverFile, type DeliverResult } from './platform';

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const stamp = () => new Date().toISOString().slice(0, 10);

export async function exportXlsx(input: ExportInput): Promise<DeliverResult> {
  // Loaded on demand, so the library is not part of the first download.
  const { default: writeExcelFile } = await import('write-excel-file/universal');
  const bold = (table: Table) =>
    table.map((row, i) =>
      i === 0
        ? row.map((value) => ({ value: String(value ?? ''), fontWeight: 'bold' as const }))
        : row,
    );
  const sheets = Object.entries(buildSheets(input)).map(([sheet, table]) => ({
    sheet,
    data: bold(table),
    stickyRowsCount: 1,
  }));
  const blob = await writeExcelFile(sheets).toBlob();
  const name = `catlog-${slug(input.cat.name)}-${stamp()}.xlsx`;
  return deliverFile(new File([blob], name, { type: XLSX_TYPE }), name);
}

/** Share the backup file (Chrome) or download it (Firefox). */
export async function backUpNow(): Promise<DeliverResult> {
  const backup = createBackup(store.get().snapshot);
  const name = backupFileName(backup.exportedAt);
  const file = new File([JSON.stringify(backup)], name, { type: 'application/json' });
  const result = await deliverFile(file, name);
  if (result !== 'cancelled') await store.markBackedUp(backup.exportedAt);
  return result;
}
