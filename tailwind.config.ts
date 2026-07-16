import type {
  Achievement,
  BodyWeightLog,
  PainLog,
  Profile,
  WeeklyCheckin,
  WorkoutPlan,
  WorkoutSession
} from "@/types/domain";
import { exercises } from "./exercises";

const ex = (name: string) => exercises.find((exercise) => exercise.name === name) ?? exercises[0];

export const demoProfile: Profile = {
  id: "demo-user",
  name: "Tiago",
  birthDate: "1992-08-21",
  biologicalSex: "masculino",
  heightCm: 178,
  currentWeightKg: 86.4,
  experienceLevel: "Avancado",
  goals: ["Hipertrofia", "Forca", "Condicionamento"],
  weeklyTarget: 6,
  demoMode: true
};

const makeExercise = (name: string, orderIndex: number, sets = 3, minReps = 8, maxReps = 12, restSeconds = 90) => ({
  id: `we-${name.toLowerCase().replaceAll(" ", "-")}`,
  exerciseId: ex(name).id,
  orderIndex,
  sets,
  minReps,
  maxReps,
  targetRir: orderIndex === 1 ? 2 : 1,
  restSeconds,
  suggestedWeight: 20 + orderIndex * 7.5,
  cadence: "2-0-2",
  notes: orderIndex === 1 ? "Aquecimento progressivo antes da primeira série válida." : "Técnica limpa antes de carga."
});

export const demoPlan: WorkoutPlan = {
  id: "plan-demo",
  userId: "demo-user",
  name: "Legado 6x",
  description: "Divisão demonstrativa para hipertrofia com domingo de descanso.",
  daysPerWeek: 6,
  isActive: true,
  days: [
    {
      id: "day-1",
      name: "Peito e biceps",
      weekday: "Segunda",
      orderIndex: 1,
      estimatedDurationMinutes: 62,
      muscleGroups: ["Peito", "Biceps"],
      exercises: [
        makeExercise("Supino reto com barra", 1, 4, 6, 10, 120),
        makeExercise("Supino inclinado com halteres", 2),
        makeExercise("Crossover", 3, 3, 10, 15),
        makeExercise("Rosca direta", 4),
        makeExercise("Rosca martelo", 5)
      ]
    },
    {
      id: "day-2",
      name: "Ombros e triceps",
      weekday: "Terca",
      orderIndex: 2,
      estimatedDurationMinutes: 58,
      muscleGroups: ["Ombros", "Triceps"],
      exercises: [
        makeExercise("Desenvolvimento com halteres", 1, 4, 6, 10, 120),
        makeExercise("Elevação lateral", 2, 4, 10, 15),
        makeExercise("Face pull", 3),
        makeExercise("Tríceps na polia", 4),
        makeExercise("Tríceps francês", 5)
      ]
    },
    {
      id: "day-3",
      name: "Pernas",
      weekday: "Quarta",
      orderIndex: 3,
      estimatedDurationMinutes: 72,
      muscleGroups: ["Quadriceps", "Posteriores", "Gluteos"],
      exercises: [
        makeExercise("Agachamento livre", 1, 4, 6, 10, 150),
        makeExercise("Leg press", 2, 4, 10, 12, 120),
        makeExercise("Cadeira extensora", 3),
        makeExercise("Mesa flexora", 4),
        makeExercise("Elevação pélvica", 5)
      ]
    },
    {
      id: "day-4",
      name: "Biceps e triceps",
      weekday: "Quinta",
      orderIndex: 4,
      estimatedDurationMinutes: 50,
      muscleGroups: ["Biceps", "Triceps"],
      exercises: [
        makeExercise("Rosca scott", 1),
        makeExercise("Rosca alternada", 2),
        makeExercise("Supino fechado", 3, 4, 6, 10, 120),
        makeExercise("Tríceps testa", 4)
      ]
    },
    {
      id: "day-5",
      name: "Costas",
      weekday: "Sexta",
      orderIndex: 5,
      estimatedDurationMinutes: 64,
      muscleGroups: ["Costas"],
      exercises: [
        makeExercise("Barra fixa", 1, 4, 6, 10, 120),
        makeExercise("Remada curvada", 2, 4, 6, 10, 120),
        makeExercise("Remada baixa", 3),
        makeExercise("Puxada frontal", 4),
        makeExercise("Pullover na polia", 5)
      ]
    },
    {
      id: "day-6",
      name: "Complementares",
      weekday: "Sabado",
      orderIndex: 6,
      estimatedDurationMinutes: 45,
      muscleGroups: ["Panturrilhas", "Antebraco", "Trapezio"],
      exercises: [
        makeExercise("Panturrilha em pé", 1, 4, 10, 15),
        makeExercise("Panturrilha sentada", 2, 4, 12, 18),
        makeExercise("Rosca punho", 3),
        makeExercise("Encolhimento com halteres", 4),
        makeExercise("Prancha", 5, 3, 30, 60)
      ]
    }
  ]
};

export const weightLogs: BodyWeightLog[] = Array.from({ length: 28 }, (_, index) => ({
  id: `weight-${index}`,
  date: new Date(2026, 5, 18 + index).toISOString(),
  weightKg: Number((87.6 - index * 0.045 + Math.sin(index) * 0.18).toFixed(1))
}));

export const demoSessions: WorkoutSession[] = Array.from({ length: 18 }, (_, index) => ({
  id: `session-${index + 1}`,
  userId: "demo-user",
  workoutDayId: demoPlan.days[index % demoPlan.days.length].id,
  startedAt: new Date(2026, 5, 22 + index, 18, 10).toISOString(),
  finishedAt: new Date(2026, 5, 22 + index, 19, 8).toISOString(),
  durationSeconds: 3300 + index * 35,
  difficulty: 6 + (index % 4),
  energy: 3 + (index % 3),
  painLevel: index % 7 === 0 ? 3 : 1,
  notes: "Sessão demo registrada para alimentar histórico e gráficos.",
  totalVolume: 6200 + index * 180,
  sets: []
}));

export const painLogs: PainLog[] = [
  {
    id: "pain-1",
    date: new Date().toISOString(),
    region: "Ombro",
    intensity: 3,
    painType: "Desconforto",
    movement: "Desenvolvimento pesado",
    notes: "Aquecimento mais cuidadoso e evitar falha."
  }
];

export const achievements: Achievement[] = [
  { id: "ach-1", title: "Primeiro treino", description: "A construção saiu do papel.", unlockedAt: "2026-06-20" },
  { id: "ach-2", title: "10 treinos", description: "Constância registrada.", unlockedAt: "2026-07-02" },
  { id: "ach-3", title: "Primeiro leg day concluido", description: "Ninguem gosta. Todo mundo precisa.", unlockedAt: "2026-07-04" },
  { id: "ach-4", title: "Primeiro recorde", description: "Mais capacidade, não apenas números.", unlockedAt: "2026-07-09" }
];

export const lastWeeklyCheckin: WeeklyCheckin = {
  id: "check-1",
  date: new Date().toISOString(),
  trainedDays: 5,
  energy: 4,
  sleep: 3,
  motivation: 4,
  soreness: 3,
  jointPain: 1,
  nutrition: 4,
  stress: 3,
  nextWeekTime: "60 minutos por sessao",
  agendaChanged: false,
  recommendation: "Manter o plano e preservar recuperação nas séries acessórias."
};
