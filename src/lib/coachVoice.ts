"use client";

import { playClip, preloadClips, setMixMode, speak, unlockSpeech } from "./audio";
import type { Settings } from "./types";
import { voiceLine, voiceUrls, type VoiceEvent, type VoicePack, type VoiceStyle } from "./voiceLines";

export function coachPrefs(s: Settings): { style: VoiceStyle; pack: VoicePack } {
  return { style: s.voiceStyle ?? "neutro", pack: s.voicePack ?? "dora" };
}

/** Prepara a voz dentro de um toque do usuário: modo de mistura, fala do aparelho e download das falas. */
export function prepareCoach(s: Settings): void {
  const { style, pack } = coachPrefs(s);
  setMixMode(Boolean(s.duckMusic));
  if (pack === "aparelho") unlockSpeech();
  else preloadClips(voiceUrls(style, pack));
}

/** Fala um evento: voz gravada; se não der, a voz do aparelho. */
export function coachSay(s: Settings, event: VoiceEvent): void {
  if (s.voiceCues === false) return;
  const { style, pack } = coachPrefs(s);
  const line = voiceLine(style, event, pack);
  if (pack === "aparelho") {
    speak(line.text, s.voiceName);
    return;
  }
  void playClip(line.url, s.alertVolume).then((ok) => {
    if (!ok) speak(line.text, s.voiceName);
  });
}
