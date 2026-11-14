import { weekStreak } from "./achievements";
import { sessionRecordHits } from "./records";
import { sessionSetCount, sessionVolume } from "./session";
import { startOfWeek } from "./time";
import { weeklySetsByMuscle } from "./volume";
import { MUSCLES, type Muscle, type Session } from "./types";

export type WeekSummary = {
  start: number;
  end: number;
  treinos: number;
  meta: number;
  volume: number;
  series: number;
  minutos: number;
  recordes: number;
  /** segunda a domingo: treinou no dia */
  dias: boolean[];
  topMusculos: { nome: string; series: number }[];
  sequencia: number;
  /** variação do volume em relação à semana anterior (%), quando houver */
  vsAnterior: number | null;
};

/** Resumo da semana (segunda a domingo) que contém `now`. */
export function weekSummary(sessions: Session[], weeklyGoal: number, now: number): WeekSummary {
  const start = startOfWeek(now);
  const end = start + 7 * 86_400_000;
  const all = sessions.filter((s) => s.endedAt);
  const week = all.filter((s) => s.startedAt >= start && s.startedAt < end);
  const prevStart = startOfWeek(start - 3 * 86_400_000);
  const prevVol = all.filter((s) => s.startedAt >= prevStart && s.startedAt < start).reduce((a, s) => a + sessionVolume(s), 0);
  const volume = week.reduce((a, s) => a + sessionVolume(s), 0);
  const dias = Array.from({ length: 7 }, () => false);
  week.forEach((s) => (dias[(new Date(s.startedAt).getDay() + 6) % 7] = true));
  const sets = weeklySetsByMuscle(all, now);
  return {
    start,
    end: end - 1,
    treinos: week.length,
    meta: weeklyGoal,
    volume,
    series: week.reduce((a, s) => a + sessionSetCount(s), 0),
    minutos: Math.round(week.reduce((a, s) => a + (s.endedAt! - s.startedAt), 0) / 60000),
    recordes: week.reduce((a, s) => a + sessionRecordHits(s, all).length, 0),
    dias,
    topMusculos: (Object.entries(sets) as [Muscle, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([m, n]) => ({ nome: MUSCLES[m], series: Math.round(n) })),
    sequencia: weekStreak(sessions, weeklyGoal, now).current,
    vsAnterior: prevVol > 0 && volume > 0 ? Math.round((volume / prevVol - 1) * 100) : null
  };
}
