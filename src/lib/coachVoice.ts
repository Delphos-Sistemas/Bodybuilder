"use client";

import { playClip, preloadClips, setMixMode, speak, unlockClipElement, unlockSpeech } from "./audio";
import type { Exercise, Settings } from "./types";
import { exerciseAnnouncement, exerciseClipUrl, voiceLine, voiceUrls, type VoiceEvent, type VoicePack, type VoiceStyle } from "./voiceLines";

export function coachPrefs(s: Settings): { style: VoiceStyle; pack: VoicePack } {
  return { style: s.voiceStyle ?? "neutro", pack: s.voicePack ?? "dora" };
}

/** Prepara a voz dentro de um toque do usuário: modo de mistura, fala do aparelho e download das falas. */
export function prepareCoach(s: Settings, exercises: Exercise[] = []): void {
  const { style, pack } = coachPrefs(s);
  setMixMode(s.soundMode ?? "misturar");
  unlockSpeech();
  if (pack !== "aparelho") {
    const urls = voiceUrls(style, pack);
    unlockClipElement(urls[0]);
    preloadClips([...urls, ...exercises.flatMap((e) => (e.custom ? [] : [exerciseClipUrl(pack, e.id)]))]);
  }
}

type Part = { text: string; url?: string };
type Result = "gravada" | "aparelho" | "nenhuma";

// cada fala nova interrompe a sequência anterior
let seq = 0;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sayParts(s: Settings, parts: Part[]): Promise<Result> {
  const my = ++seq;
  let result: Result = "nenhuma";
  for (const part of parts) {
    if (my !== seq) break;
    const d = part.url ? await playClip(part.url, s.alertVolume) : false;
    if (d !== false) {
      if (result === "nenhuma") result = "gravada";
      await wait(d * 1000 + 150);
    } else if (speak(part.text, s.voiceName)) {
      if (result === "nenhuma") result = "aparelho";
      // a voz do aparelho não avisa a duração com confiança: estimativa pelo tamanho do texto
      await wait(600 + part.text.length * 65);
    }
  }
  return result;
}

/**
 * Fala um evento: voz gravada; se não der, a voz do aparelho.
 * Com `next`, anuncia também o exercício e o aparelho (antes da fala do evento em "preparar", depois nos demais).
 */
export function coachSay(s: Settings, event: VoiceEvent, next?: Exercise): Promise<Result> {
  if (s.voiceCues === false) return Promise.resolve("nenhuma");
  const { style, pack } = coachPrefs(s);
  const line = voiceLine(style, event, pack);
  const main: Part = pack === "aparelho" ? { text: line.text } : line;
  if (!next) return sayParts(s, [main]);
  const ann: Part = { text: exerciseAnnouncement(next), url: pack === "aparelho" || next.custom ? undefined : exerciseClipUrl(pack, next.id) };
  return sayParts(s, event === "preparar" ? [ann, main] : [main, ann]);
}
