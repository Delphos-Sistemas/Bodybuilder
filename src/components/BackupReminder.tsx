"use client";

import { Download, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { downloadBackup, needsBackup, requestPersistentStorage } from "@/lib/backup";
import { useStore } from "@/lib/store";

/** Lembrete de backup na tela inicial e pedido de armazenamento persistente após o primeiro treino. */
export function BackupReminder() {
  const mode = useStore((s) => s.mode);
  const sessions = useStore((s) => s.usuario.sessions);
  const settings = useStore((s) => s.settings);
  const exportData = useStore((s) => s.exportData);
  const markBackupDone = useStore((s) => s.markBackupDone);
  const snoozeBackup = useStore((s) => s.snoozeBackup);
  const done = sessions.filter((s) => s.endedAt);

  useEffect(() => {
    if (done.length > 0) void requestPersistentStorage();
  }, [done.length]);

  if (mode !== "usuario") return null;
  const since = done.filter((s) => !settings.lastBackupAt || (s.endedAt ?? 0) > settings.lastBackupAt).length;
  if (
    !needsBackup({
      sessions: done.length,
      sessionsSinceBackup: since,
      lastBackupAt: settings.lastBackupAt,
      snoozeUntil: settings.backupSnoozeUntil,
      now: Date.now()
    })
  )
    return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-bronze/50 bg-bronze/10 px-4 py-3 text-sm"
      data-testid="lembrete-backup"
    >
      <ShieldCheck size={20} className="shrink-0 text-bronze-light" aria-hidden />
      <span className="min-w-0 flex-1">
        <strong>Guarde uma cópia dos seus treinos.</strong> Seus dados ficam só neste aparelho
        {settings.lastBackupAt ? ` e há ${since} ${since === 1 ? "treino novo" : "treinos novos"} desde o último backup.` : " e ainda não há backup."}
      </span>
      <span className="flex gap-2">
        <button type="button" className="btn-ghost min-h-10 px-3" onClick={() => snoozeBackup(7)}>
          Depois
        </button>
        <button
          type="button"
          className="btn-primary min-h-10 px-3"
          onClick={() => {
            downloadBackup(exportData());
            markBackupDone();
          }}
        >
          <Download size={16} aria-hidden /> Fazer backup
        </button>
      </span>
    </div>
  );
}
