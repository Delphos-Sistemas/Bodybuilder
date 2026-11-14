import { EXERCISE_MAP } from "@/data/exercises";
import { workingSets } from "./session";
import { startOfWeek } from "./time";
import type { Muscle, Session } from "./types";

/** Faixa de referência comum na literatura de hipertrofia (séries por músculo por semana). */
export const WEEKLY_SETS_RANGE = { min: 10, max: 20 } as const;

/**
 * Séries válidas por músculo na semana atual (segunda a domingo, igual à meta semanal).
 * Músculo principal conta 1 série; cada músculo secundário conta meia série.
 */
export function weeklySetsByMuscle(sessions: Session[], now: number): Partial<Record<Muscle, number>> {
  const start = startOfWeek(now);
  const out: Partial<Record<Muscle, number>> = {};
  for (const s of sessions) {
    if (!s.endedAt || s.startedAt < start) continue;
    for (const it of s.items) {
      const ex = EXERCISE_MAP[it.exerciseId];
      const n = workingSets(it.sets).length;
      if (!ex || !n) continue;
      out[ex.primary] = (out[ex.primary] ?? 0) + n;
      for (const m of ex.secondary) out[m] = (out[m] ?? 0) + n / 2;
    }
  }
  return out;
}

/** Último dia em que cada músculo foi treinado como principal (ms). */
export function lastTrainedByMuscle(sessions: Session[]): Partial<Record<Muscle, number>> {
  const out: Partial<Record<Muscle, number>> = {};
  for (const s of sessions) {
    if (!s.endedAt) continue;
    for (const it of s.items) {
      const ex = EXERCISE_MAP[it.exerciseId];
      if (!ex || !workingSets(it.sets).length) continue;
      if ((out[ex.primary] ?? 0) < s.startedAt) out[ex.primary] = s.startedAt;
    }
  }
  return out;
}
