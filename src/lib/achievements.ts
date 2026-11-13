import { sessionRecordHits } from "./records";
import { sessionSetCount, sessionVolume } from "./session";
import { startOfWeek } from "./time";
import { EXERCISE_MAP } from "@/data/exercises";
import type { Session } from "./types";

const WEEK = 7 * 86_400_000;
const DAY = 86_400_000;

function done(sessions: Session[]): Session[] {
  return sessions.filter((s) => s.endedAt).sort((a, b) => a.startedAt - b.startedAt);
}

/** Semanas seguidas (segunda a domingo) batendo a meta. A semana atual conta se já bateu; se ainda não, não quebra a sequência. */
export function weekStreak(sessions: Session[], weeklyGoal: number, now: number): { current: number; best: number } {
  const count = new Map<number, number>();
  for (const s of done(sessions)) {
    const w = startOfWeek(s.startedAt);
    count.set(w, (count.get(w) ?? 0) + 1);
  }
  const hit = (w: number) => (count.get(w) ?? 0) >= weeklyGoal;
  const thisWeek = startOfWeek(now);
  let current = hit(thisWeek) ? 1 : 0;
  // + 12 h tolera a troca de horário de verão
  for (let w = startOfWeek(thisWeek - WEEK + 12 * 3_600_000); hit(w); w = startOfWeek(w - WEEK + 12 * 3_600_000)) current++;
  let best = 0;
  let run = 0;
  const weeks = [...count.keys()].sort((a, b) => a - b);
  let prev = -Infinity;
  for (const w of weeks) {
    if (!hit(w)) {
      run = 0;
      prev = w;
      continue;
    }
    run = Math.abs(w - prev - WEEK) < DAY ? run + 1 : 1;
    prev = w;
    best = Math.max(best, run);
  }
  return { current, best: Math.max(best, current) };
}

/** Dias seguidos com treino até hoje (ou até ontem, se hoje ainda não treinou). */
export function dayStreak(sessions: Session[], now: number): number {
  const days = new Set(done(sessions).map((s) => new Date(s.startedAt).toDateString()));
  const d = new Date(now);
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(d.toDateString())) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export type Medal = {
  id: string;
  title: string;
  text: string;
  /** grupo, para mostrar juntos */
  group: "treinos" | "volume" | "recordes" | "constancia" | "especiais";
  achievedAt?: number;
  /** 0 a 1 */
  progress: number;
  progressText: string;
};

type Def = { id: string; title: string; text: string; group: Medal["group"]; target: number; unit: string; metric: Metric };
type Metric = "treinos" | "toneladas" | "recordes" | "semanas" | "exercicios" | "diarios" | "cedo" | "noite" | "longo" | "series";

const DEFS: Def[] = [
  { id: "treinos-1", title: "Primeiro passo", text: "Concluir o primeiro treino", group: "treinos", target: 1, unit: "treino", metric: "treinos" },
  { id: "treinos-10", title: "Pegando o ritmo", text: "10 treinos concluídos", group: "treinos", target: 10, unit: "treinos", metric: "treinos" },
  { id: "treinos-25", title: "Frequentador", text: "25 treinos concluídos", group: "treinos", target: 25, unit: "treinos", metric: "treinos" },
  { id: "treinos-50", title: "Rato de academia", text: "50 treinos concluídos", group: "treinos", target: 50, unit: "treinos", metric: "treinos" },
  { id: "treinos-100", title: "Centurião", text: "100 treinos concluídos", group: "treinos", target: 100, unit: "treinos", metric: "treinos" },
  { id: "treinos-250", title: "Lenda do ferro", text: "250 treinos concluídos", group: "treinos", target: 250, unit: "treinos", metric: "treinos" },
  { id: "series-500", title: "Meio milhar", text: "500 séries válidas", group: "treinos", target: 500, unit: "séries", metric: "series" },
  { id: "ton-10", title: "10 toneladas", text: "Somar 10 t de volume levantado", group: "volume", target: 10, unit: "t", metric: "toneladas" },
  { id: "ton-50", title: "50 toneladas", text: "Somar 50 t de volume levantado", group: "volume", target: 50, unit: "t", metric: "toneladas" },
  { id: "ton-100", title: "100 toneladas", text: "Somar 100 t de volume levantado", group: "volume", target: 100, unit: "t", metric: "toneladas" },
  { id: "ton-500", title: "Meio milhão de quilos", text: "Somar 500 t de volume levantado", group: "volume", target: 500, unit: "t", metric: "toneladas" },
  { id: "rec-1", title: "Primeiro recorde", text: "Bater um recorde pessoal", group: "recordes", target: 1, unit: "recorde", metric: "recordes" },
  { id: "rec-10", title: "Quebrando barreiras", text: "10 recordes pessoais", group: "recordes", target: 10, unit: "recordes", metric: "recordes" },
  { id: "rec-25", title: "Máquina de recordes", text: "25 recordes pessoais", group: "recordes", target: 25, unit: "recordes", metric: "recordes" },
  { id: "sem-1", title: "Semana cumprida", text: "Bater a meta semanal", group: "constancia", target: 1, unit: "semana", metric: "semanas" },
  { id: "sem-4", title: "Um mês firme", text: "4 semanas seguidas batendo a meta", group: "constancia", target: 4, unit: "semanas", metric: "semanas" },
  { id: "sem-8", title: "Disciplina", text: "8 semanas seguidas batendo a meta", group: "constancia", target: 8, unit: "semanas", metric: "semanas" },
  {
    id: "sem-12",
    title: "Trimestre de ferro",
    text: "12 semanas seguidas batendo a meta",
    group: "constancia",
    target: 12,
    unit: "semanas",
    metric: "semanas"
  },
  {
    id: "sem-26",
    title: "Meio ano sem falhar",
    text: "26 semanas seguidas batendo a meta",
    group: "constancia",
    target: 26,
    unit: "semanas",
    metric: "semanas"
  },
  { id: "ex-20", title: "Repertório", text: "Treinar 20 exercícios diferentes", group: "especiais", target: 20, unit: "exercícios", metric: "exercicios" },
  { id: "diario-10", title: "Autoconhecimento", text: "Preencher o diário em 10 treinos", group: "especiais", target: 10, unit: "diários", metric: "diarios" },
  { id: "cedo", title: "Madrugador", text: "Começar um treino antes das 7h", group: "especiais", target: 1, unit: "", metric: "cedo" },
  { id: "noite", title: "Coruja", text: "Começar um treino depois das 21h", group: "especiais", target: 1, unit: "", metric: "noite" },
  { id: "longo", title: "Maratona", text: "Um treino de 90 minutos ou mais", group: "especiais", target: 1, unit: "", metric: "longo" }
];

