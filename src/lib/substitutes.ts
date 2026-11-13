import type { Equipment, Exercise } from "./types";

/**
 * Exercícios para trocar (aparelho ocupado): primeiro as substituições indicadas na ficha,
 * depois outros do mesmo músculo principal. Só com equipamentos que a pessoa tem.
 */
export function substituteOptions(ex: Exercise, all: Exercise[], equipment: Equipment[], exclude: string[] = [], limit = 8): Exercise[] {
  const allowed = (e: Exercise) => !equipment.length || equipment.includes(e.equipment) || e.equipment === "peso-corporal";
  const skip = new Set([ex.id, ...exclude]);
  const byId = new Map(all.map((e) => [e.id, e]));
  const out: Exercise[] = [];
  const push = (e: Exercise | undefined) => {
    if (e && !skip.has(e.id) && allowed(e) && !out.includes(e) && !!e.isometric === !!ex.isometric) out.push(e);
  };
  ex.substitutions.forEach((id) => push(byId.get(id)));
  // mesmo músculo e mesmos secundários primeiro
  const same = all
    .filter((e) => e.primary === ex.primary)
    .sort((a, b) => b.secondary.filter((m) => ex.secondary.includes(m)).length - a.secondary.filter((m) => ex.secondary.includes(m)).length);
  same.forEach(push);
  return out.slice(0, limit);
}
