import type { Phase, Session, SessionItem, SetLog, Workout } from "./types";
import { uid } from "./id";

export function createSession(workout: Workout, now: number, phase?: Phase | null): Session {
  const items: SessionItem[] = workout.exercises.map((we) => ({
    exerciseId: we.exerciseId,
    planned: {
      sets: we.sets,
      repsMin: we.repsMin,
      repsMax: we.repsMax,
      loadKg: we.loadKg,
      rir: we.rir,
      restSec: we.restSec,
      ...(we.workSec ? { workSec: we.workSec } : {}),
      ...(we.prepSec !== undefined ? { prepSec: we.prepSec } : {}),
      ...(we.superset ? { superset: true } : {}),
      ...(we.drops ? { drops: we.drops } : {})
    },
    sets: [],
    skipped: false
  }));
  if (items[0]) items[0].startedAt = now;
  return {
    id: uid("s_"),
    workoutId: workout.id,
    workoutName: workout.name,
    startedAt: now,
    ...(phase ? { phase } : {}),
    items,
    currentIndex: 0,
    rest: null
  };
}

export function currentItem(session: Session): SessionItem | undefined {
  return session.items[session.currentIndex];
}

/** Séries válidas (sem aquecimento e sem drop set). */
export function workingSets(sets: SetLog[]): SetLog[] {
  return sets.filter((s) => !s.kind);
}

export function dropCount(sets: SetLog[]): number {
  return sets.filter((s) => s.kind === "drop").length;
}

/** Faltam drop sets: todas as séries válidas feitas, mas os drops planejados ainda não. */
export function dropsPending(item: SessionItem): number {
  if (item.skipped || workingSets(item.sets).length < item.planned.sets) return 0;
  return Math.max(0, (item.planned.drops ?? 0) - dropCount(item.sets));
}

export function isItemDone(item: SessionItem): boolean {
  return item.skipped || (workingSets(item.sets).length >= item.planned.sets && dropsPending(item) === 0);
}

/** Primeiro e último índice da supersérie que contém `index` (iguais quando não é supersérie). */
export function supersetRange(items: SessionItem[] | { planned: { superset?: boolean } }[], index: number): [number, number] {
  let a = index;
  while (a > 0 && items[a - 1]?.planned.superset) a--;
  let b = index;
  while (items[b]?.planned.superset && b + 1 < items.length) b++;
  return [a, b];
}

/** Próximo exercício da mesma supersérie, se a série atual leva direto a ele (sem descanso). */
export function supersetNextIndex(session: Session): number {
  const i = session.currentIndex;
  const [, b] = supersetRange(session.items, i);
  for (let j = i + 1; j <= b; j++) if (!isItemDone(session.items[j])) return j;
  return -1;
}

export function isSessionComplete(session: Session): boolean {
  return session.items.every(isItemDone);
}

function nextPendingIndex(session: Session, from: number): number {
  for (let i = from + 1; i < session.items.length; i++) if (!isItemDone(session.items[i])) return i;
  for (let i = 0; i <= from && i < session.items.length; i++) if (!isItemDone(session.items[i])) return i;
  return -1;
}

function moveTo(session: Session, index: number, now: number): Session {
  const items = session.items.slice();
  const cur = items[session.currentIndex];
  if (cur && isItemDone(cur) && !cur.finishedAt) items[session.currentIndex] = { ...cur, finishedAt: now };
  if (index >= 0 && items[index] && !items[index].startedAt) items[index] = { ...items[index], startedAt: now };
  return {
    ...session,
    items,
    currentIndex: index >= 0 ? index : session.currentIndex
  };
}

/**
 * Registra uma série e inicia o descanso (exceto se o treino terminou).
 * Supersérie: passa direto ao próximo exercício do grupo e só descansa no fim da rodada.
 * Drop set: depois da última série o drop vem sem descanso; o descanso vem quando acabam os drops.
 */
export function completeSet(session: Session, log: Omit<SetLog, "completedAt">, now: number, restOverride?: { sec: number; reason?: string }): Session {
  const item = currentItem(session);
  if (!item || isItemDone(item)) return session;
  const idx = session.currentIndex;
  const items = session.items.slice();
  const updated: SessionItem = {
    ...item,
    sets: [...item.sets, { ...log, completedAt: now }]
  };
  items[idx] = updated;
  let next: Session = { ...session, items };
  // aquecimento não conta como série planejada nem inicia descanso
  if (log.kind === "aquecimento") return { ...next, rest: null };
  const doneNow = isItemDone(updated);
  // drop set sem descanso: no meio dos drops, ou da última série válida para o primeiro drop
  if (!doneNow && (log.kind === "drop" || dropsPending(updated) > 0)) return { ...next, rest: null };
  if (log.kind === "drop" && !(updated.planned.drops ?? 0)) return { ...next, rest: null };
  if (isSessionComplete(next)) {
    next = moveTo(next, idx, now);
    return { ...next, rest: null };
  }
  const [a, b] = supersetRange(items, idx);
  const restFor = (sec: number) =>
    sec > 0 ? { startedAt: now, endsAt: now + sec * 1000, ...(restOverride?.reason ? { reason: restOverride.reason } : {}) } : null;
  if (b > a) {
    const partner = supersetNextIndex(next);
    if (partner >= 0) return { ...moveTo(next, partner, now), rest: null };
    // fim da rodada: descansa e volta ao primeiro do grupo que ainda tem séries
    let target = -1;
    for (let j = a; j <= b; j++)
      if (!isItemDone(items[j])) {
        target = j;
        break;
      }
    if (target < 0) target = nextPendingIndex(next, idx);
    if (target !== idx) next = moveTo(next, target, now);
    return { ...next, rest: restFor(restOverride?.sec ?? items[b].planned.restSec) };
  }
  if (doneNow) next = moveTo(next, nextPendingIndex(next, idx), now);
  return { ...next, rest: restFor(restOverride?.sec ?? updated.planned.restSec) };
}