/** Medalhas com data de conquista (quando o valor passou da meta) e progresso das que faltam. */
export function medals(sessions: Session[], weeklyGoal: number, now: number): Medal[] {
  const list = done(sessions);
  const value: Record<Metric, number> = {
    treinos: 0,
    toneladas: 0,
    recordes: 0,
    semanas: 0,
    exercicios: 0,
    diarios: 0,
    cedo: 0,
    noite: 0,
    longo: 0,
    series: 0
  };
  const at: Record<string, number> = {};
  const exercises = new Set<string>();
  const perWeek = new Map<number, number>();
  let run = 0;
  let lastHitWeek = -Infinity;
  const check = (ts: number) => {
    for (const d of DEFS) if (!at[d.id] && value[d.metric] >= d.target) at[d.id] = ts;
  };
  for (const s of list) {
    value.treinos++;
    value.series += sessionSetCount(s);
    value.toneladas += sessionVolume(s) / 1000;
    value.recordes += sessionRecordHits(s, list).length;
    s.items.forEach((it) => it.sets.some((x) => !x.kind) && EXERCISE_MAP[it.exerciseId] && exercises.add(it.exerciseId));
    value.exercicios = exercises.size;
    if (s.diary && Object.keys(s.diary).length) value.diarios++;
    const h = new Date(s.startedAt).getHours();
    if (h < 7) value.cedo = 1;
    if (h >= 21) value.noite = 1;
    if ((s.endedAt! - s.startedAt) / 60000 >= 90) value.longo = 1;
    const w = startOfWeek(s.startedAt);
    const n = (perWeek.get(w) ?? 0) + 1;
    perWeek.set(w, n);
    if (n === weeklyGoal) {
      run = Math.abs(w - lastHitWeek - WEEK) < DAY ? run + 1 : 1;
      lastHitWeek = w;
      value.semanas = Math.max(value.semanas, run);
    }
    check(s.startedAt);
  }
  const streak = weekStreak(sessions, weeklyGoal, now);
  return DEFS.map((d) => {
    const v = d.metric === "semanas" ? Math.max(streak.current, at[d.id] ? d.target : 0) : value[d.metric];
    const shown = d.metric === "toneladas" ? Math.floor(v * 10) / 10 : Math.floor(v);
    return {
      id: d.id,
      title: d.title,
      text: d.text,
      group: d.group,
      achievedAt: at[d.id],
      progress: at[d.id] ? 1 : Math.min(1, v / d.target),
      progressText: at[d.id] ? "Conquistada" : d.unit ? `${shown.toLocaleString("pt-BR")} de ${d.target.toLocaleString("pt-BR")} ${d.unit}` : "Ainda não"
    };
  });
}

/** Medalhas conquistadas exatamente nesta sessão. */
export function medalsFromSession(all: Medal[], session: Session): Medal[] {
  return all.filter((m) => m.achievedAt === session.startedAt);
}

export type MonthGoals = {
  label: string;
  treinos: { value: number; target: number };
  volume: { value: number; lastMonth: number };
  recordes: number;
  diasTreinados: number;
};

function monthStart(ts: number, offset = 0): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth() + offset, 1).getTime();
}

/** Metas do mês: treinos (meta semanal × semanas do mês), volume contra o mês passado e recordes. */
export function monthGoals(sessions: Session[], weeklyGoal: number, now: number): MonthGoals {
  const list = done(sessions);
  const start = monthStart(now);
  const end = monthStart(now, 1);
  const prev = monthStart(now, -1);
  const inMonth = list.filter((s) => s.startedAt >= start && s.startedAt < end);
  const daysInMonth = Math.round((end - start) / DAY);
  // até o mesmo dia do mês passado, para a comparação ser justa
  const dayOfMonth = new Date(now).getDate();
  const lastMonthCut = Math.min(prev + dayOfMonth * DAY, start);
  return {
    label: new Date(now).toLocaleDateString("pt-BR", { month: "long" }),
    treinos: { value: inMonth.length, target: Math.max(1, Math.round((weeklyGoal * daysInMonth) / 7)) },
    volume: {
      value: inMonth.reduce((a, s) => a + sessionVolume(s), 0),
      lastMonth: list.filter((s) => s.startedAt >= prev && s.startedAt < lastMonthCut).reduce((a, s) => a + sessionVolume(s), 0)
    },
    recordes: inMonth.reduce((a, s) => a + sessionRecordHits(s, list).length, 0),
    diasTreinados: new Set(inMonth.map((s) => new Date(s.startedAt).getDate())).size
  };
}
