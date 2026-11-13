import type { ReminderConfig } from "../../worker/schedule";

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
  /** supersérie: este exercício é feito em sequência com o próximo, sem descanso entre eles */
  superset?: boolean;
  /** drop sets depois da última série (0 a 3) */
  drops?: number;
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
  /** exercício trocado durante o treino (aparelho ocupado): id do exercício original */
  swappedFrom?: string;
  startedAt?: number;
  finishedAt?: number;
};

export type ProgressionChange = {
  exerciseId: string;
  fromKg: number;
  toKg: number;
  /** meta de repetições sugerida para a próxima vez */
  reps: number;
  kind: "subir" | "manter" | "reduzir";
  /** a ficha foi atualizada (false = só sugestão, progressão automática desligada ou desfeita) */
  applied: boolean;
};

export type RestState = {
  startedAt: number;
  endsAt: number;
  /** por que o descanso inteligente mudou o tempo planejado */
  reason?: string;
};

/** Diário rápido do treino, notas de 1 a 5. Dor: 1 = nenhuma, 5 = muita. */
export type Diary = {
  /** como foi o treino */
  nota?: number;
  energia?: number;
  sono?: number;
  dor?: number;
};

export const PHASES = {
  base: "Base",
  volume: "Volume",
  pesada: "Pesada",
  alivio: "Alívio"
} as const;
/** Semana do ciclo de periodização (4 semanas). */
export type Phase = keyof typeof PHASES;

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
  /** cargas da ficha alteradas pela progressão automática ao finalizar */
  progression?: ProgressionChange[];
  /** diário do treino: nota, energia, sono e dor */
  diary?: Diary;
  /** semana do ciclo de periodização em que o treino foi feito */
  phase?: Phase;
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
  voiceStyle?: "neutro" | "zoeira" | "comico" | "estoico" | "maromba";
  /** voz gravada (dora, alex, santa) ou "aparelho" (síntese do navegador). Padrão: dora */
  voicePack?: "dora" | "alex" | "santa" | "aparelho";
  /** iPhone: "misturar" toca por cima do Spotify (respeita o silencioso); "alto" toca no silencioso e pausa a música */
  soundMode?: "misturar" | "alto";
  /** nome da voz do aparelho escolhida */
  voiceName?: string;
  /** lembretes por notificação (treino e água) */
  reminders?: ReminderConfig;
  /** este aparelho está inscrito nos lembretes */
  remindersOn?: boolean;
  /** ao finalizar o treino, atualiza as cargas da ficha com a sugestão de progressão. Padrão: ligado */
  autoProgress?: boolean;
  /** descanso ajustado pelo tipo de exercício, repetições e esforço. Padrão: ligado */
  smartRest?: boolean;
  /** sugere séries de aquecimento antes do primeiro exercício pesado de cada músculo. Padrão: ligado */
  autoWarmup?: boolean;
  /** ciclo de 4 semanas (base, volume, pesada, alívio) começando na semana de `start` (AAAA-MM-DD) */
  periodization?: { on: boolean; start: string };
  /** desafio entre amigos por link */
  challenge?: ChallengeBoard;
  /** quando os arquivos do modo academia offline foram baixados (ms) */
  offlineAt?: number;
};

/** Participante do desafio do mês: números enviados por ele mesmo no link. */
export type ChallengeEntry = {
  id: string;
  nome: string;
  /** mês AAAA-MM dos números */
  mes: string;
  treinos: number;
  volume: number;
  series: number;
  recordes: number;
  /** atualizado em (ms) */
  em: number;
};

export type ChallengeBoard = {
  /** meu id no desafio */
  me: string;
  /** critério do ranking */
  kind: "treinos" | "volume" | "series" | "recordes";
  entries: ChallengeEntry[];
};

export type Mode = "usuario" | "demo";
