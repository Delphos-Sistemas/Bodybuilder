"use client";

/**
 * Alertas sonoros gerados com Web Audio. O contexto só é criado após uma ação explícita
 * do usuário (botão "Ativar som"). Se o navegador bloquear o áudio, o treino continua normalmente.
 */
export type AlertKind = "inicio" | "fim-descanso" | "encerramento" | "teste";

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
  ]
};

const VIBRATION: Record<AlertKind, number[]> = {
  inicio: [120, 80, 120],
  "fim-descanso": [250, 120, 250],
  encerramento: [400, 150, 400],
  teste: [150]
};

export async function unlockAudio(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;
    ctx = ctx ?? new AC();
    if (ctx.state === "suspended") await ctx.resume();
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
