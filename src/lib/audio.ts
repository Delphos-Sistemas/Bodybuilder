"use client";

/**
 * Alertas sonoros gerados com Web Audio. O contexto só é criado após uma ação explícita
 * do usuário (botão "Ativar som"). Se o navegador bloquear o áudio, o treino continua normalmente.
 */
export type AlertKind = "inicio" | "fim-descanso" | "encerramento" | "teste" | "tique" | "fim-serie";

let ctx: AudioContext | null = null;

type Note = { f: number; t: number; d: number; type?: OscillatorType };

const PATTERNS: Record<AlertKind, Note[]> = {
  // três notas ascendentes
  inicio: [
    { f: 523, t: 0, d: 0.14 },
    { f: 659, t: 0.16, d: 0.14 },
    { f: 784, t: 0.32, d: 0.28 }
  ],
  // dois bipes agudos e curtos
  "fim-descanso": [
    { f: 988, t: 0, d: 0.12, type: "square" },
    { f: 988, t: 0.2, d: 0.12, type: "square" },
    { f: 1319, t: 0.4, d: 0.22, type: "square" }
  ],
  // três notas descendentes e longas
  encerramento: [
    { f: 784, t: 0, d: 0.22 },
    { f: 659, t: 0.24, d: 0.22 },
    { f: 523, t: 0.48, d: 0.5 }
  ],
  teste: [
    { f: 660, t: 0, d: 0.12 },
    { f: 880, t: 0.15, d: 0.18 }
  ],
  // bipe curto da contagem regressiva (3, 2, 1)
  tique: [{ f: 880, t: 0, d: 0.09 }],
  // fim da execução: nota longa e grave
  "fim-serie": [
    { f: 1047, t: 0, d: 0.16, type: "triangle" },
    { f: 784, t: 0.18, d: 0.16, type: "triangle" },
    { f: 523, t: 0.36, d: 0.4, type: "triangle" }
  ]
};

const VIBRATION: Record<AlertKind, number[]> = {
  inicio: [120, 80, 120],
  "fim-descanso": [250, 120, 250],
  encerramento: [400, 150, 400],
  teste: [150],
  tique: [60],
  "fim-serie": [500, 150, 200]
};

export async function unlockAudio(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;
    // não pausar o Spotify/música de outros apps no iPhone
    setMixMode(duckOthers);
    ctx = ctx ?? new AC();
    // alguns navegadores (WebKit sem saída de áudio) nunca resolvem o resume(): não travar a tela
    if (ctx.state === "suspended") await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 1500))]);
    return ctx.state === "running";
  } catch {
    return false;
  }
}

export function audioState(): "indisponivel" | "bloqueado" | "ativo" {
  if (!ctx) return "indisponivel";
  return ctx.state === "running" ? "ativo" : "bloqueado";
}

export function playAlert(kind: AlertKind, opts: { sound: boolean; vibrate: boolean; volume: number }): boolean {
  let played = false;
  if (opts.vibrate && typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(VIBRATION[kind]);
    } catch {
      /* vibração indisponível */
    }
  }
  if (!opts.sound || !ctx) return false;
  try {
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime + 0.02;
    for (const n of PATTERNS[kind]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type ?? "sine";
      osc.frequency.value = n.f;
      const peak = Math.max(0.0001, Math.min(1, opts.volume) * 0.35);
      gain.gain.setValueAtTime(0.0001, t0 + n.t);
      gain.gain.exponentialRampToValueAtTime(peak, t0 + n.t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.t + n.d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + n.t);
      osc.stop(t0 + n.t + n.d + 0.05);
    }
    played = true;
  } catch {
    played = false;
  }
  return played;
}

/**
 * Mistura com a música de outros apps (Spotify) em vez de pausá-la.
 * Safari 16.4+: "ambient" toca junto; "transient" abaixa a música enquanto fala. Outros navegadores ignoram.
 */
let duckOthers = false;

export function setMixMode(duck: boolean): void {
  duckOthers = duck;
  const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { audioSession?: { type: string } }) : undefined;
  try {
    if (nav?.audioSession) nav.audioSession.type = duck ? "transient" : "ambient";
  } catch {
    /* sem Audio Session API */
  }
}

/** Falas gravadas (MP3 curtos), tocadas pelo mesmo AudioContext dos bipes. */
const clips = new Map<string, Promise<AudioBuffer | null>>();

function loadClip(url: string): Promise<AudioBuffer | null> {
  const c = ctx;
  if (!c) return Promise.resolve(null);
  let p = clips.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      // forma com callbacks: Safari antigo não devolve Promise
      .then((buf) => new Promise<AudioBuffer>((res, rej) => void c.decodeAudioData(buf, res, rej)))
      .catch(() => {
        clips.delete(url);
        return null;
      });
    clips.set(url, p);
  }
  return p;
}

export function preloadClips(urls: string[]): void {
  for (const u of urls) void loadClip(u);
}

let currentClip: AudioBufferSourceNode | null = null;

/** Toca uma fala gravada. Devolve false se não deu (sem áudio liberado ou arquivo indisponível). */
export async function playClip(url: string, volume = 1): Promise<boolean> {
  const buf = await loadClip(url);
  if (!buf || !ctx) return false;
  try {
    if (ctx.state === "suspended") void ctx.resume();
    currentClip?.stop();
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = Math.max(0, Math.min(1.5, volume * 1.3));
    src.buffer = buf;
    src.connect(gain).connect(ctx.destination);
    src.start(ctx.currentTime + 0.05);
    currentClip = src;
    return true;
  } catch {
    return false;
  }
}

/** Voz do aparelho (Web Speech API): reserva para quando a fala gravada não estiver disponível. */
export function speechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

/** Vozes em português do aparelho, pt-BR primeiro. */
export function portugueseVoices(): SpeechSynthesisVoice[] {
  if (!speechAvailable()) return [];
  const all = window.speechSynthesis.getVoices().filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith("pt"));
  const br = (v: SpeechSynthesisVoice) => (v.lang.replace("_", "-").toLowerCase() === "pt-br" ? 0 : 1);
  return all.sort((a, b) => br(a) - br(b));
}

/** Chamar dentro de um toque do usuário: o iPhone só libera a fala depois de uma fala iniciada por toque. */
export function unlockSpeech(): void {
  if (!speechAvailable()) return;
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    u.lang = "pt-BR";
    window.speechSynthesis.speak(u);
  } catch {
    /* sem fala */
  }
}

export function speak(text: string, voiceName?: string): boolean {
  if (!speechAvailable()) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    const list = portugueseVoices();
    const v = list.find((x) => x.name === voiceName) ?? list[0];
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    }
    u.rate = 1.05;
    synth.speak(u);
    return true;
  } catch {
    return false;
  }
}
