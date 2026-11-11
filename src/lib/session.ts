import type { Session, SessionItem, SetLog, Workout } from "./types";
import { uid } from "./id";

export function createSession(workout: Workout, now: number): Session {
  const items: SessionItem[] = workout.exercises.map((we) => ({
    exerciseId: we.exerciseId,
    planned: {
      sets: we.sets,
      repsMin: we.repsMin,
      repsMax: we.repsMax,
      loadKg: we.loadKg,
      rir: we.rir,
      restSec: we.restSec
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

export function isItemDone(item: SessionItem): boolean {
  return item.skipped || workingSets(item.sets).length >= item.planned.sets;
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

/** Registra uma série e inicia o descanso (exceto se o treino terminou). */
export function completeSet(session: Session, log: Omit<SetLog, "completedAt">, now: number): Session {
  const item = currentItem(session);
  if (!item || isItemDone(item)) return session;
  const items = session.items.slice();
  const updated: SessionItem = {
    ...item,
    sets: [...item.sets, { ...log, completedAt: now }]
  };
  items[session.currentIndex] = updated;
  let next: Session = { ...session, items };
  // aquecimento e drop set não contam como série planejada nem iniciam descanso
  if (log.kind) return { ...next, rest: null };
  const restSec = updated.planned.restSec;
  if (isSessionComplete(next)) {
    next = moveTo(next, next.currentIndex, now);
    return { ...next, rest: null };
  }
  if (isItemDone(updated)) {
    next = moveTo(next, nextPendingIndex(next, next.currentIndex), now);
  }
  return {
    ...next,
    rest: restSec > 0 ? { startedAt: now, endsAt: now + restSec * 1000 } : null
  };
}

export function adjustRest(session: Session, deltaSec: number, now: number): Session {
  if (!session.rest) return session;
  const endsAt = Math.max(now, session.rest.endsAt + deltaSec * 1000);
  return { ...session, rest: { ...session.rest, endsAt } };
}

export function clearRest(session: Session): Session {
  return { ...session, rest: null };
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
  const sec = w.exercises.reduce((acc, e) => acc + e.sets * (45 + e.restSec), 0);
  return Math.max(5, Math.round(sec / 60));
}
