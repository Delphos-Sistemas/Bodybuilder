"use client";

import { CloudDownload, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProgressBar } from "@/components/ui";
import { downloadOffline, offlineFiles, offlineReady } from "@/lib/offline";
import { useData, useStore } from "@/lib/store";

/** Modo academia offline: baixa as falas e os GIFs dos seus treinos para usar sem internet. */
export function OfflinePanel() {
  const data = useData();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const files = useMemo(() => offlineFiles(settings, data.workouts), [settings, data.workouts]);
  const [status, setStatus] = useState<{ have: number; total: number } | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void offlineReady(files).then(setStatus);
  }, [files]);

  const run = async () => {
    setMsg("");
    const r = await downloadOffline(files, (done, total) => setProgress({ done, total }));
    setProgress(null);
    const st = await offlineReady(files);
    setStatus(st);
    if (r.failed) setMsg(`${r.failed} arquivos não baixaram (sem internet?). Tente de novo com Wi-Fi.`);
    else {
      updateSettings({ offlineAt: Date.now() });
      setMsg("Pronto: pode treinar sem internet.");
    }
  };

  const ready = status && status.total > 0 && status.have >= status.total;
  return (
    <div className="space-y-3" data-testid="modo-offline">
      <p className="text-sm text-sand">
        O app já abre sem internet depois de instalado na Tela de Início: treinos, timer, histórico e gráficos. Os seus dados ficam no aparelho e, com a
        sincronização ligada, sobem sozinhos quando a internet voltar.
      </p>
      <p className="text-sm text-muted">
        Para a academia sem sinal, baixe também as falas da voz escolhida e as animações dos exercícios das suas fichas (
        {files.voice.length + files.gifs.length} arquivos).
      </p>
      {status && status.total > 0 && (
        <div>
          <ProgressBar value={status.have / status.total} label="Arquivos guardados" />
          <p className="mt-1 text-xs text-muted">
            {status.have} de {status.total} guardados neste aparelho
            {settings.offlineAt ? ` · último download em ${new Date(settings.offlineAt).toLocaleDateString("pt-BR")}` : ""}
          </p>
        </div>
      )}
      {progress ? (
        <p role="status" className="text-sm text-bronze-light">
          Baixando {progress.done} de {progress.total}…
        </p>
      ) : (
        <button type="button" className={ready ? "btn-secondary" : "btn-primary"} onClick={() => void run()} disabled={!status?.total}>
          <CloudDownload size={18} aria-hidden /> {ready ? "Baixar de novo" : "Baixar para treinar sem internet"}
        </button>
      )}
      {msg && (
        <p role="status" className="text-sm text-ok">
          {msg}
        </p>
      )}
      <p className="flex items-start gap-1.5 text-xs text-muted">
        <WifiOff size={14} className="mt-0.5 shrink-0" aria-hidden /> Spotify e sincronização precisam de internet. Mudou a voz ou as fichas? Toque em baixar de
        novo.
      </p>
    </div>
  );
}

/** Aviso discreto quando o aparelho está sem internet. */
export function OfflineBadge() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const set = () => setOnline(navigator.onLine);
    set();
    window.addEventListener("online", set);
    window.addEventListener("offline", set);
    return () => {
      window.removeEventListener("online", set);
      window.removeEventListener("offline", set);
    };
  }, []);
  if (online) return null;
  return (
    <p role="status" className="flex items-center justify-center gap-1.5 bg-steel px-3 py-1.5 text-center text-xs text-sand" data-testid="sem-internet">
      <WifiOff size={14} aria-hidden /> Sem internet. O treino funciona normal e tudo fica salvo no aparelho.
    </p>
  );
}
