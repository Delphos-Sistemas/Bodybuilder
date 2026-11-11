import { describe, expect, it } from "vitest";
import { EXERCISE_MAP, syncCustomExercises } from "@/data/exercises";
import { needsBackup } from "@/lib/backup";
import { estimate1RM, exerciseRecords, sessionRecordHits } from "@/lib/records";
import { datasetSchema } from "@/lib/schemas";
import { completeSet, createSession, isItemDone, sessionSetCount, sessionVolume } from "@/lib/session";
import { emptyDataset } from "@/lib/store";
import type { Session, SetLog, Workout } from "@/lib/types";
import { weeklySetsByMuscle } from "@/lib/volume";

const DAY = 86_400_000;
const set = (loadKg: number, reps: number, kind?: SetLog["kind"]): SetLog => ({ loadKg, reps, rir: 2, completedAt: 0, ...(kind ? { kind } : {}) });
const planned = { sets: 2, repsMin: 8, repsMax: 12, loadKg: 0, rir: 2, restSec: 60 };
const session = (id: string, startedAt: number, exerciseId: string, sets: SetLog[]): Session => ({
  id,
  workoutId: "w",
  workoutName: "Treino",
  startedAt,
  endedAt: startedAt + 3600_000,
  currentIndex: 0,
  rest: null,
  items: [{ exerciseId, planned, sets, skipped: false }]
});

describe("1RM e recordes", () => {
  it("estima 1RM pela fórmula de Epley e ignora séries longas", () => {
    expect(estimate1RM(100, 1)).toBe(100);
    expect(estimate1RM(100, 10)).toBe(133.3);
    expect(estimate1RM(100, 15)).toBeNull();
    expect(estimate1RM(0, 10)).toBeNull();
  });
  it("aquecimento não entra nos recordes", () => {
    const r = exerciseRecords([session("a", 1, "supino-reto", [set(120, 3, "aquecimento"), set(80, 8)])], "supino-reto");
    expect(r.maxLoad?.value).toBe(80);
  });
  it("a primeira sessão não é recorde; a seguinte mais pesada é", () => {
    const a = session("a", 1000, "supino-reto", [set(80, 8)]);
    const b = session("b", 2000, "supino-reto", [set(85, 8), set(80, 8)]);
    expect(sessionRecordHits(a, [a, b])).toEqual([]);
    const hits = sessionRecordHits(b, [a, b]);
    expect(hits.map((h) => h.type).sort()).toEqual(["1rm", "carga"]);
    expect(hits.find((h) => h.type === "carga")?.value).toBe(85);
  });
});

describe("tipos de série", () => {
  const workout: Workout = {
    id: "w",
    name: "T",
    notes: "",
    createdAt: 0,
    updatedAt: 0,
    exercises: [{ uid: "u", exerciseId: "supino-reto", sets: 1, repsMin: 8, repsMax: 12, loadKg: 60, rir: 2, restSec: 90 }]
  };
  it("aquecimento e drop set não contam como série planejada nem iniciam descanso", () => {
    let s = createSession(workout, 0);
    s = completeSet(s, { loadKg: 40, reps: 10, rir: 5, kind: "aquecimento" }, 1000);
    expect(s.rest).toBeNull();
    expect(isItemDone(s.items[0])).toBe(false);
    s = completeSet(s, { loadKg: 60, reps: 10, rir: 2 }, 2000);
    expect(isItemDone(s.items[0])).toBe(true);
    expect(sessionSetCount(s)).toBe(1);
    // volume ignora aquecimento
    expect(sessionVolume(s)).toBe(600);
  });
});

describe("volume semanal", () => {
  it("conta 1 série no principal e meia nos secundários, só na semana atual", () => {
    const now = new Date(2026, 10, 11, 12).getTime(); // quarta
    const v = weeklySetsByMuscle(
      [session("a", now - DAY, "supino-reto", [set(80, 8), set(80, 8), set(60, 10, "aquecimento")]), session("b", now - 10 * DAY, "supino-reto", [set(80, 8)])],
      now
    );
    expect(v.peito).toBe(2);
    expect(v.triceps).toBe(1);
  });
});

describe("backup", () => {
  const now = 100 * DAY;
  it("lembra quando há treinos e nunca houve backup", () => {
    expect(needsBackup({ sessions: 3, sessionsSinceBackup: 3, now })).toBe(true);
    expect(needsBackup({ sessions: 2, sessionsSinceBackup: 2, now })).toBe(false);
  });
  it("respeita backup recente e o adiamento", () => {
    expect(needsBackup({ sessions: 5, sessionsSinceBackup: 1, lastBackupAt: now - 3 * DAY, now })).toBe(false);
    expect(needsBackup({ sessions: 5, sessionsSinceBackup: 1, lastBackupAt: now - 20 * DAY, now })).toBe(true);
    expect(needsBackup({ sessions: 5, sessionsSinceBackup: 1, lastBackupAt: now - 20 * DAY, snoozeUntil: now + DAY, now })).toBe(false);
  });
});

describe("exercícios personalizados e medidas", () => {
  it("registra e remove exercícios do usuário no mapa global", () => {
    syncCustomExercises([
      { id: "cx_1", name: "Remada articulada", primary: "costas", secondary: [], equipment: "maquina", instructions: [], errors: [], substitutions: [] }
    ]);
    expect(EXERCISE_MAP.cx_1?.custom).toBe(true);
    syncCustomExercises([]);
    expect(EXERCISE_MAP.cx_1).toBeUndefined();
    expect(EXERCISE_MAP["supino-reto"]).toBeDefined();
  });
  it("valida backup com exercícios próprios e medidas", () => {
    const d = {
      ...emptyDataset(),
      customExercises: [{ id: "cx_1", name: "X", primary: "costas", secondary: [], equipment: "maquina", instructions: [], errors: [], substitutions: [] }],
      measurements: [{ id: "m", date: "2026-11-10", cm: { cintura: 82.5 } }]
    };
    expect(datasetSchema.safeParse(d).success).toBe(true);
    expect(datasetSchema.safeParse({ ...d, measurements: [{ id: "m", date: "2026-11-10", cm: { cintura: 5 } }] }).success).toBe(false);
  });
});
