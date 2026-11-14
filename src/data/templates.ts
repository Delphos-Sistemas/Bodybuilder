import type { Equipment, Workout, WorkoutExercise } from "@/lib/types";
import { uid } from "@/lib/id";
import { EXERCISE_MAP } from "./exercises";

type Row = [exerciseId: string, sets: number, repsMin: number, repsMax: number, restSec: number];

export type TemplateDay = { name: string; rows: Row[] };
export const TEMPLATE_GOALS = {
  hipertrofia: "Hipertrofia",
  forca: "Força",
  iniciante: "Iniciante"
} as const;
export type TemplateGoal = keyof typeof TEMPLATE_GOALS;

export type Template = {
  id: string;
  name: string;
  /** objetivo principal do modelo (filtro na tela de Treinos) */
  goal: TemplateGoal;
  /** para quem é: iniciante, intermediário, avançado */
  level: string;
  description: string;
  daysPerWeek: string;
  days: TemplateDay[];
};

export const TEMPLATES: Template[] = [
  {
    id: "abc",
    goal: "hipertrofia",
    level: "Intermediário",
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
    goal: "hipertrofia",
    level: "Intermediário a avançado",
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
    goal: "hipertrofia",
    level: "Intermediário",
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
    goal: "iniciante",
    level: "Iniciante",
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
  },
  {
    id: "iniciante-ab",
    goal: "iniciante",
    level: "Iniciante (primeiros meses)",
    name: "Iniciante A/B",
    description: "Dois treinos simples, com máquinas e movimentos fáceis de aprender. Alterne A e B, 3 vezes por semana.",
    daysPerWeek: "3 dias",
    days: [
      {
        name: "Iniciante A",
        rows: [
          ["leg-press", 3, 10, 12, 90],
          ["voador", 3, 10, 12, 60],
          ["puxada-frontal", 3, 10, 12, 60],
          ["cadeira-extensora", 2, 12, 15, 60],
          ["elevacao-lateral", 2, 12, 15, 60],
          ["prancha", 3, 20, 30, 45]
        ]
      },
      {
        name: "Iniciante B",
        rows: [
          ["agachamento-smith", 3, 10, 12, 90],
          ["supino-reto-halteres", 3, 10, 12, 60],
          ["remada-baixa", 3, 10, 12, 60],
          ["mesa-flexora", 2, 12, 15, 60],
          ["rosca-direta", 2, 10, 12, 60],
          ["triceps-polia", 2, 10, 12, 60]
        ]
      }
    ]
  },
  {
    id: "forca-5x5",
    goal: "forca",
    level: "Iniciante a intermediário",
    name: "Força 5×5",
    description: "Poucos exercícios básicos, 5 séries de 5 com descanso longo. Alterne A e B, 3 vezes por semana, subindo a carga aos poucos.",
    daysPerWeek: "3 dias",
    days: [
      {
        name: "Força A",
        rows: [
          ["agachamento-livre", 5, 5, 5, 180],
          ["supino-reto", 5, 5, 5, 180],
          ["remada-curvada", 5, 5, 5, 150],
          ["prancha", 3, 30, 45, 60]
        ]
      },
      {
        name: "Força B",
        rows: [
          ["agachamento-livre", 5, 5, 5, 180],
          ["desenvolvimento-militar", 5, 5, 5, 180],
          ["levantamento-terra", 1, 5, 5, 240],
          ["barra-fixa", 3, 5, 8, 120]
        ]
      }
    ]
  },
  {
    id: "forca-4-dias",
    goal: "forca",
    level: "Intermediário a avançado",
    name: "Força 4 dias",
    description: "Superiores e inferiores com foco em carga alta (3 a 6 repetições) nos básicos e acessórios mais leves. 4 dias por semana.",
    daysPerWeek: "4 dias",
    days: [
      {
        name: "Superiores — força",
        rows: [
          ["supino-reto", 5, 3, 5, 240],
          ["remada-curvada", 4, 4, 6, 180],
          ["desenvolvimento-militar", 3, 4, 6, 180],
          ["barra-fixa", 3, 4, 6, 150],
          ["triceps-testa", 2, 6, 8, 90]
        ]
      },
      {
        name: "Inferiores — força",
        rows: [
          ["agachamento-livre", 5, 3, 5, 240],
          ["levantamento-terra", 3, 3, 5, 240],
          ["leg-press", 3, 6, 8, 150],
          ["mesa-flexora", 3, 6, 8, 90],
          ["panturrilha-sentada", 3, 8, 10, 60]
        ]
      }
    ]
  },
  {
    id: "abcde",
    goal: "hipertrofia",
    level: "Avançado",
    name: "ABCDE",
    description: "Um grupo muscular por dia, com bastante volume em cada um. Para quem treina 5 dias por semana.",
    daysPerWeek: "5 dias",
    days: [
      {
        name: "Treino A — Peito",
        rows: [
          ["supino-reto", 4, 6, 10, 120],
          ["supino-inclinado-halteres", 4, 8, 12, 90],
          ["crossover", 3, 12, 15, 60],
          ["paralelas", 3, 8, 12, 90]
        ]
      },
      {
        name: "Treino B — Costas",
        rows: [
          ["barra-fixa", 4, 6, 10, 120],
          ["remada-curvada", 4, 6, 10, 120],
          ["puxada-frontal", 3, 8, 12, 90],
          ["remada-baixa", 3, 10, 12, 90],
          ["hiperextensao-lombar", 3, 12, 15, 60]
        ]
      },
      {
        name: "Treino C — Pernas",
        rows: [
          ["agachamento-livre", 4, 6, 10, 150],
          ["leg-press", 4, 10, 12, 120],
          ["stiff", 3, 8, 12, 120],
          ["cadeira-extensora", 3, 12, 15, 60],
          ["mesa-flexora", 3, 10, 12, 60],
          ["panturrilha-leg-press", 4, 12, 15, 45]
        ]
      },
      {
        name: "Treino D — Ombros e trapézio",
        rows: [
          ["desenvolvimento-militar", 4, 6, 10, 120],
          ["elevacao-lateral", 4, 12, 15, 60],
          ["desenvolvimento-arnold", 3, 8, 12, 90],
          ["crucifixo-inverso", 3, 12, 15, 60],
          ["encolhimento-barra", 3, 10, 12, 60]
        ]
      },
      {
        name: "Treino E — Braços e abdômen",
        rows: [
          ["rosca-direta", 4, 8, 12, 60],
          ["triceps-testa", 4, 8, 12, 60],
          ["rosca-martelo", 3, 10, 12, 60],
          ["triceps-corda", 3, 10, 15, 60],
          ["rosca-scott", 3, 10, 12, 60],
          ["abdominal-polia", 3, 12, 15, 45]
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
