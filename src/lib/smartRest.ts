import type { Exercise, SessionItem, SetLog } from "./types";

/** Exercício multiarticular (usa vários músculos grandes): pede descanso maior. */
export function isCompound(ex: Pick<Exercise, "equipment" | "secondary" | "primary">): boolean {
  if (ex.equipment === "barra" || ex.equipment === "smith") return true;
  const big = ["peito", "costas", "quadriceps", "posteriores", "gluteos"];
  return big.includes(ex.primary) && ex.secondary.length >= 2;
}

/**
 * Descanso inteligente: parte do descanso planejado e ajusta pelo tipo de exercício,
 * pelas repetições (carga pesada pede mais tempo) e pelo esforço (série até a falha).
 * Fica entre 30 s e 5 min, arredondado de 5 em 5 segundos.
 */
export function smartRest(
  planned: Pick<SessionItem["planned"], "restSec" | "repsMin" | "repsMax" | "rir">,
  ex: Pick<Exercise, "equipment" | "secondary" | "primary" | "isometric">,
  set: Pick<SetLog, "reps" | "rir" | "loadKg">
): { sec: number; reason?: string } {
  const base = planned.restSec;
  // descanso curto de propósito (circuito, HIIT): respeita o que a pessoa escolheu
  if (base < 30) return { sec: base };
  const compound = isCompound(ex);
  let adj = 0;
  const why: string[] = [];
  if (!ex.isometric && set.loadKg > 0) {
    if (set.reps <= 5) {
      adj += compound ? 60 : 30;
      why.push("carga pesada");
    } else if (set.reps <= 8 && compound) {
      adj += 30;
      why.push("multiarticular");
    } else if (set.reps >= 15) {
      adj -= 15;
      why.push("muitas reps");
    }
  }
  if (!compound && set.reps > 5 && !ex.isometric) {
    adj -= 15;
    why.push("isolado");
  }
  if (set.rir === 0) {
    adj += 30;
    why.push("falha");
  } else if (set.rir >= planned.rir + 2) {
    adj -= 15;
    why.push("sobrou fôlego");
  }
  const sec = Math.round(Math.min(300, Math.max(30, base + adj)) / 5) * 5;
  if (sec === base) return { sec };
  const diff = sec - base;
  return { sec, reason: `${diff > 0 ? "+" : "−"}${Math.abs(diff)} s: ${why.join(" e ")}` };
}
