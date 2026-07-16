export type MuscleGroup =
  | "Peito"
  | "Costas"
  | "Ombros"
  | "Biceps"
  | "Triceps"
  | "Quadriceps"
  | "Posteriores"
  | "Gluteos"
  | "Panturrilhas"
  | "Abdomen"
  | "Antebraco"
  | "Trapezio"
  | "Cardio"
  | "Mobilidade";

export type ExperienceLevel = "Iniciante" | "Intermediario" | "Avancado";
export type Readiness = "Excelente" | "Bem" | "Cansado" | "Dolorido" | "Muito fatigado";

export type Profile = {
  id: string;
  name: string;
  birthDate: string;
  biologicalSex: "masculino" | "feminino" | "prefiro-nao-informar";
  heightCm: number;
  currentWeightKg: number;
  experienceLevel: ExperienceLevel;
  goals: string[];
  weeklyTarget: number;
  demoMode: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  alternativeName: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: string;
  difficulty: ExperienceLevel;
  exerciseType: "Composto" | "Isolador" | "Cardio" | "Mobilidade";
  environment: "Academia completa" | "Academia basica" | "Casa" | "Livre";
  instructions: string[];
  commonMistakes: string[];
  safetyTips: string[];
  substitutions: string[];
  imageUrl?: string;
  videoUrl?: string;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  orderIndex: number;
  sets: number;
  minReps: number;
  maxReps: number;
  targetRir: number;
  restSeconds: number;
  suggestedWeight: number;
  cadence: string;
  technique?: string;
  notes?: string;
};

export type WorkoutDay = {
  id: string;
  name: string;
  orderIndex: number;
  weekday: string;
  estimatedDurationMinutes: number;
  muscleGroups: MuscleGroup[];
  exercises: WorkoutExercise[];
};

export type WorkoutPlan = {
  id: string;
  userId: string;
  name: string;
  description: string;
  daysPerWeek: number;
  isActive: boolean;
  days: WorkoutDay[];
};

export type ExerciseSet = {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rir: number;
  rpe?: number;
  completedAt: string;
  isWarmup?: boolean;
  isFailure?: boolean;
  painLevel?: number;
};

export type WorkoutSession = {
  id: string;
  userId: string;
  workoutDayId: string;
  startedAt: string;
  finishedAt?: string;
  durationSeconds: number;
  difficulty?: number;
  energy?: number;
  painLevel?: number;
  notes?: string;
  totalVolume: number;
  sets: ExerciseSet[];
};

export type BodyWeightLog = {
  id: string;
  date: string;
  weightKg: number;
};

export type PainLog = {
  id: string;
  date: string;
  region: string;
  intensity: number;
  painType: string;
  movement: string;
  notes: string;
};

export type WeeklyCheckin = {
  id: string;
  date: string;
  trainedDays: number;
  energy: number;
  sleep: number;
  motivation: number;
  soreness: number;
  jointPain: number;
  nutrition: number;
  stress: number;
  nextWeekTime: string;
  agendaChanged: boolean;
  recommendation: string;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlockedAt?: string;
};
