"use client";

import { Cloud, Copy, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { isValidCode, newSyncCode, normalizeCode, syncNow, syncStatus, type SyncStatus } from "@/lib/sync";

/** Sincronização entre aparelhos por código secreto, sem cadastro de e-mail ou senha. */
export function SyncPanel() {
  const code = useStore((s) => s.settings.syncCode);
  const lastSyncAt = useStore((s) => s.settings.lastSyncAt);
  const updateSettings = useStore((s) => s.updateSettings);
  const applySynced = useStore((s) => s.applySynced);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [joining, setJoining] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    void syncStatus().then(setStatus);
  }, []);

  const run = async (c: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await syncNow(c, useStore.getState().usuario);
      if (res.changedLocal) applySynced(res.merged);
      updateSettings({ syncCode: c, syncVersion: res.version, lastSyncAt: Date.now() });
      setMsg({ ok: true, text: "Sincronizado." });
      return true;
    } catch (e) {
      setMsg({
        ok: false,
        text: e instanceof Error && !e.message.startsWith("HTTP") ? e.message : "Não foi possível sincronizar agora. Verifique a internet e tente de novo."
      });
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!status) return <p className="text-sm text-muted">Verificando a sincronização…</p>;
  if (!status.available || !status.configured) {
    return (
      <p className="rounded-xl border border-line bg-iron p-3 text-sm text-sand" data-testid="sync-indisponivel">
        A sincronização entre aparelhos ainda não está ligada neste endereço. Ela funciona quando o app é publicado na Cloudflare com o banco de sincronização
        (veja o README). Enquanto isso, use o backup em arquivo.
      </p>
    );
  }

  if (code) {
    return (
      <div className="space-y-3" data-testid="sync-ativo">
        <p className="flex items-center gap-2 text-sm text-ok">
          <Cloud size={18} aria-hidden /> Sincronização ligada.{" "}
          {lastSyncAt ? `Última vez: ${new Date(lastSyncAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}.` : ""}
        </p>
        <div className="rounded-xl border border-line bg-iron p-3">
          <p className="text-xs text-muted">Seu código (use no outro aparelho). Guarde em segredo: quem tiver o código vê seus treinos.</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <code className="font-mono text-base tracking-wider text-bronze-light" data-testid="codigo-sync">
              {showCode ? code : code.replace(/[A-Z0-9]/g, "•")}
            </code>
            <button type="button" className="btn-ghost min-h-10 px-2 text-sm" onClick={() => setShowCode((v) => !v)}>
              {showCode ? "Ocultar" : "Mostrar"}
            </button>
            <button
              type="button"
              className="btn-ghost min-h-10 px-2 text-sm"
              onClick={() => void navigator.clipboard?.writeText(code).then(() => setMsg({ ok: true, text: "Código copiado." }))}
            >
              <Copy size={16} aria-hidden /> Copiar
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => void run(code)}>
            <RefreshCw size={18} aria-hidden className={busy ? "animate-spin" : undefined} /> Sincronizar agora
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              updateSettings({ syncCode: undefined, syncVersion: undefined, lastSyncAt: undefined });
              setMsg({ ok: true, text: "Sincronização desligada neste aparelho. Os dados continuam aqui e na nuvem." });
            }}
          >
            Desligar neste aparelho
          </button>
        </div>
        {msg && (
          <p role="status" className={msg.ok ? "text-sm text-ok" : "text-sm text-danger"}>
            {msg.text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="sync-desligado">
      <p className="text-sm text-muted">
        Use os mesmos treinos no celular e no computador. Não precisa de e-mail nem senha: o app gera um código secreto, e você digita esse código no outro
        aparelho.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={busy} onClick={() => void run(newSyncCode())}>
          <Cloud size={18} aria-hidden /> Ativar sincronização
        </button>
        <button type="button" className="btn-secondary" onClick={() => setJoining((v) => !v)} aria-expanded={joining}>
          Já tenho um código
        </button>
      </div>
      {joining && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isValidCode(input)) {
              setMsg({ ok: false, text: "Código inválido. Ele tem 6 grupos de 4 letras ou números." });
              return;
            }
            void run(normalizeCode(input)).then((ok) => ok && setJoining(false));
          }}
        >
          <label htmlFor="codigo-entrada" className="label">
            Código de sincronização
          </label>
          <input
            id="codigo-entrada"
            className="input font-mono uppercase tracking-wider"
            autoComplete="off"
            placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <p className="text-xs text-muted">Os treinos deste aparelho e os da nuvem são juntados; nada é apagado.</p>
          <button type="submit" className="btn-primary" disabled={busy}>
            Conectar
          </button>
        </form>
      )}
      {msg && (
        <p role="status" className={msg.ok ? "text-sm text-ok" : "text-sm text-danger"}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
