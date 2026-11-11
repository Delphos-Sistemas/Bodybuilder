"use client";

import { Bell, BellOff } from "lucide-react";
import { useState } from "react";
import { playAlert, unlockAudio, type AlertKind } from "@/lib/audio";
import { useStore } from "@/lib/store";
import { Toggle } from "./ui";

/** Ativação explícita dos alertas sonoros, teste de som e vibração. */
export function AudioControls() {
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const [status, setStatus] = useState("");

  const enable = async () => {
    const ok = await unlockAudio();
    update({ audioEnabled: ok });
    setStatus(ok ? "Som ativado." : "O navegador bloqueou o áudio. O treino funciona normalmente sem som.");
    if (ok) playAlert("teste", { sound: true, vibrate: false, volume: settings.alertVolume });
  };

  const test = async (kind: AlertKind) => {
    const ok = await unlockAudio();
    const played = playAlert(kind, { sound: ok && settings.audioEnabled, vibrate: settings.vibration, volume: settings.alertVolume });
    if (!settings.audioEnabled) setStatus("O som está desligado. Ative para ouvir os alertas.");
    else if (!played) setStatus("Não foi possível tocar o som neste navegador.");
    else setStatus("");
  };

  const vibrationSupported = typeof navigator !== "undefined" && "vibrate" in navigator;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {settings.audioEnabled ? (
          <button type="button" className="btn-secondary min-h-11" onClick={() => update({ audioEnabled: false })}>
            <BellOff size={18} aria-hidden /> Desligar som dos alertas
          </button>
        ) : (
          <button type="button" className="btn-primary min-h-11" onClick={() => void enable()}>
            <Bell size={18} aria-hidden /> Ativar som dos alertas
          </button>
        )}
        <button type="button" className="btn-secondary min-h-11" onClick={() => void test("teste")}>
          Testar som
        </button>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="self-center text-muted">Ouvir alertas:</span>
        <button type="button" className="chip" onClick={() => void test("inicio")}>
          Início
        </button>
        <button type="button" className="chip" onClick={() => void test("fim-descanso")}>
          Fim do descanso
        </button>
        <button type="button" className="chip" onClick={() => void test("encerramento")}>
          Encerramento
        </button>
      </div>
      <div>
        <label htmlFor="volume-alertas" className="label">
          Volume dos alertas
        </label>
        <input id="volume-alertas" type="range" min={0.1} max={1} step={0.05} value={settings.alertVolume} onChange={(e) => update({ alertVolume: parseFloat(e.target.value) })} className="w-full accent-[#B07D45]" />
      </div>
      <Toggle
        id="vibracao"
        label="Vibração"
        description={vibrationSupported ? "Vibra junto com os alertas (em aparelhos compatíveis)." : "Este navegador não oferece vibração."}
        checked={settings.vibration}
        onChange={(v) => update({ vibration: v })}
      />
      <p className="text-sm text-muted" role="status">
        {status || (settings.audioEnabled ? "Som dos alertas: ligado." : "Som dos alertas: desligado.")}
      </p>
    </div>
  );
}
