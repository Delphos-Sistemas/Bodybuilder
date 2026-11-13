"use client";

import clsx from "clsx";
import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { chooseVoice, portugueseVoices, speak, speechAvailable, unlockSpeech, voiceGender, type VoiceGender } from "@/lib/audio";
import { useStore } from "@/lib/store";
import { VOICE_STYLES, voiceLine, type VoiceStyle } from "@/lib/voiceLines";

/** Escolha do estilo das falas, gênero e voz do aparelho, com botão de teste. */
export function VoiceSettings() {
  const store = useStore();
  const { settings } = store;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // as vozes chegam de forma assíncrona em vários navegadores
  useEffect(() => {
    if (!speechAvailable()) return;
    const load = () => setVoices(portugueseVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  if (!speechAvailable()) return <p className="text-xs text-muted">Este navegador não tem voz falada. Os bipes e a vibração continuam funcionando.</p>;

  const style: VoiceStyle = settings.voiceStyle ?? "neutro";
  const gender = settings.voiceGender;
  const prefs = { gender, voiceName: settings.voiceName };
  const { voice, simulated } = chooseVoice(prefs);
  const ofGender = gender ? voices.filter((v) => voiceGender(v) === gender) : voices;

  const test = () => {
    unlockSpeech();
    speak(voiceLine(style, "iniciar", { exercicio: "Supino reto", serie: 1, total: 4 }), prefs);
  };

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
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Gênero da voz">
          {(
            [
              [undefined, "Padrão"],
              ["feminina", "Feminina"],
              ["masculina", "Masculina"]
            ] as [VoiceGender | undefined, string][]
          ).map(([g, text]) => (
            <button
              key={text}
              type="button"
              role="radio"
              aria-checked={gender === g}
              className={clsx("chip", gender === g && "chip-on")}
              onClick={() => store.updateSettings({ voiceGender: g, voiceName: undefined })}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
      {ofGender.length > 1 && (
        <div>
          <label htmlFor="voz-nome" className="label">
            Qual voz
          </label>
          <select id="voz-nome" className="input" value={voice?.name ?? ""} onChange={(e) => store.updateSettings({ voiceName: e.target.value || undefined })}>
            {ofGender.map((v) => (
              <option key={v.voiceURI} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>
      )}
      {simulated && (
        <p className="text-xs text-muted">
          Este aparelho não tem voz {gender} em português, então o app imita pelo tom da voz {voice?.name ?? "padrão"}. No iPhone dá para baixar mais vozes em
          Ajustes → Acessibilidade → Conteúdo Falado → Vozes → Português (Brasil).
        </p>
      )}
      {voices.length === 0 && <p className="text-xs text-muted">Nenhuma voz em português encontrada; o aparelho vai usar a voz padrão.</p>}
      <button type="button" className="btn-secondary min-h-11 w-full" onClick={test}>
        <Volume2 size={16} aria-hidden /> Testar voz
      </button>
    </div>
  );
}
