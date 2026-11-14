"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  BodyWeight,
  Dataset,
  Diary,
  Exercise,
  Measurement,
  Mode,
  Nutrition,
  NutritionDay,
  Profile,
  SetLog,
  Settings,
  Workout,
  WorkoutExercise
} from "./types";
import type { Recipe } from "@/data/recipes";
import { addRecipeToList, bumpDay, dayOf, EMPTY_DAY } from "./nutrition";
import { syncCustomExercises } from "@/data/exercises";
import { uid } from "./id";
import { buildDemoDataset } from "@/data/demo";
import { exportSchema, type ExportFile } from "./schemas";
import { applyProgression, planProgression } from "./progression";
import { markReminderDone } from "./reminders";
import { dailyGoals } from "./nutrition";
import { todayISO } from "./time";
import { EXERCISE_MAP } from "@/data/exercises";
import {
  adjustRest,
  clearRest,
  completeSet,
  createSession,
  currentItem,
  finishSession,
  goToExercise,
  setItemTimes,
  skipExercise,
  swapCurrent
} from "./session";
import { smartRest } from "./smartRest";
import { applyPhase, currentPhase } from "./periodization";

export const STORAGE_KEY = "bodybuilder:v2";

export const DEFAULT_PROFILE: Profile = {
  name: "",
  goal: "hipertrofia",
  experience: "iniciante",
  days: [1, 3, 5],
  equipment: ["barra", "halteres", "maquina", "polia", "peso-corporal"],
  weeklyGoal: 3,
  onboarded: false
};

/** Marca ids apagados, para a sincronização entre aparelhos não trazê-los de volta. */
function tomb(d: Dataset, ...ids: string[]): Record<string, number> {
  const now = Date.now();
  return { ...d.tombstones, ...Object.fromEntries(ids.map((id) => [id, now])) };
}

export function emptyDataset(): Dataset {
  return {
    profile: { ...DEFAULT_PROFILE },
    workouts: [],
    sessions: [],
    activeSession: null,
    bodyWeights: []
  };
}

type State = {
  mode: Mode;
  usuario: Dataset;
  demo: Dataset | null;
  settings: Settings;
};

type Actions = {
  enterDemo: () => void;
  exitDemo: () => void;
  resetDemo: () => void;
  saveWorkout: (w: Omit<Workout, "createdAt" | "updatedAt"> & { createdAt?: number }) => string;
  addWorkouts: (ws: Workout[]) => void;
  duplicateWorkout: (id: string) => string | null;
  deleteWorkout: (id: string) => void;
  startSession: (workoutId: string) => boolean;
  discardActive: () => void;
  logSet: (log: Omit<SetLog, "completedAt">) => void;
  changeRest: (deltaSec: number) => void;
  endRest: () => void;
  setItemTimes: (patch: { workSec?: number; prepSec?: number; restSec?: number }) => void;
  skipCurrent: () => void;
  goTo: (index: number) => void;
  /** troca o exercício atual (aparelho ocupado); com `inWorkout`, troca também na ficha */
  swapExercise: (exerciseId: string, inWorkout: boolean) => void;
  setSessionDiary: (id: string, diary: Diary) => void;
  finish: (manual: boolean) => string | null;
  /** desfaz (ou refaz) a atualização de cargas da ficha feita ao finalizar uma sessão */
  toggleProgression: (sessionId: string) => void;
  deleteSession: (id: string) => void;
  setSessionNotes: (id: string, notes: string) => void;
  addBodyWeight: (date: string, kg: number) => void;
  removeBodyWeight: (id: string) => void;
  saveProfile: (p: Profile) => void;
  updateSettings: (s: Partial<Settings>) => void;
  exportData: () => ExportFile;
  importData: (raw: unknown) => { ok: true } | { ok: false; error: string };
  clearUserData: () => void;
  /** substitui os dados do usuário pelos sincronizados, mantendo o treino em andamento deste aparelho */
  applySynced: (data: Dataset) => void;
  saveCustomExercise: (e: Omit<Exercise, "id"> & { id?: string }) => string;
  deleteCustomExercise: (id: string) => void;
  markBackupDone: () => void;
  addMeasurement: (date: string, cm: Measurement["cm"]) => void;
  removeMeasurement: (id: string) => void;
  snoozeBackup: (days: number) => void;
  logNutrition: (date: string, delta: { proteinG?: number; waterMl?: number }) => void;
  setNutritionDay: (date: string, patch: Partial<Omit<NutritionDay, "updatedAt">>) => void;
  setNutritionGoals: (g: Pick<Nutrition, "proteinPerKg" | "proteinGoalG" | "waterGoalMl">) => void;
  addRecipeToShopping: (recipe: Recipe) => number;
  addShoppingItem: (text: string, qtd?: string) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  clearShoppingDone: () => void;
};

