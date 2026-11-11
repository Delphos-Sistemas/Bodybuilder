"use client";

import { useEffect, useState } from "react";

/**
 * Registra o service worker e avisa quando há uma nova versão em espera.
 * A atualização só é aplicada quando o usuário toca em "Atualizar" (nunca no meio do treino sem aviso).
 */
// só recarrega quando o próprio usuário pediu a atualização (na primeira instalação não recarrega)
let updateRequested = false;

export function UpdateBanner() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    let reloading = false;
    const onController = () => {
      if (reloading || !updateRequested) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onController);
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          sw?.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) setWaiting(sw);
          });
        });
        const check = () => document.visibilityState === "visible" && reg.update().catch(() => undefined);
        document.addEventListener("visibilitychange", check);
      })
      .catch(() => undefined);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onController);
  }, []);

  if (!waiting) return null;
  return (
    <div role="status" className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-xl border border-bronze/60 bg-steel px-4 py-3 text-sm">
      <span>Nova versão do app disponível.</span>
      <button
        type="button"
        className="btn-primary min-h-10 px-3"
        onClick={() => {
          updateRequested = true;
          waiting.postMessage({ type: "SKIP_WAITING" });
        }}
      >
        Atualizar
      </button>
    </div>
  );
}
