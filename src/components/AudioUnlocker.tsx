"use client";

import { useEffect } from "react";
import { unlockAudio } from "@/lib/audio";
import { useStore } from "@/lib/store";

/** Se o usuário já ativou o som, reativa o áudio no primeiro toque após recarregar a página. */
export function AudioUnlocker() {
  const enabled = useStore((s) => s.settings.audioEnabled);
  useEffect(() => {
    if (!enabled) return;
    const once = () => void unlockAudio();
    window.addEventListener("pointerdown", once, { once: true });
    window.addEventListener("keydown", once, { once: true });
    return () => {
      window.removeEventListener("pointerdown", once);
      window.removeEventListener("keydown", once);
    };
  }, [enabled]);
  return null;
}
