import { adjustRest, completeSet, createSession, finishSession, isSessionComplete, sessionSetCount, sessionVolume, skipExercise } from "@/lib/session";
import type { Workout } from "@/lib/types";

const workout: Workout = {
  id: "w1",
  name: "Teste",
  notes: "",
  createdAt: 0,
  updatedAt: 0,
  exercises: [
    { uid: "a", exerciseId: "supino-reto", sets: 2, repsMin: 8, repsMax: 10, loadKg: 60, rir: 2, restSec: 90 },
    { uid: "b", exerciseId: "remada-curvada", sets: 1, repsMin: 8, repsMax: 10, loadKg: 50, rir: 2, restSec: 60 }
  ]
};
const set = { reps: 10, loadKg: 60, rir: 2 };

describe("sessão de treino", () => {
  it("registra série e inicia descanso com horário de término", () => {
    let s = createSession(workout, 1000);
    s = completeSet(s, set, 5000);
    expect(s.items[0].sets).toHaveLength(1);
    expect(s.rest).toEqual({ startedAt: 5000, endsAt: 95_000 });
    expect(s.currentIndex).toBe(0);
  });

  it("avança para o próximo exercício ao completar as séries", () => {
    let s = createSession(workout, 0);
    s = completeSet(s, set, 1000);
    s = completeSet(s, set, 2000);
    expect(s.currentIndex).toBe(1);
    expect(s.items[0].finishedAt).toBe(2000);
    expect(s.items[1].startedAt).toBe(2000);
  });

  it("ajusta descanso sem ficar negativo", () => {
    let s = completeSet(createSession(workout, 0), set, 0);
    s = adjustRest(s, 30, 10_000);
    expect(s.rest?.endsAt).toBe(120_000);
    s = adjustRest(s, -500, 10_000);
    expect(s.rest?.endsAt).toBe(10_000);
  });

  it("pula exercício e conclui a sessão", () => {
    let s = createSession(workout, 0);
    s = skipExercise(s, 1000);
    expect(s.items[0].skipped).toBe(true);
    expect(s.currentIndex).toBe(1);
    s = completeSet(s, { reps: 8, loadKg: 50, rir: 1 }, 2000);
    expect(isSessionComplete(s)).toBe(true);
    expect(s.rest).toBeNull();
  });

  it("encerramento manual guarda duração real, séries e volume", () => {
    let s = createSession(workout, 0);
    s = completeSet(s, set, 60_000);
    s = finishSession(s, 30 * 60_000, true);
    expect(s.endedAt).toBe(30 * 60_000);
    expect(s.endedManually).toBe(true);
    expect(sessionSetCount(s)).toBe(1);
    expect(sessionVolume(s)).toBe(600);
  });

  it("guarda o registro de dor quando informado", () => {
    const s = completeSet(createSession(workout, 0), { ...set, pain: "ombro" }, 1);
    expect(s.items[0].sets[0].pain).toBe("ombro");
  });
});