export function adjustRest(session: Session, deltaSec: number, now: number): Session {
  if (!session.rest) return session;
  const endsAt = Math.max(now, session.rest.endsAt + deltaSec * 1000);
  return { ...session, rest: { ...session.rest, endsAt } };
}

export function clearRest(session: Session): Session {
  return { ...session, rest: null };
}

/** Troca o exercício atual por outro (aparelho ocupado). Só antes de registrar séries válidas. */
export function swapCurrent(session: Session, exerciseId: string): Session {
  const item = currentItem(session);
  if (!item || workingSets(item.sets).length || item.exerciseId === exerciseId) return session;
  const items = session.items.slice();
  items[session.currentIndex] = { ...item, exerciseId, swappedFrom: item.swappedFrom ?? item.exerciseId, sets: [] };
  return { ...session, items, rest: null };
}

export function skipExercise(session: Session, now: number): Session {
  const item = currentItem(session);
  if (!item) return session;
  const items = session.items.slice();
  items[session.currentIndex] = {
    ...item,
    skipped: workingSets(item.sets).length < item.planned.sets,
    finishedAt: now
  };
  const next = { ...session, items, rest: null };
  const idx = nextPendingIndex(next, next.currentIndex);
  return idx >= 0 ? moveTo(next, idx, now) : next;
}

export function goToExercise(session: Session, index: number, now: number): Session {
  if (index < 0 || index >= session.items.length) return session;
  return moveTo({ ...session, rest: null }, index, now);
}

export function finishSession(session: Session, now: number, manual: boolean): Session {
  const items = session.items.map((it) => (it.startedAt && !it.finishedAt ? { ...it, finishedAt: now } : it));
  return { ...session, items, rest: null, endedAt: now, endedManually: manual };
}

export function sessionVolume(session: Session): number {
  return session.items.reduce((acc, it) => acc + it.sets.reduce((s, set) => (set.kind === "aquecimento" ? s : s + set.reps * set.loadKg), 0), 0);
}

/** Séries válidas registradas (sem aquecimento e drop set). */
export function sessionSetCount(session: Session): number {
  return session.items.reduce((acc, it) => acc + workingSets(it.sets).length, 0);
}

export function estimateMinutes(w: Workout): number {
  const sec = w.exercises.reduce((acc, e) => acc + e.sets * (45 + (e.superset ? 0 : e.restSec)), 0);
  return Math.max(5, Math.round(sec / 60));
}

export const DEFAULT_WORK_SEC = 40;
export const DEFAULT_PREP_SEC = 10;

/** Tempos do timer guiado: execução, preparação e descanso (s). Isométrico usa o tempo máximo planejado. */
export function guidedTimes(planned: SessionItem["planned"], isometric?: boolean): { workSec: number; prepSec: number; restSec: number } {
  return {
    workSec: planned.workSec ?? (isometric ? planned.repsMax : DEFAULT_WORK_SEC),
    prepSec: planned.prepSec ?? DEFAULT_PREP_SEC,
    restSec: planned.restSec
  };
}

/** Altera os tempos do exercício atual só nesta sessão. */
export function setItemTimes(session: Session, patch: Partial<Pick<SessionItem["planned"], "workSec" | "prepSec" | "restSec">>): Session {
  const item = currentItem(session);
  if (!item) return session;
  const items = session.items.slice();
  items[session.currentIndex] = { ...item, planned: { ...item.planned, ...patch } };
  return { ...session, items };
}

export type NextStep = "troca" | "drop" | "descanso" | "rodada" | "proximo" | "fim";

/**
 * O que acontece ao registrar a próxima série do exercício atual (válida ou o drop pendente):
 * troca = supersérie, vai ao parceiro sem descanso; drop = drop set sem descanso; descanso = mesma série com descanso;
 * rodada = fim da rodada da supersérie; proximo = acabou o exercício; fim = acabou o treino.
 */
export function nextStep(session: Session): NextStep {
  const item = currentItem(session);
  if (!item) return "fim";
  const kind = dropsPending(item) > 0 ? ("drop" as const) : undefined;
  const after = completeSet(session, { loadKg: 0, reps: 0, rir: 0, ...(kind ? { kind } : {}) }, 0, { sec: 1 });
  if (isSessionComplete(after)) return "fim";
  const i = session.currentIndex;
  if (after.currentIndex === i) return after.rest ? "descanso" : "drop";
  if (!after.rest) return "troca";
  const [a, b] = supersetRange(session.items, i);
  return b > a && after.currentIndex >= a && after.currentIndex <= b ? "rodada" : "proximo";
}
