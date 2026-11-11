"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { BodyWeight, Dataset, Mode, Profile, SetLog, Settings, Workout, WorkoutExercise } from "./types";
import { uid } from "./id";
import { buildDemoDataset } from "@/data/demo";
import { exportSchema, type ExportFile } from "./schemas";
import {
  adjustRest,
  clearRest,
  completeSet,
  createSession,
  finishSession,
  goToExercise,
  skipExercise
} from "./session";

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

export function emptyDataset(): Dataset {
  return { profile: { ...DEFAULT_PROFILE }, workouts: [], sessions: [], activeSession: null, bodyWeights: [] };
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
  skipCurrent: () => void;
  goTo: (index: number) => void;
  finish: (manual: boolean) => string | null;
  deleteSession: (id: string) => void;
  setSessionNotes: (id: string, notes: string) => void;
  addBodyWeight: (date: string, kg: number) => void;
  removeBodyWeight: (id: string) => void;
  saveProfile: (p: Profile) => void;
  updateSettings: (s: Partial<Settings>) => void;
  exportData: () => ExportFile;
  importData: (raw: unknown) => { ok: true } | { ok: false; error: string };
  clearUserData: () => void;
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

        enterDemo: () => set((s) => ({ mode: "demo", demo: s.demo ?? buildDemoDataset(Date.now()) })),
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
            exercises: src.exercises.map((e: WorkoutExercise) => ({ ...e, uid: uid("we_") })),
            createdAt: now,
            updatedAt: now
          };
          update((d) => ({ ...d, workouts: [...d.workouts, copy] }));
          return copy.id;
        },
        deleteWorkout: (id) => update((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== id) })),

        startSession: (workoutId) => {
          const w = current().workouts.find((x) => x.id === workoutId);
          if (!w || !w.exercises.length) return false;
          update((d) => ({ ...d, activeSession: createSession(w, Date.now()) }));
          return true;
        },
        discardActive: () => update((d) => ({ ...d, activeSession: null })),
        logSet: (log) =>
          update((d) => (d.activeSession ? { ...d, activeSession: completeSet(d.activeSession, log, Date.now()) } : d)),
        changeRest: (delta) =>
          update((d) => (d.activeSession ? { ...d, activeSession: adjustRest(d.activeSession, delta, Date.now()) } : d)),
        endRest: () => update((d) => (d.activeSession ? { ...d, activeSession: clearRest(d.activeSession) } : d)),
        skipCurrent: () =>
          update((d) => (d.activeSession ? { ...d, activeSession: skipExercise(d.activeSession, Date.now()) } : d)),
        goTo: (index) =>
          update((d) => (d.activeSession ? { ...d, activeSession: goToExercise(d.activeSession, index, Date.now()) } : d)),
        finish: (manual) => {
          const active = current().activeSession;
          if (!active) return null;
          const done = finishSession(active, Date.now(), manual);
          update((d) => ({ ...d, activeSession: null, sessions: [done, ...d.sessions] }));
          return done.id;
        },
        deleteSession: (id) => update((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) })),
        setSessionNotes: (id, notes) =>
          update((d) => ({ ...d, sessions: d.sessions.map((s) => (s.id === id ? { ...s, notes: notes.trim().slice(0, 1000) || undefined } : s)) })),

        addBodyWeight: (date, kg) =>
          update((d) => ({
            ...d,
            bodyWeights: [...d.bodyWeights.filter((b) => b.date !== date), { id: uid("bw_"), date, kg } as BodyWeight]
          })),
        removeBodyWeight: (id) => update((d) => ({ ...d, bodyWeights: d.bodyWeights.filter((b) => b.id !== id) })),
        saveProfile: (p) => update((d) => ({ ...d, profile: p })),
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
            return { ok: false, error: "Arquivo inválido ou de outro aplicativo. Nenhum dado foi alterado." };
          }
          set({ usuario: parsed.data.data as Dataset, mode: "usuario" });
          return { ok: true };
        },
        clearUserData: () => set({ usuario: emptyDataset(), mode: "usuario" })
      };
    },
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => localStorage)
    }
  )
);

/** Conjunto de dados ativo (usuário ou demonstração). */
export function useData(): Dataset {
  return useStore((s) => (s.mode === "demo" && s.demo ? s.demo : s.usuario));
}
