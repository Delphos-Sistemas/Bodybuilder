import { estimate1RM } from "./records";
import { workingSets } from "./session";
import type { BodyWeight, Session } from "./types";
import { startOfWeek } from "./time";

export function sessionsThisWeek(sessions: Session[], now: number): number {
  const start = startOfWeek(now);
  return sessions.filter((s) => s.endedAt && s.endedAt >= start).length;
}

export type LoadPoint = {
  date: number;
  maxLoad: number;
  bestSet: string;
  volume: number;
  e1rm: number | null;
};

/** Evolução de carga por exercício: maior carga registrada em cada sessão. */
export function loadHistory(sessions: Session[], exerciseId: string): LoadPoint[] {
  return sessions
    .filter((s) => s.endedAt)
    .map((s) => {
      const all = s.items.filter((i) => i.exerciseId === exerciseId).flatMap((i) => i.sets);
      const sets = workingSets(all);
      if (!sets.length) return null;
      const e1rms = sets.map((x) => estimate1RM(x.loadKg, x.reps)).filter((x): x is number => x !== null);
      const best = sets.reduce((a, b) => (b.loadKg > a.loadKg || (b.loadKg === a.loadKg && b.reps > a.reps) ? b : a));
      return {
        date: s.startedAt,
        maxLoad: best.loadKg,
        bestSet: `${best.loadKg} kg × ${best.reps}`,
        volume: all.reduce((acc, x) => (x.kind === "aquecimento" ? acc : acc + x.loadKg * x.reps), 0),
        e1rm: e1rms.length ? Math.max(...e1rms) : null
      };
    })
    .filter((p): p is LoadPoint => p !== null)
    .sort((a, b) => a.date - b.date);
}

export function exercisesWithHistory(sessions: Session[]): string[] {
  const ids = new Set<string>();
  sessions.forEach((s) => s.items.forEach((i) => i.sets.length && ids.add(i.exerciseId)));
  return [...ids];
}

export function sortedWeights(weights: BodyWeight[]): BodyWeight[] {
  return weights.slice().sort((a, b) => a.date.localeCompare(b.date));
}
