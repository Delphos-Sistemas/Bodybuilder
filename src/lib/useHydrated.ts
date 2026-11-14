"use client";

import { useEffect, useState } from "react";
import { useStore } from "./store";

/** true depois que os dados locais foram carregados do armazenamento do navegador. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const done = () => setHydrated(true);
    const unsub = useStore.persist.onFinishHydration(done);
    if (useStore.persist.hasHydrated()) done();
    return unsub;
  }, []);
  return hydrated;
}

/** Relógio que atualiza a cada intervalo e também ao voltar para a aba. */
export function useNow(intervalMs = 500): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [intervalMs]);
  return now;
}
