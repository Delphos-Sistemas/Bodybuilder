import { sessionVolume } from "./session";
import type { Diary, Session } from "./types";

export const DIARY_FIELDS: { key: keyof Diary; label: string; low: string; high: string }[] = [
  { key: "nota", label: "Como foi o treino", low: "Ruim", high: "Ótimo" },
  { key: "energia", label: "Energia", low: "Sem energia", high: "Elétrico" },
  { key: "sono", label: "Sono da noite", low: "Péssimo", high: "Ótimo" },
  { key: "dor", label: "Dor ou cansaço muscular", low: "Nenhuma", high: "Muita" }
];

export type DiaryInsight = { key: keyof Diary; text: string; diffPct: number };

/**
 * Compara o desempenho dos treinos com nota alta e baixa em energia, sono e dor.
 * Desempenho = volume da sessão dividido pela média do mesmo treino (assim treino de perna não pesa mais que o de braço).
 * Precisa de pelo menos 2 treinos em cada lado.
 */
export function diaryInsights(sessions: Session[]): DiaryInsight[] {
  const done = sessions.filter((s) => s.endedAt && sessionVolume(s) > 0);
  const byWorkout = new Map<string, number[]>();
  for (const s of done) byWorkout.set(s.workoutId, [...(byWorkout.get(s.workoutId) ?? []), sessionVolume(s)]);
  const rel = (s: Session) => {
    const v = byWorkout.get(s.workoutId)!;
    const avg = v.reduce((a, b) => a + b, 0) / v.length;
    return avg ? sessionVolume(s) / avg : 1;
  };
  const out: DiaryInsight[] = [];
  const names: Record<string, [string, string]> = {
    energia: ["com energia alta", "com energia baixa"],
    sono: ["depois de dormir bem", "depois de dormir mal"],
    dor: ["com pouca dor", "com muita dor"]
  };
  for (const key of ["energia", "sono", "dor"] as const) {
    const withV = done.filter((s) => s.diary?.[key]);
    const good = withV.filter((s) => (key === "dor" ? s.diary![key]! <= 2 : s.diary![key]! >= 4));
    const bad = withV.filter((s) => (key === "dor" ? s.diary![key]! >= 4 : s.diary![key]! <= 2));
    if (good.length < 2 || bad.length < 2) continue;
    const m = (l: Session[]) => l.reduce((a, s) => a + rel(s), 0) / l.length;
    const diff = Math.round((m(good) / m(bad) - 1) * 100);
    const [g, b] = names[key];
    out.push({
      key,
      diffPct: diff,
      text:
        Math.abs(diff) < 3
          ? `Treinando ${g} ou ${b}, seu volume ficou parecido.`
          : diff > 0
            ? `Treinando ${g}, você levantou ${diff}% mais volume do que ${b}.`
            : `Curioso: treinando ${b}, você levantou ${-diff}% mais volume do que ${g}.`
    });
  }
  return out;
}

/** Médias do diário nos últimos treinos preenchidos. */
export function diaryAverages(sessions: Session[], last = 10): Partial<Record<keyof Diary, number>> & { count: number } {
  const list = sessions.filter((s) => s.endedAt && s.diary && Object.keys(s.diary).length).slice(0, last);
  const out: Partial<Record<keyof Diary, number>> & { count: number } = { count: list.length };
  for (const f of DIARY_FIELDS) {
    const v = list.map((s) => s.diary![f.key]).filter((x): x is number => !!x);
    if (v.length) out[f.key] = Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10;
  }
  return out;
}
