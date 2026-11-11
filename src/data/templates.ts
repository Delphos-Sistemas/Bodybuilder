import type { Equipment, Workout, WorkoutExercise } from "@/lib/types";
import { uid } from "@/lib/id";
import { EXERCISE_MAP } from "./exercises";

type Row = [exerciseId: string, sets: number, repsMin: number, repsMax: number, restSec: number];

export type TemplateDay = { name: string; rows: Row[] };
export type Template = {
  id: string;
  name: string;
  description: string;
  daysPerWeek: string;
  days: TemplateDay[];
};

export const TEMPLATES: Template[] = [
  {
    id: "abc",
    name: "ABC",
    description: "Três treinos divididos por grupos musculares. Bom para 3 a 6 dias por semana.",
    daysPerWeek: "3 a 6 dias",
    days: [
      {
        name: "Treino A — Peito, ombros e tríceps",
        rows: [
          ["supino-reto", 4, 6, 10, 120],
          ["supino-inclinado-halteres", 3, 8, 12, 90],
          ["crucifixo-halteres", 3, 10, 15, 60],
          ["desenvolvimento-halteres", 3, 8, 12, 90],
          ["elevacao-lateral", 3, 12, 15, 60],
          ["triceps-polia", 3, 10, 15, 60]
        ]
      },
      {
        name: "Treino B — Costas e bíceps",
        rows: [
          ["puxada-frontal", 4, 8, 12, 90],
          ["remada-curvada", 4, 6, 10, 120],
          ["remada-baixa", 3, 8, 12, 90],
          ["crucifixo-inverso", 3, 12, 15, 60],
          ["rosca-direta", 3, 8, 12, 60],
          ["rosca-martelo", 3, 10, 12, 60]
        ]
      },
      {
        name: "Treino C — Pernas e abdômen",
        rows: [
          ["agachamento-livre", 4, 6, 10, 150],
          ["leg-press", 3, 10, 12, 120],
          ["stiff", 3, 8, 12, 120],
          ["cadeira-extensora", 3, 12, 15, 60],
          ["mesa-flexora", 3, 10, 12, 60],
          ["panturrilha-leg-press", 4, 12, 15, 45],
          ["prancha", 3, 30, 45, 45]
        ]
      }
    ]
  },
  {
    id: "ppl",
    name: "Push/Pull/Legs",
    description: "Empurrar, puxar e pernas. Pode ser feito 3 ou 6 vezes por semana.",
    daysPerWeek: "3 ou 6 dias",
    days: [
      {
        name: "Push — Empurrar",
        rows: [
          ["supino-reto", 4, 6, 10, 120],
          ["desenvolvimento-militar", 3, 6, 10, 120],
          ["supino-inclinado-halteres", 3, 8, 12, 90],
          ["elevacao-lateral", 3, 12, 15, 60],
          ["triceps-corda", 3, 10, 15, 60]
        ]
      },
      {
        name: "Pull — Puxar",
        rows: [
          ["barra-fixa", 3, 5, 10, 120],
          ["remada-curvada", 4, 6, 10, 120],
          ["puxada-supinada", 3, 8, 12, 90],
          ["crucifixo-inverso", 3, 12, 15, 60],
          ["rosca-alternada", 3, 8, 12, 60]
        ]
      },
      {
        name: "Legs — Pernas",
        rows: [
          ["agachamento-livre", 4, 6, 10, 150],
          ["stiff", 3, 8, 10, 120],
          ["leg-press", 3, 10, 12, 120],
          ["cadeira-flexora", 3, 10, 12, 60],
          ["panturrilha-sentada", 4, 12, 15, 45]
        ]
      }
    ]
  },
  {
    id: "upper-lower",
    name: "Upper/Lower",
    description: "Parte superior e parte inferior alternadas. Ideal para 4 dias por semana.",
    daysPerWeek: "4 dias",
    days: [
      {
        name: "Upper — Superiores",
        rows: [
          ["supino-reto", 4, 6, 10, 120],
          ["remada-curvada", 4, 6, 10, 120],
          ["desenvolvimento-halteres", 3, 8, 12, 90],
          ["puxada-frontal", 3, 8, 12, 90],
          ["rosca-direta", 2, 10, 12, 60],
          ["triceps-polia", 2, 10, 12, 60]
        ]
      },
      {
        name: "Lower — Inferiores",
        rows: [
          ["agachamento-livre", 4, 6, 10, 150],
          ["stiff", 3, 8, 10, 120],
          ["afundo-halteres", 3, 10, 12, 90],
          ["mesa-flexora", 3, 10, 12, 60],
          ["panturrilha-leg-press", 3, 12, 15, 45],
          ["elevacao-de-pernas", 3, 10, 15, 45]
        ]
      }
    ]
  },
  {
    id: "full-body",
    name: "Full Body",
    description: "Corpo inteiro em cada sessão. Ótimo para 2 ou 3 dias por semana.",
    daysPerWeek: "2 ou 3 dias",
    days: [
      {
        name: "Full Body",
        rows: [
          ["agachamento-livre", 3, 8, 10, 150],
          ["supino-reto", 3, 8, 10, 120],
          ["remada-curvada", 3, 8, 10, 120],
          ["desenvolvimento-halteres", 2, 10, 12, 90],
          ["stiff", 2, 10, 12, 90],
          ["prancha", 3, 30, 45, 45]
        ]
      }
    ]
  }
];

export function rowToExercise([exerciseId, sets, repsMin, repsMax, restSec]: Row): WorkoutExercise {
  return {
    uid: uid("we_"),
    exerciseId,
    sets,
    repsMin,
    repsMax,
    loadKg: 0,
    rir: 2,
    restSec
  };
}

export function workoutsFromTemplate(template: Template, now: number, prefix = ""): Workout[] {
  return template.days.map((day, i) => ({
    id: uid("w_"),
    name: prefix ? `${prefix} ${day.name}` : day.name,
    notes: `Criado a partir do modelo ${template.name}.`,
    exercises: day.rows.map(rowToExercise),
    createdAt: now + i,
    updatedAt: now + i
  }));
}

/** Troca exercícios cujo equipamento não está disponível pela primeira substituição possível. */
export function adaptToEquipment(workout: Workout, available: Equipment[]): Workout {
  if (!available.length) return workout;
  const ok = (id: string) => {
    const ex = EXERCISE_MAP[id];
    return !!ex && (ex.equipment === "peso-corporal" || available.includes(ex.equipment));
  };
  const used = new Set<string>();
  const exercises = workout.exercises
    .map((we) => {
      if (ok(we.exerciseId) && !used.has(we.exerciseId)) {
        used.add(we.exerciseId);
        return we;
      }
      const alt = EXERCISE_MAP[we.exerciseId]?.substitutions.find((s) => ok(s) && !used.has(s));
      if (!alt) return null;
      used.add(alt);
      return { ...we, exerciseId: alt };
    })
    .filter((we): we is WorkoutExercise => we !== null);
  return { ...workout, exercises };
}