export type Store = State & Actions;

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      /** Aplica uma alteração ao conjunto de dados do modo atual (usuário ou demonstração). */
      const update = (fn: (d: Dataset) => Dataset) =>
        set((s) => {
          if (s.mode === "demo" && s.demo) return { demo: fn(s.demo) };
          return { usuario: fn(s.usuario) };
        });
      const current = (): Dataset => {
        const s = get();
        return s.mode === "demo" && s.demo ? s.demo : s.usuario;
      };

      return {
        mode: "usuario",
        usuario: emptyDataset(),
        demo: null,
        settings: { audioEnabled: false, vibration: true, alertVolume: 0.7 },

        enterDemo: () =>
          set((s) => ({
            mode: "demo",
            demo: s.demo ?? buildDemoDataset(Date.now())
          })),
        exitDemo: () => set({ mode: "usuario" }),
        resetDemo: () => set({ demo: buildDemoDataset(Date.now()), mode: "demo" }),

        saveWorkout: (w) => {
          const now = Date.now();
          const id = w.id || uid("w_");
          update((d) => {
            const exists = d.workouts.find((x) => x.id === id);
            const workout: Workout = {
              ...w,
              id,
              createdAt: exists?.createdAt ?? w.createdAt ?? now,
              updatedAt: now
            };
            return {
              ...d,
              workouts: exists ? d.workouts.map((x) => (x.id === id ? workout : x)) : [...d.workouts, workout]
            };
          });
          return id;
        },
        addWorkouts: (ws) => update((d) => ({ ...d, workouts: [...d.workouts, ...ws] })),
        duplicateWorkout: (id) => {
          const src = current().workouts.find((w) => w.id === id);
          if (!src) return null;
          const now = Date.now();
          const copy: Workout = {
            ...src,
            id: uid("w_"),
            name: `${src.name} (cópia)`.slice(0, 80),
            exercises: src.exercises.map((e: WorkoutExercise) => ({
              ...e,
              uid: uid("we_")
            })),
            createdAt: now,
            updatedAt: now
          };
          update((d) => ({ ...d, workouts: [...d.workouts, copy] }));
          return copy.id;
        },
        deleteWorkout: (id) =>
          update((d) => ({
            ...d,
            workouts: d.workouts.filter((w) => w.id !== id),
            tombstones: tomb(d, id)
          })),

        startSession: (workoutId) => {
          const w = current().workouts.find((x) => x.id === workoutId);
          if (!w || !w.exercises.length) return false;
          const now = Date.now();
          const phase = currentPhase(get().settings, now);
          update((d) => ({
            ...d,
            activeSession: createSession(applyPhase(w, phase), now, phase)
          }));
          return true;
        },
        discardActive: () => update((d) => ({ ...d, activeSession: null })),
        logSet: (log) => {
          const active = current().activeSession;
          const item = active ? currentItem(active) : undefined;
          const ex = item ? EXERCISE_MAP[item.exerciseId] : undefined;
          const rest = item && ex && !log.kind && get().settings.smartRest !== false ? smartRest(item.planned, ex, log) : undefined;
          update((d) =>
            d.activeSession
              ? {
                  ...d,
                  activeSession: completeSet(d.activeSession, log, Date.now(), rest)
                }
              : d
          );
        },
        changeRest: (delta) =>
          update((d) =>
            d.activeSession
              ? {
                  ...d,
                  activeSession: adjustRest(d.activeSession, delta, Date.now())
                }
              : d
          ),
        endRest: () => update((d) => (d.activeSession ? { ...d, activeSession: clearRest(d.activeSession) } : d)),
        setItemTimes: (patch) => update((d) => (d.activeSession ? { ...d, activeSession: setItemTimes(d.activeSession, patch) } : d)),
        skipCurrent: () =>
          update((d) =>
            d.activeSession
              ? {
                  ...d,
                  activeSession: skipExercise(d.activeSession, Date.now())
                }
              : d
          ),
        goTo: (index) =>
          update((d) =>
            d.activeSession
              ? {
                  ...d,
                  activeSession: goToExercise(d.activeSession, index, Date.now())
                }
              : d
          ),
        swapExercise: (exerciseId, inWorkout) => {
          const active = current().activeSession;
          const item = active ? currentItem(active) : undefined;
          if (!active || !item) return;
          const from = item.exerciseId;
          const now = Date.now();
          update((d) => ({
            ...d,
            activeSession: d.activeSession ? swapCurrent(d.activeSession, exerciseId) : null,
            workouts: inWorkout
              ? d.workouts.map((w) => {
                  if (w.id !== active.workoutId) return w;
                  // a sessão segue a ordem da ficha: mesma posição, se a ficha não mudou nesse ponto
                  const i = active.currentIndex;
                  if (w.exercises[i]?.exerciseId !== from) return w;
                  return { ...w, exercises: w.exercises.map((we, k) => (k === i ? { ...we, exerciseId } : we)), updatedAt: now };
                })
              : d.workouts
          }));
        },
        setSessionDiary: (id, diary) =>
          update((d) => ({
            ...d,
            sessions: d.sessions.map((s) => (s.id === id ? { ...s, diary: Object.keys(diary).length ? diary : undefined, updatedAt: Date.now() } : s))
          })),
        finish: (manual) => {
          const active = current().activeSession;
          if (!active) return null;
          const now = Date.now();
          let done = finishSession(active, now, manual);
          // semana pesada ou de alívio: a carga da ficha não muda (só a sugestão fica registrada)
          const auto = get().settings.autoProgress !== false && done.phase !== "pesada" && done.phase !== "alivio";
          const changes = planProgression(done, (id) => EXERCISE_MAP[id]?.equipment);
          const workout = current().workouts.find((w) => w.id === done.workoutId);
          const progression = changes.map((c) => ({ ...c, applied: auto && !!workout && c.toKg !== c.fromKg }));
          if (progression.length) done = { ...done, progression };
          update((d) => ({
            ...d,
            activeSession: null,
            sessions: [done, ...d.sessions],
            workouts:
              auto && workout
                ? d.workouts.map((w) =>
                    w.id === workout.id
                      ? applyProgression(
                          w,
                          progression.filter((c) => c.applied),
                          now
                        )
                      : w
                  )
                : d.workouts
          }));
          if (get().settings.remindersOn && get().mode === "usuario") void markReminderDone("treino");
          return done.id;
        },
        toggleProgression: (sessionId) => {
          const s = current().sessions.find((x) => x.id === sessionId);
          if (!s?.progression?.length) return;
          const applicable = s.progression.filter((c) => c.toKg !== c.fromKg);
          const undo = applicable.some((c) => c.applied);
          const now = Date.now();
          update((d) => ({
            ...d,
            workouts: d.workouts.map((w) => (w.id === s.workoutId ? applyProgression(w, applicable, now, undo) : w)),
            sessions: d.sessions.map((x) =>
              x.id === sessionId ? { ...x, updatedAt: now, progression: x.progression!.map((c) => ({ ...c, applied: !undo && c.toKg !== c.fromKg })) } : x
            )
          }));
        },
        deleteSession: (id) =>
          update((d) => ({
            ...d,
            sessions: d.sessions.filter((s) => s.id !== id),
            tombstones: tomb(d, id)
          })),
        setSessionNotes: (id, notes) =>
          update((d) => ({
            ...d,
            sessions: d.sessions.map((s) => (s.id === id ? { ...s, notes: notes.trim().slice(0, 1000) || undefined, updatedAt: Date.now() } : s))
          })),

        addBodyWeight: (date, kg) =>
          update((d) => ({
            ...d,
            bodyWeights: [...d.bodyWeights.filter((b) => b.date !== date), { id: uid("bw_"), date, kg } as BodyWeight],
            tombstones: tomb(d, ...d.bodyWeights.filter((b) => b.date === date).map((b) => b.id))
          })),
        removeBodyWeight: (id) =>
          update((d) => ({
            ...d,
            bodyWeights: d.bodyWeights.filter((b) => b.id !== id),
            tombstones: tomb(d, id)
          })),
        saveProfile: (p) => update((d) => ({ ...d, profile: p, profileUpdatedAt: Date.now() })),
        updateSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),

        exportData: () => ({
          app: "bodybuilder",
          version: 2,
          exportedAt: new Date().toISOString(),
          data: get().usuario
        }),
        importData: (raw) => {
          const parsed = exportSchema.safeParse(raw);
          if (!parsed.success) {
            return {
              ok: false,
              error: "Arquivo inválido ou de outro aplicativo. Nenhum dado foi alterado."
            };
          }
          set({ usuario: parsed.data.data as Dataset, mode: "usuario" });
          return { ok: true };
        },
        // apaga só neste aparelho e desliga a sincronização aqui, para não misturar com a nuvem
        clearUserData: () =>
          set((st) => ({
            usuario: emptyDataset(),
            mode: "usuario",
            settings: { ...st.settings, syncCode: undefined, syncVersion: undefined, lastSyncAt: undefined }
          })),
        applySynced: (data) => set((st) => ({ usuario: { ...data, activeSession: st.usuario.activeSession } })),

        saveCustomExercise: (e) => {
          const id = e.id || uid("cx_");
          const ex: Exercise = { ...e, id, custom: true };
          update((d) => {
            const list = d.customExercises ?? [];
            return {
              ...d,
              customExercises: list.some((x) => x.id === id) ? list.map((x) => (x.id === id ? ex : x)) : [...list, ex]
            };
          });
          return id;
        },
        deleteCustomExercise: (id) =>
          update((d) => ({
            ...d,
            customExercises: (d.customExercises ?? []).filter((x) => x.id !== id),
            tombstones: tomb(d, id)
          })),
        addMeasurement: (date, cm) =>
          update((d) => ({
            ...d,
            measurements: [...(d.measurements ?? []).filter((m) => m.date !== date), { id: uid("me_"), date, cm }].sort((a, b) => a.date.localeCompare(b.date)),
            tombstones: tomb(d, ...(d.measurements ?? []).filter((m) => m.date === date).map((m) => m.id))
          })),
        removeMeasurement: (id) =>
          update((d) => ({
            ...d,
            measurements: (d.measurements ?? []).filter((m) => m.id !== id),
            tombstones: tomb(d, id)
          })),
        markBackupDone: () =>
          set((st) => ({
            settings: {
              ...st.settings,
              lastBackupAt: Date.now(),
              backupSnoozeUntil: undefined
            }
          })),
        logNutrition: (date, delta) => {
          const before = current();
          const goal = dailyGoals(before.nutrition, before.bodyWeights).waterMl;
          const had = dayOf(before.nutrition, date).waterMl;
          update((d) => {
            const n = d.nutrition ?? { days: {} };
            return { ...d, nutrition: { ...n, days: { ...n.days, [date]: bumpDay(dayOf(n, date), delta) } } };
          });
          // bateu a meta de água hoje: os lembretes de água param até amanhã
          const now = dayOf(current().nutrition, date).waterMl;
          if (get().settings.remindersOn && get().mode === "usuario" && date === todayISO() && had < goal && now >= goal) void markReminderDone("agua");
        },
        setNutritionDay: (date, patch) =>
          update((d) => {
            const n = d.nutrition ?? { days: {} };
            return { ...d, nutrition: { ...n, days: { ...n.days, [date]: { ...(n.days[date] ?? EMPTY_DAY), ...patch, updatedAt: Date.now() } } } };
          }),
        setNutritionGoals: (g) =>
          update((d) => ({
            ...d,
            nutrition: { days: {}, ...d.nutrition, ...g, goalsUpdatedAt: Date.now() }
          })),
        addRecipeToShopping: (recipe) => {
          let added = 0;
          update((d) => {
            const r = addRecipeToList(d.shoppingList ?? [], recipe);
            added = r.added;
            return { ...d, shoppingList: r.list };
          });
          return added;
        },
        addShoppingItem: (text, qtd) =>
          update((d) => ({
            ...d,
            shoppingList: [
              ...(d.shoppingList ?? []),
              { id: uid("sh_"), text: text.trim().slice(0, 120), qtd: qtd?.trim().slice(0, 200) || undefined, done: false, updatedAt: Date.now() }
            ]
          })),
        toggleShoppingItem: (id) =>
          update((d) => ({
            ...d,
            shoppingList: (d.shoppingList ?? []).map((x) => (x.id === id ? { ...x, done: !x.done, updatedAt: Date.now() } : x))
          })),
        removeShoppingItem: (id) =>
          update((d) => ({
            ...d,
            shoppingList: (d.shoppingList ?? []).filter((x) => x.id !== id),
            tombstones: tomb(d, id)
          })),
        clearShoppingDone: () =>
          update((d) => {
            const done = (d.shoppingList ?? []).filter((x) => x.done);
            return { ...d, shoppingList: (d.shoppingList ?? []).filter((x) => !x.done), tombstones: tomb(d, ...done.map((x) => x.id)) };
          }),
        snoozeBackup: (days) =>
          set((st) => ({
            settings: {
              ...st.settings,
              backupSnoozeUntil: Date.now() + days * 86_400_000
            }
          }))
      };
    },
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => localStorage)
    }
  )
);

// mantém os exercícios personalizados do conjunto ativo visíveis para todas as telas
const activeCustom = (s: Store) => (s.mode === "demo" && s.demo ? s.demo : s.usuario).customExercises;
syncCustomExercises(activeCustom(useStore.getState()));
useStore.subscribe((s, prev) => {
  if (activeCustom(s) !== activeCustom(prev) || s.mode !== prev.mode) syncCustomExercises(activeCustom(s));
});

/** Conjunto de dados ativo (usuário ou demonstração). */
export function useData(): Dataset {
  return useStore((s) => (s.mode === "demo" && s.demo ? s.demo : s.usuario));
}
