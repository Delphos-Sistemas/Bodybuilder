"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { fingerprint, syncNow } from "@/lib/sync";

/** Sincroniza em segundo plano: ao abrir o app, ao voltar para ele e alguns segundos depois de cada alteração. */
export function SyncAgent() {
  const code = useStore((s) => s.settings.syncCode);
  const usuario = useStore((s) => s.usuario);
  const running = useRef(false);
  const lastSent = useRef("");

  useEffect(() => {
    if (!code) return;
    const run = async () => {
      if (running.current || !navigator.onLine) return;
      const st = useStore.getState();
      if (!st.settings.syncCode) return;
      running.current = true;
      try {
        const res = await syncNow(st.settings.syncCode, st.usuario);
        if (res.changedLocal) useStore.getState().applySynced(res.merged);
        lastSent.current = fingerprint(res.merged);
        useStore.getState().updateSettings({ syncVersion: res.version, lastSyncAt: Date.now() });
      } catch {
        /* sem rede ou servidor: tenta de novo na próxima alteração */
      } finally {
        running.current = false;
      }
    };
    const t = fingerprint(usuario) === lastSent.current ? null : setTimeout(run, 4000);
    const onVis = () => document.visibilityState === "visible" && void run();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", run);
    return () => {
      if (t) clearTimeout(t);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", run);
    };
  }, [code, usuario]);

  return null;
}
