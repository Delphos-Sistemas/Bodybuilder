import type { Equipment, Session, SessionItem, SetLog } from "./types";

export type LastPerformance = { date: number; sets: SetLog[] };

/** Séries registradas na última sessão concluída que teve este exercício. */
export function lastPerformance(sessions: Session[], exerciseId: string, excludeSessionId?: string): LastPerformance | null {
  for (const s of sessions) {
    if (!s.endedAt || s.id === excludeSessionId) continue;
    const sets = s.items.filter((i) => i.exerciseId === exerciseId).flatMap((i) => i.sets.filter((x) => !x.kind));
    if (sets.length) return { date: s.startedAt, sets };
  }
  return null;
}

export type Suggestion = {
  loadKg: number;
  repsTarget: number;
  reason: string;
  kind: "subir" | "manter" | "reduzir";
};

export function loadIncrement(equipment: Equipment): number {
  if (equipment === "peso-corporal") return 0;
  if (equipment === "halteres") return 2;
  return 2.5;
}

/**
 * Progressão dupla: ao completar o topo da faixa de repetições em todas as séries,
 * sem chegar perto da falha (RIR igual ou maior que o planejado), sugere aumentar a carga.
 * É uma regra geral de treino, não uma prescrição individual.
 */
export function suggestNext(planned: SessionItem["planned"], last: LastPerformance | null, equipment: Equipment): Suggestion | null {
  if (!last || !last.sets.length) return null;
  const work = last.sets;
  const lastLoad = Math.max(...work.map((s) => s.loadKg));
  const topSets = work.filter((s) => s.loadKg === lastLoad);
  const allTop = topSets.length >= Math.min(planned.sets, work.length) && topSets.every((s) => s.reps >= planned.repsMax);
  const minRir = Math.min(...topSets.map((s) => s.rir));
  const anyBelow = topSets.some((s) => s.reps < planned.repsMin);
  const inc = loadIncrement(equipment);

  if (allTop && minRir >= planned.rir) {
    if (inc === 0) {
      return {
        loadKg: lastLoad,
        repsTarget: planned.repsMax + 1,
        kind: "subir",
        reason: "Você completou o topo das repetições com folga. Tente uma repetição a mais por série."
      };
    }
    return {
      loadKg: round(lastLoad + inc),
      repsTarget: planned.repsMin,
      kind: "subir",
      reason: `Você fez ${planned.repsMax}+ repetições em todas as séries com RIR ${minRir}. Suba ${fmt(inc)} kg e volte ao início da faixa.`
    };
  }
  if (anyBelow && minRir === 0 && inc > 0 && lastLoad > 0) {
    return {
      loadKg: round(Math.max(0, lastLoad - inc)),
      repsTarget: planned.repsMin,
      kind: "reduzir",
      reason: `Na última vez as repetições ficaram abaixo de ${planned.repsMin} chegando à falha. Reduza ${fmt(inc)} kg para manter a técnica.`
    };
  }
  return {
    loadKg: lastLoad,
    repsTarget: Math.min(planned.repsMax, Math.max(...topSets.map((s) => s.reps)) + 1),
    kind: "manter",
    reason: "Mantenha a carga e tente somar repetições até chegar ao topo da faixa em todas as séries."
  };
}

/** Anilhas por lado da barra (algoritmo guloso com anilhas comuns de academia). */
export function platesPerSide(totalKg: number, barKg: number, plates = [25, 20, 15, 10, 5, 2.5, 1.25]): { plates: number[]; remainder: number } | null {
  if (totalKg < barKg) return null;
  let side = round((totalKg - barKg) / 2);
  const out: number[] = [];
  for (const p of plates) {
    while (side >= p - 1e-9) {
      out.push(p);
      side = round(side - p);
    }
  }
  return { plates: out, remainder: round(side * 2) };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export function fmt(n: number) {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}
