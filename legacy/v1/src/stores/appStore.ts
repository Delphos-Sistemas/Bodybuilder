"use client";

import { create } from "zustand";
import type { BodyWeightLog, PainLog, Profile, Readiness, WeeklyCheckin, WorkoutPlan, WorkoutSession } from "@/types/domain";
import { achievements, demoPlan, demoProfile, demoSessions, lastWeeklyCheckin, painLogs, weightLogs } from "@/data/demo";
import { calculateVolume } from "@/utils/progression";
import { loadLocalState, saveLocalState } from "@/services/localRepository";

type AppState = {
  hydrated: boolean;
  profile: Profile;
  plan: WorkoutPlan;
  sessions: WorkoutSession[];
  weightLogs: BodyWeightLog[];
  painLogs: PainLog[];
  checkins: WeeklyCheckin[];
  achievements: typeof achievements;
  readiness: Readiness;
  activeSessionId?: string;
  hydrate: () => void;
  setReadiness: (readiness: Readiness) => void;
  startWorkout: (workoutDayId: string) => string;
  completeSet: (sessionId: string, exerciseId: string, setNumber: number, weight: number, reps: number, rir: number, painLevel?: number) => void;
  finishWorkout: (sessionId: string, difficulty: number, energy: number, painLevel: number, notes: string, bodyWeight?: number) => void;
  addWeight: (weightKg: number) => void;
  addPain: (pain: Omit<PainLog, "id" | "date">) => void;
  submitCheckin: (checkin: Omit<WeeklyCheckin, "id" | "date" | "recommendation">) => void;
};

const fallback = {
  profile: demoProfile,
  plan: demoPlan,
  sessions: demoSessions,
  weightLogs,
  painLogs,
  checkins: [lastWeeklyCheckin],
  achievements,
  readiness: "Bem" as Readiness
};

function persist(state: AppState) {
  saveLocalState({
    profile: state.profile,
    plan: state.plan,
    sessions: state.sessions,
    weightLogs: state.weightLogs,
    painLogs: state.painLogs,
    checkins: state.checkins,
    achievements: state.achievements,
    readiness: state.readiness,
    activeSessionId: state.activeSessionId
  });
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  ...fallback,
  hydrate: () => {
    const loaded = loadLocalState(fallback);
    set({ ...loaded, hydrated: true });
  },
  setReadiness: (readiness) => {
    set({ readiness });
    persist(get());
  },
  startWorkout: (workoutDayId) => {
    const id = `session-${Date.now()}`;
    const session: WorkoutSession = {
      id,
      userId: get().profile.id,
      workoutDayId,
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      totalVolume: 0,
      sets: []
    };
    set((state) => ({ sessions: [session, ...state.sessions], activeSessionId: id }));
    persist(get());
    return id;
  },
  completeSet: (sessionId, exerciseId, setNumber, weight, reps, rir, painLevel) => {
    set((state) => ({
      sessions: state.sessions.map((session) => {
        if (session.id !== sessionId) return session;
        const nextSets = [
          ...session.sets.filter((setItem) => !(setItem.exerciseId === exerciseId && setItem.setNumber === setNumber)),
          {
            id: `set-${Date.now()}-${setNumber}`,
            sessionId,
            exerciseId,
            setNumber,
            weight,
            reps,
            rir,
            painLevel,
            completedAt: new Date().toISOString()
          }
        ];
        return { ...session, sets: nextSets, totalVolume: calculateVolume(nextSets) };
      })
    }));
    persist(get());
  },
  finishWorkout: (sessionId, difficulty, energy, painLevel, notes, bodyWeight) => {
    set((state) => ({
      activeSessionId: undefined,
      sessions: state.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              finishedAt: new Date().toISOString(),
              durationSeconds: Math.max(600, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)),
              difficulty,
              energy,
              painLevel,
              notes
            }
          : session
      ),
      weightLogs: bodyWeight
        ? [{ id: `weight-${Date.now()}`, date: new Date().toISOString(), weightKg: bodyWeight }, ...state.weightLogs]
        : state.weightLogs
    }));
    persist(get());
  },
  addWeight: (weightKg) => {
    set((state) => ({ weightLogs: [{ id: `weight-${Date.now()}`, date: new Date().toISOString(), weightKg }, ...state.weightLogs] }));
    persist(get());
  },
  addPain: (pain) => {
    set((state) => ({ painLogs: [{ id: `pain-${Date.now()}`, date: new Date().toISOString(), ...pain }, ...state.painLogs] }));
    persist(get());
  },
  submitCheckin: (checkin) => {
    const recommendation =
      checkin.jointPain >= 4
        ? "Interrompa movimentos que agravam a dor e procure avaliacao de um profissional de saude."
        : checkin.energy <= 2 || checkin.sleep <= 2
          ? "Reduza volume, preserve tecnica e priorize sono nesta semana."
          : checkin.stress >= 4
            ? "Mantenha o plano, mas reduza cardio intenso e organize os dias com folga."
            : "Manter o plano. A semana esta pronta para progresso sustentavel.";
    set((state) => ({
      checkins: [{ id: `check-${Date.now()}`, date: new Date().toISOString(), ...checkin, recommendation }, ...state.checkins]
    }));
    persist(get());
  }
}));
