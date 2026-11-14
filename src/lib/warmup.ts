import type { Equipment, Exercise, Session } from "./types";

export type WarmupSet = { kg: number; reps: number; pct: number };

function roundTo(n: number, step: number) {
  return Math.round(n / step) * step;
}

/**
 * Séries de aquecimento antes da carga de trabalho: cargas crescentes e poucas repetições,
 * para preparar sem cansar. Barra: nunca abaixo da barra vazia.
 */
export function warmupPlan(workKg: number, equipment: Equipment, barKg = 20): WarmupSet[] {
  const min = equipment === "halteres" ? 8 : equipment === "barra" ? Math.max(barKg + 10, 30) : 25;
  if (equipment === "peso-corporal" || workKg < min) return [];
  const step = equipment === "halteres" ? 2 : 2.5;
  const steps: [number, number][] =
    workKg >= 80
      ? [
          [0.4, 8],
          [0.6, 5],
          [0.8, 3]
        ]
      : [
          [0.5, 8],
          [0.75, 4]
        ];
  const floor = equipment === "barra" || equipment === "smith" ? barKg : 0;
  const out: WarmupSet[] = [];
  for (const [pct, reps] of steps) {
    const kg = Math.max(floor, roundTo(workKg * pct, step));
    if (kg >= workKg || out.some((w) => w.kg === kg)) continue;
    out.push({ kg, reps, pct });
  }
  return out;
}

/** Sugere aquecimento: primeiro exercício pesado do músculo nesta sessão, antes da primeira série. */
export function needsWarmup(
  session: Session,
  ex: Pick<Exercise, "id" | "primary" | "isometric">,
  exerciseMap: Record<string, Pick<Exercise, "primary"> | undefined>
): boolean {
  if (ex.isometric) return false;
  const i = session.currentIndex;
  const item = session.items[i];
  if (!item || item.sets.length) return false;
  return !session.items.some((it, j) => j !== i && it.sets.some((s) => !s.kind) && exerciseMap[it.exerciseId]?.primary === ex.primary);
}
