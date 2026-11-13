/** Cálculo do próximo lembrete no fuso horário do usuário. Funções puras (testadas em tests/unit/lembretes.test.ts). */

export type ReminderConfig = {
  treino: { enabled: boolean; time: string; days: number[] };
  agua: { enabled: boolean; start: string; end: string; everyMin: number };
};

export type ReminderKind = "treino" | "agua";
/** dias (AAAA-MM-DD, no fuso do usuário) em que o lembrete do tipo já não precisa tocar */
export type DoneDays = Partial<Record<ReminderKind, string>>;

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validConfig(v: unknown): v is ReminderConfig {
  const c = v as ReminderConfig;
  return (
    !!c &&
    typeof c.treino?.enabled === "boolean" &&
    HHMM.test(c.treino.time) &&
    Array.isArray(c.treino.days) &&
    c.treino.days.length <= 7 &&
    c.treino.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) &&
    typeof c.agua?.enabled === "boolean" &&
    HHMM.test(c.agua.start) &&
    HHMM.test(c.agua.end) &&
    Number.isInteger(c.agua.everyMin) &&
    c.agua.everyMin >= 30 &&
    c.agua.everyMin <= 480
  );
}

export function validTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

type Parts = { y: number; m: number; d: number; hh: number; mm: number; weekday: number };

function partsIn(tz: string, t: number): Parts {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short"
  });
  const p = Object.fromEntries(f.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
  return {
    y: Number(p.year),
    m: Number(p.month),
    d: Number(p.day),
    hh: Number(p.hour),
    mm: Number(p.minute),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday)
  };
}

/** Diferença (ms) entre o relógio local do fuso e o UTC no instante t. */
function offsetAt(tz: string, t: number): number {
  const p = partsIn(tz, t);
  return Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm) - Math.floor(t / 60_000) * 60_000;
}

/** Converte data + hora locais do fuso para o instante UTC (ms). */
export function localToUtc(tz: string, y: number, m: number, d: number, minutes: number): number {
  const guess = Date.UTC(y, m - 1, d, 0, minutes);
  const first = guess - offsetAt(tz, guess);
  // segunda passada acerta as mudanças de horário de verão
  return guess - offsetAt(tz, first);
}

export function localDay(tz: string, t: number): string {
  const p = partsIn(tz, t);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Horários de água do dia, de `start` até `end` (inclusive), a cada `everyMin` minutos. */
export function waterTimes(c: ReminderConfig["agua"]): number[] {
  const out: number[] = [];
  const s = toMin(c.start);
  const e = toMin(c.end);
  for (let t = s; t <= e && out.length < 48; t += c.everyMin) out.push(t);
  return out;
}

/** Próximo lembrete depois de `after` (ms). Sem lembretes ativos, devolve null. */
export function nextReminder(config: ReminderConfig, tz: string, after: number, done: DoneDays = {}): { at: number; kind: ReminderKind } | null {
  let best: { at: number; kind: ReminderKind } | null = null;
  const consider = (at: number, kind: ReminderKind) => {
    if (at > after && (!best || at < best.at)) best = { at, kind };
  };
  const base = partsIn(tz, after);
  for (let i = 0; i < 8; i++) {
    // meio-dia UTC do dia local + i, para descobrir a data e o dia da semana sem tropeçar no fuso
    const noon = Date.UTC(base.y, base.m - 1, base.d + i, 12);
    const dt = new Date(noon);
    const y = dt.getUTCFullYear();
    const m = dt.getUTCMonth() + 1;
    const d = dt.getUTCDate();
    const weekday = dt.getUTCDay();
    const day = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (config.treino.enabled && config.treino.days.includes(weekday) && done.treino !== day) {
      consider(localToUtc(tz, y, m, d, toMin(config.treino.time)), "treino");
    }
    if (config.agua.enabled && done.agua !== day && i < 2) {
      for (const t of waterTimes(config.agua)) consider(localToUtc(tz, y, m, d, t), "agua");
    }
    if (best) break;
  }
  return best;
}

const TREINO = [
  ["Hora do treino", "Hoje é dia de treino. Bora lá?"],
  ["Bora treinar", "Seu treino de hoje está esperando. Abra o app e comece."],
  ["Lembrete de treino", "Constância vence talento. Vamos para o treino de hoje?"],
  ["Dia de treino", "Separe um tempinho: o treino de hoje já está pronto no app."]
] as const;

const AGUA = [
  ["Hora da água", "Beba um copo de água agora."],
  ["Hidratação", "Um copo de água agora ajuda o treino e a recuperação."],
  ["Pausa para a água", "Bebeu água nas últimas horas? Bora um copo."]
] as const;

/** Texto da notificação. A escolha varia com o instante, para não repetir sempre a mesma frase. */
export function reminderMessage(kind: ReminderKind, at: number): { title: string; body: string; url: string; tag: string } {
  const list = kind === "treino" ? TREINO : AGUA;
  const [title, body] = list[Math.floor(at / 60_000) % list.length];
  return { title, body, url: kind === "treino" ? "/treinos" : "/nutricao", tag: `lembrete-${kind}` };
}
