"use client";

import clsx from "clsx";
import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { lastClipError, portugueseVoices, speechAvailable, unlockAudio } from "@/lib/audio";
import { coachPrefs, coachSay, prepareCoach } from "@/lib/coachVoice";
import { useStore } from "@/lib/store";
import { VOICE_PACKS, VOICE_STYLES, type VoicePack, type VoiceStyle } from "@/lib/voiceLines";

/** Estilo das falas, voz (gravada ou do aparelho), mistura com a música e botão de teste. */
export function VoiceSettings() {
  const store = useStore();
  const { settings } = store;
  const { style, pack } = coachPrefs(settings);
  const [deviceVoices, setDeviceVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [status, setStatus] = useState("");

  // as vozes do aparelho chegam de forma assíncrona em vários navegadores
  useEffect(() => {
    if (pack !== "aparelho" || !speechAvailable()) return;
    const load = () => setDeviceVoices(portugueseVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [pack]);

  const test = async () => {
    const s = useStore.getState().settings;
    prepareCoach(s);
    await unlockAudio();
    prepareCoach(s);
    setStatus("Carregando…");
    const r = await coachSay({ ...s, voiceCues: true }, "iniciar");
    const p = coachPrefs(s).pack;
    setStatus(
      p === "aparelho"
        ? ""
        : r === "gravada"
          ? `Tocando a voz ${VOICE_PACKS[p]}.`
          : `A voz gravada não tocou neste aparelho (${lastClipError || "erro desconhecido"}). ${r === "aparelho" ? "Usando a voz do aparelho." : ""}`
    );
  };

  const packs = (Object.keys(VOICE_PACKS) as VoicePack[]).filter((p) => p !== "aparelho" || speechAvailable());

  return (
    <div className="space-y-3 rounded-xl border border-line p-3" data-testid="voz-config">
      <p className="font-semibold">Voz do treinador</p>
      <div>
        <p className="label">Estilo</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Estilo da voz">
          {(Object.keys(VOICE_STYLES) as VoiceStyle[]).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={style === k}
              className={clsx("chip", style === k && "chip-on")}
              onClick={() => store.updateSettings({ voiceStyle: k })}
            >
              {VOICE_STYLES[k]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="label">Voz</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Voz">
          {packs.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={pack === k}
              className={clsx("chip", pack === k && "chip-on")}
              onClick={() => store.updateSettings({ voicePack: k })}
            >
              {VOICE_PACKS[k]}
            </button>
          ))}
        </div>
      </div>
      {pack === "aparelho" && deviceVoices.length > 1 && (
        <div>
          <label htmlFor="voz-nome" className="label">
            Qual voz do aparelho
          </label>
          <select
            id="voz-nome"
            className="input"
            value={settings.voiceName ?? deviceVoices[0]?.name ?? ""}
            onChange={(e) => store.updateSettings({ voiceName: e.target.value || undefined })}
          >
            {deviceVoices.map((v) => (
              <option key={v.voiceURI} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>
      )}
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-5 w-5 accent-[#B07D45]"
          checked={Boolean(settings.duckMusic)}
          onChange={(e) => store.updateSettings({ duckMusic: e.target.checked })}
        />
        Abaixar a música (Spotify) enquanto a voz fala
      </label>
      <p className="text-xs text-muted">
        A música de outros apps continua tocando. No iPhone, marcar esta opção abaixa o Spotify durante cada fala; desmarcado, a voz toca por cima.
      </p>
      <button type="button" className="btn-secondary min-h-11 w-full" onClick={() => void test()}>
        <Volume2 size={16} aria-hidden /> Testar voz
      </button>
      {status && (
        <p className="text-xs text-muted" aria-live="polite" data-testid="voz-status">
          {status}
        </p>
      )}
    </div>
  );
}
