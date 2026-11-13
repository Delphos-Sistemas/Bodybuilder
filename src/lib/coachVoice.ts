"use client";

import { playClip, preloadClips, setMixMode, speak, unlockClipElement, unlockSpeech } from "./audio";
import type { Settings } from "./types";
import { voiceLine, voiceUrls, type VoiceEvent, type VoicePack, type VoiceStyle } from "./voiceLines";

export function coachPrefs(s: Settings): { style: VoiceStyle; pack: VoicePack } {
  return { style: s.voiceStyle ?? "neutro", pack: s.voicePack ?? "dora" };
}

/** Prepara a voz dentro de um toque do usuário: modo de mistura, fala do aparelho e download das falas. */
export function prepareCoach(s: Settings): void {
  const { style, pack } = coachPrefs(s);
  setMixMode(s.soundMode ?? "misturar");
  unlockSpeech();
  if (pack !== "aparelho") {
    const urls = voiceUrls(style, pack);
    unlockClipElement(urls[0]);
    preloadClips(urls);
  }
}

/** Fala um evento: voz gravada; se não der, a voz do aparelho. */
export async function coachSay(s: Settings, event: VoiceEvent): Promise<"gravada" | "aparelho" | "nenhuma"> {
  if (s.voiceCues === false) return "nenhuma";
  const { style, pack } = coachPrefs(s);
  const line = voiceLine(style, event, pack);
  if (pack === "aparelho") {
    return speak(line.text, s.voiceName) ? "aparelho" : "nenhuma";
  }
  if (await playClip(line.url, s.alertVolume)) return "gravada";
  return speak(line.text, s.voiceName) ? "aparelho" : "nenhuma";
}
