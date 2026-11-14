import type { ExportFile } from "./schemas";

/** Baixa o arquivo de backup no aparelho. */
export function downloadBackup(file: ExportFile): void {
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bodybuilder-dados-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const BACKUP_EVERY_DAYS = 14;

/** Mostra o lembrete quando há treinos novos e o último backup é antigo (ou nunca foi feito). */
export function needsBackup(opts: { sessions: number; sessionsSinceBackup: number; lastBackupAt?: number; snoozeUntil?: number; now: number }): boolean {
  if (opts.snoozeUntil && opts.now < opts.snoozeUntil) return false;
  if (opts.sessions < 3 || opts.sessionsSinceBackup === 0) return false;
  if (!opts.lastBackupAt) return true;
  return opts.now - opts.lastBackupAt > BACKUP_EVERY_DAYS * 86_400_000;
}

/** Pede ao navegador para não apagar os dados do app automaticamente. */
export async function requestPersistentStorage(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export async function isStoragePersisted(): Promise<boolean | null> {
  try {
    return navigator.storage?.persisted ? await navigator.storage.persisted() : null;
  } catch {
    return null;
  }
}
