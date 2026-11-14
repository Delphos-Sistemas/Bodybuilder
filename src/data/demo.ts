import type { Dataset, Session, SetLog } from "@/lib/types";
import { TEMPLATES, workoutsFromTemplate } from "./templates";

const DAY = 24 * 60 * 60 * 1000;

/** Dados de exemplo do modo demonstração. Ficam separados dos dados do usuário. */
export function buildDemoDataset(now: number): Dataset {
  const base = now - 28 * DAY;
  const workouts = workoutsFromTemplate(TEMPLATES[0], base).map((w, i) => ({
    ...w,
    id: `demo_w${i}`,
    exercises: w.exercises.map((e, j) => ({
      ...e,
      uid: `demo_we${i}_${j}`,
      loadKg: demoStartLoad(e.exerciseId)
    }))
  }));
  const sessions: Session[] = [];
  let n = 0;
  // sessões a cada 2 ou 3 dias nas últimas 4 semanas, terminando ontem
  for (let ago = 26; ago >= 1; ago--) {
    if (![1, 3, 5].includes(ago % 7)) continue;
    const day = 28 - ago;
    const w = workouts[n % workouts.length];
    const week = Math.floor(day / 7);
    const startedAt = base + day * DAY + 18 * 60 * 60 * 1000;
    let t = startedAt;
    const items = w.exercises.map((e) => {
      const sets: SetLog[] = Array.from({ length: e.sets }, (_, k) => {
        t += 40_000 + e.restSec * 1000;
        return {
          reps: Math.max(e.repsMin, e.repsMax - k - (week % 2)),
          loadKg: e.loadKg ? e.loadKg + week * 2.5 : 0,
          rir: Math.max(0, 3 - k),
          completedAt: t
        };
      });
      return {
        exerciseId: e.exerciseId,
        planned: {
          sets: e.sets,
          repsMin: e.repsMin,
          repsMax: e.repsMax,
          loadKg: e.loadKg,
          rir: e.rir,
          restSec: e.restSec
        },
        sets,
        skipped: false,
        startedAt: sets[0].completedAt - 40_000,
        finishedAt: t
      };
    });
    sessions.push({
      id: `demo_s${n}`,
      workoutId: w.id,
      workoutName: w.name,
      startedAt,
      endedAt: t + 60_000,
      items,
      currentIndex: items.length - 1,
      rest: null
    });
    n++;
  }
  const bodyWeights = Array.from({ length: 9 }, (_, i) => {
    const d = new Date(base + i * 3 * DAY + DAY);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      id: `demo_bw${i}`,
      date,
      kg: Math.round((82.4 - i * 0.25 + (i % 2 ? 0.3 : 0)) * 10) / 10
    };
  });
  return {
    profile: {
      name: "Atleta demonstração",
      goal: "hipertrofia",
      experience: "intermediario",
      days: [1, 3, 5],
      equipment: ["barra", "halteres", "maquina", "polia", "smith", "peso-corporal"],
      weeklyGoal: 3,
      onboarded: true
    },
    workouts,
    sessions: sessions.reverse(),
    activeSession: null,
    bodyWeights
  };
}

function demoStartLoad(id: string): number {
  const loads: Record<string, number> = {
    "supino-reto": 60,
    "supino-inclinado-halteres": 22,
    "crucifixo-halteres": 14,
    "desenvolvimento-halteres": 18,
    "elevacao-lateral": 8,
    "triceps-polia": 25,
    "puxada-frontal": 55,
    "remada-curvada": 50,
    "remada-baixa": 50,
    "crucifixo-inverso": 6,
    "rosca-direta": 25,
    "rosca-martelo": 12,
    "agachamento-livre": 70,
    "leg-press": 160,
    stiff: 50,
    "cadeira-extensora": 40,
    "mesa-flexora": 35,
    "panturrilha-leg-press": 100
  };
  return loads[id] ?? 0;
}
