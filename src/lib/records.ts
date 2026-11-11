import { workingSets } from "./session";
import type { Session, SetLog } from "./types";

/** 1RM estimado pela fórmula de Epley. Só faz sentido até ~12 repetições e com carga. */
export function estimate1RM(loadKg: number, reps: number): number | null {
  if (loadKg <= 0 || reps <= 0 || reps > 12) return null;
  if (reps === 1) return loadKg;
  return Math.round(loadKg * (1 + reps / 30) * 10) / 10;
}

export type Records = {
  exerciseId: string;
  maxLoad: { value: number; reps: number; date: number } | null;
  best1RM: { value: number; set: string; date: number } | null;
  bestSetVolume: { value: number; set: string; date: number } | null;
};

export type RecordHit = {
  exerciseId: string;
  type: "carga" | "1rm" | "volume";
  value: number;
  previous: number | null;
};

function setsOf(session: Session, exerciseId: string): SetLog[] {
  return workingSets(session.items.filter((i) => i.exerciseId === exerciseId).flatMap((i) => i.sets));
}

/** Recordes de um exercício considerando as sessões concluídas (exceto a indicada). */
export function exerciseRecords(sessions: Session[], exerciseId: string, excludeSessionId?: string): Records {
  const r: Records = {
    exerciseId,
    maxLoad: null,
    best1RM: null,
    bestSetVolume: null
  };
  for (const s of sessions) {
    if (!s.endedAt || s.id === excludeSessionId) continue;
    for (const set of setsOf(s, exerciseId)) {
      if (set.loadKg > 0 && (!r.maxLoad || set.loadKg > r.maxLoad.value || (set.loadKg === r.maxLoad.value && set.reps > r.maxLoad.reps))) {
        r.maxLoad = { value: set.loadKg, reps: set.reps, date: s.startedAt };
      }
      const e = estimate1RM(set.loadKg, set.reps);
      if (e !== null && (!r.best1RM || e > r.best1RM.value))
        r.best1RM = {
          value: e,
          set: `${set.loadKg} kg × ${set.reps}`,
          date: s.startedAt
        };
      const v = set.loadKg * set.reps;
      if (v > 0 && (!r.bestSetVolume || v > r.bestSetVolume.value))
        r.bestSetVolume = {
          value: v,
          set: `${set.loadKg} kg × ${set.reps}`,
          date: s.startedAt
        };
    }
  }
  return r;
}

/**
 * Compara uma série com os recordes anteriores. Só conta como recorde se já existia
 * histórico do exercício (a primeira vez não é recorde, é ponto de partida).
 */
export function setRecordHits(set: Pick<SetLog, "loadKg" | "reps" | "kind">, before: Records, exerciseId: string): RecordHit[] {
  if (set.kind || !before.maxLoad) return [];
  const hits: RecordHit[] = [];
  if (set.loadKg > before.maxLoad.value)
    hits.push({
      exerciseId,
      type: "carga",
      value: set.loadKg,
      previous: before.maxLoad.value
    });
  const e = estimate1RM(set.loadKg, set.reps);
  if (e !== null && before.best1RM && e > before.best1RM.value)
    hits.push({
      exerciseId,
      type: "1rm",
      value: e,
      previous: before.best1RM.value
    });
  return hits;
}

/** Recordes batidos em uma sessão em relação às sessões anteriores a ela. */
export function sessionRecordHits(session: Session, all: Session[]): RecordHit[] {
  const previous = all.filter((s) => s.endedAt && s.id !== session.id && s.startedAt < session.startedAt);
  const hits: RecordHit[] = [];
  const ids = [...new Set(session.items.map((i) => i.exerciseId))];
  for (const id of ids) {
    const before = exerciseRecords(previous, id);
    let best: RecordHit[] = [];
    for (const set of setsOf(session, id)) {
      const h = setRecordHits(set, before, id);
      for (const x of h) {
        const cur = best.find((b) => b.type === x.type);
        if (!cur) best.push(x);
        else if (x.value > cur.value) best = best.map((b) => (b.type === x.type ? x : b));
      }
    }
    hits.push(...best);
  }
  return hits;
}
