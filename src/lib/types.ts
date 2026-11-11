export const MUSCLES = {
  peito: "Peito",
  costas: "Costas",
  ombros: "Ombros",
  trapezio: "Trapézio",
  biceps: "Bíceps",
  triceps: "Tríceps",
  antebraco: "Antebraço",
  abdomen: "Abdômen",
  lombar: "Lombar",
  gluteos: "Glúteos",
  quadriceps: "Quadríceps",
  posteriores: "Posteriores de coxa",
  adutores: "Adutores",
  panturrilhas: "Panturrilhas"
} as const;

export type Muscle = keyof typeof MUSCLES;

export const EQUIPMENT = {
  barra: "Barra",
  halteres: "Halteres",
  maquina: "Máquina",
  polia: "Polia",
  smith: "Smith",
  "peso-corporal": "Peso corporal"
} as const;

export type Equipment = keyof typeof EQUIPMENT;

export type Exercise = {
  id: string;
  name: string;
  primary: Muscle;
  secondary: Muscle[];
  equipment: Equipment;
  /** exercício isométrico: séries medidas em segundos */
  isometric?: boolean;
  instructions: string[];
  errors: string[];
  substitutions: string[];
};

export type WorkoutExercise = {
  uid: string;
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  loadKg: number;
  rir: number;
  restSec: number;
};

export type Workout = {
  id: string;
  name: string;
  notes: string;
  exercises: WorkoutExercise[];
  createdAt: number;
  updatedAt: number;
};

export type SetLog = {
  reps: number;
  loadKg: number;
  rir: number;
  pain?: string;
  completedAt: number;
};

export type SessionItem = {
  exerciseId: string;
  planned: Omit<WorkoutExercise, "uid" | "exerciseId">;
  sets: SetLog[];
  skipped: boolean;
  startedAt?: number;
  finishedAt?: number;
};

export type RestState = {
  startedAt: number;
  endsAt: number;
};

export type Session = {
  id: string;
  workoutId: string;
  workoutName: string;
  startedAt: number;
  endedAt?: number;
  endedManually?: boolean;
  items: SessionItem[];
  currentIndex: number;
  rest: RestState | null;
};

export type BodyWeight = { id: string; date: string; kg: number };

export const GOALS = {
  hipertrofia: "Ganhar massa muscular",
  forca: "Ganhar força",
  emagrecimento: "Reduzir gordura corporal",
  condicionamento: "Melhorar condicionamento e saúde"
} as const;
export type Goal = keyof typeof GOALS;

export const EXPERIENCE = {
  iniciante: "Iniciante (menos de 6 meses)",
  intermediario: "Intermediário (6 meses a 2 anos)",
  avancado: "Avançado (mais de 2 anos)"
} as const;
export type Experience = keyof typeof EXPERIENCE;

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export type Profile = {
  name: string;
  goal: Goal;
  experience: Experience;
  /** índices 0 (domingo) a 6 (sábado) */
  days: number[];
  equipment: Equipment[];
  weeklyGoal: number;
  onboarded: boolean;
};

export type Dataset = {
  profile: Profile;
  workouts: Workout[];
  sessions: Session[];
  activeSession: Session | null;
  bodyWeights: BodyWeight[];
};

export type Settings = {
  audioEnabled: boolean;
  vibration: boolean;
  alertVolume: number;
};

export type Mode = "usuario" | "demo";
