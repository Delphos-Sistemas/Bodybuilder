import { loadIncrement } from "./progression";
import { startOfWeek } from "./time";
import { EXERCISE_MAP } from "@/data/exercises";
import type { Phase, Settings, Workout } from "./types";

export const CYCLE: { phase: Phase; text: string }[] = [
  { phase: "base", text: "Treino normal da ficha." },
  { phase: "volume", text: "Uma série a mais em cada exercício." },
  { phase: "pesada", text: "Carga 5% maior, 2 repetições a menos e mais perto da falha." },
  { phase: "alivio", text: "Metade das séries e 10% menos carga para o corpo recuperar." }
];

const WEEK = 7 * 86_400_000;

/** Semana atual do ciclo de 4 semanas (0 a 3), contando da semana de início. */
export function cycleWeek(start: string, now: number): number {
  const s = startOfWeek(new Date(`${start}T12:00:00`).getTime());
  const n = Math.floor((startOfWeek(now) - s + 3_600_000 * 12) / WEEK);
  return ((n % 4) + 4) % 4;
}

export function currentPhase(settings: Pick<Settings, "periodization">, now: number): Phase | null {
  const p = settings.periodization;
  if (!p?.on) return null;
  return CYCLE[cycleWeek(p.start, now)].phase;
}

function roundLoad(kg: number, step: number) {
  return step ? Math.round(kg / step) * step : kg;
}

/** Ficha ajustada para a semana do ciclo. A ficha salva não muda. */
export function applyPhase(w: Workout, phase: Phase | null): Workout {
  if (!phase || phase === "base") return w;
  return {
    ...w,
    exercises: w.exercises.map((e) => {
      const step = loadIncrement(EXERCISE_MAP[e.exerciseId]?.equipment ?? "maquina");
      if (phase === "volume") return { ...e, sets: Math.min(20, e.sets + 1) };
      if (phase === "pesada")
        return {
          ...e,
          loadKg: e.loadKg ? roundLoad(e.loadKg * 1.05, step) || e.loadKg : 0,
          repsMin: Math.max(1, e.repsMin - 2),
          repsMax: Math.max(1, e.repsMax - 2),
          rir: Math.max(0, e.rir - 1)
        };
      return { ...e, sets: Math.max(1, Math.round(e.sets / 2)), loadKg: e.loadKg ? roundLoad(e.loadKg * 0.9, step) : 0, rir: Math.min(10, e.rir + 2) };
    })
  };
}
