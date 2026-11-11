import type { RestState, Session } from "./types";

export function secondsBetween(from: number, to: number): number {
  return Math.max(0, Math.floor((to - from) / 1000));
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return "menos de 1 min";
  const min = Math.round(totalSeconds / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}

/** Segundos restantes do descanso, calculados a partir do horário previsto de término. */
export function restRemaining(rest: RestState | null, now: number): number {
  if (!rest) return 0;
  return Math.max(0, Math.ceil((rest.endsAt - now) / 1000));
}

export function workoutElapsed(session: Pick<Session, "startedAt" | "endedAt">, now: number): number {
  return secondsBetween(session.startedAt, session.endedAt ?? now);
}

export function formatDate(ts: number | string): string {
  const d = typeof ts === "string" ? new Date(`${ts}T12:00:00`) : new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateShort(ts: number | string): string {
  const d = typeof ts === "string" ? new Date(`${ts}T12:00:00`) : new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/** Início da semana (segunda-feira, 00:00) no fuso local. */
export function startOfWeek(now: number): number {
  const d = new Date(now);
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.getTime();
}

export function todayISO(now = Date.now()): string {
  const d = new Date(now);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
