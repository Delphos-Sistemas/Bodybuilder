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
  /** criado pelo usuário (sem demonstração em mídia) */
  custom?: boolean;
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
  /** timer guiado: tempo de execução da série (s). Sem valor = padrão */
  workSec?: number;
  /** timer guiado: tempo para se posicionar antes da série (s). Sem valor = padrão */
  prepSec?: number;
};

export type Workout = {
  id: string;
  name: string;
  notes: string;
  exercises: WorkoutExercise[];
  createdAt: number;
  updatedAt: number;
};

export const SET_KINDS = {
  aquecimento: "Aquecimento",
  drop: "Drop set"
} as const;
/** Série extra: não conta nas séries planejadas nem nos recordes. Sem tipo = série válida. */
export type SetKind = keyof typeof SET_KINDS;

export type SetLog = {
  kind?: SetKind;
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
  /** anotação livre do usuário sobre a sessão */
  notes?: string;
  /** última alteração depois de encerrada (anotação), para a sincronização */
  updatedAt?: number;
  items: SessionItem[];
  currentIndex: number;
  rest: RestState | null;
};

export type BodyWeight = { id: string; date: string; kg: number };

export const MEASUREMENTS = {
  cintura: "Cintura",
  abdomen: "Abdômen",
  quadril: "Quadril",
  peito: "Peito",
  braco: "Braço",
  coxa: "Coxa",
  panturrilha: "Panturrilha"
} as const;
export type MeasurementKey = keyof typeof MEASUREMENTS;
/** Medidas em centímetros em uma data. */
export type Measurement = {
  id: string;
  date: string;
  cm: Partial<Record<MeasurementKey, number>>;
};

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

/** Registro de um dia: proteína e água consumidas e se seguiu o próprio plano alimentar. */
export type NutritionDay = {
  proteinG: number;
  waterMl: number;
  onPlan?: boolean;
  updatedAt: number;
};

/** Metas leves de proteína e água. Sem meta manual, a proteína usa g/kg do peso mais recente. */
export type Nutrition = {
  proteinPerKg?: number;
  proteinGoalG?: number;
  waterGoalMl?: number;
  goalsUpdatedAt?: number;
  /** por data local AAAA-MM-DD */
  days: Record<string, NutritionDay>;
};

export type ShoppingItem = {
  id: string;
  text: string;
  qtd?: string;
  done: boolean;
  recipeId?: string;
  updatedAt: number;
};

export type Dataset = {
  profile: Profile;
  workouts: Workout[];
  sessions: Session[];
  activeSession: Session | null;
  bodyWeights: BodyWeight[];
  /** exercícios criados pelo usuário */
  customExercises?: Exercise[];
  measurements?: Measurement[];
  /** quando o perfil foi alterado (ms), para a sincronização */
  profileUpdatedAt?: number;
  /** ids apagados e quando (ms), para a sincronização não trazer de volta */
  tombstones?: Record<string, number>;
  nutrition?: Nutrition;
  shoppingList?: ShoppingItem[];
};

export type Settings = {
  audioEnabled: boolean;
  vibration: boolean;
  alertVolume: number;
  /** Fonte de música preferida no player */
  musicSource?: "spotify" | "local";
  /** Playlists do Spotify escolhidas pelo usuário, por estilo (URL ou URI) */
  spotify?: Partial<Record<"metal" | "rock" | "hiphop", string>>;
  /** O usuário aceitou carregar o player do Spotify (conteúdo de terceiros) */
  spotifyEnabled?: boolean;
  /** quando o último backup foi exportado (ms) */
  lastBackupAt?: number;
  /** o usuário adiou o lembrete de backup até este instante (ms) */
  backupSnoozeUntil?: number;
  /** código secreto de sincronização entre aparelhos */
  syncCode?: string;
  /** versão do servidor na última sincronização */
  syncVersion?: number;
  lastSyncAt?: number;
  /** timer guiado de séries (exercício → descanso → preparação) */
  guidedTimer?: boolean;
  /** timer guiado: ao terminar um exercício, segue sozinho para o próximo (padrão) ou espera o usuário */
  guidedAutoNext?: boolean;
  /** voz falada no timer guiado ("Bora lá, iniciar série"). Padrão: ligada */
  voiceCues?: boolean;
  /** estilo das falas: neutro ou zoeira ácida */
  voiceStyle?: "neutro" | "zoeira";
  /** voz gravada (dora, alex, santa) ou "aparelho" (síntese do navegador). Padrão: dora */
  voicePack?: "dora" | "alex" | "santa" | "aparelho";
  /** abaixar a música de outros apps (Spotify) enquanto a voz fala. Padrão: não, só mistura */
  duckMusic?: boolean;
  /** nome da voz do aparelho escolhida */
  voiceName?: string;
};

export type Mode = "usuario" | "demo";
