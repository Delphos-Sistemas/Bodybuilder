"use client";

import clsx from "clsx";
import { ArrowDown, ArrowRight, ArrowUp, TrendingUp } from "lucide-react";
import { EXERCISE_MAP } from "@/data/exercises";
import { fmt } from "@/lib/progression";
import { useData, useStore } from "@/lib/store";
import type { Session } from "@/lib/types";

/** O que muda na ficha para a próxima vez, calculado ao finalizar o treino. */
export function ProgressionSummary({ session }: { session: Session }) {
  const toggle = useStore((s) => s.toggleProgression);
  const workoutExists = useData().workouts.some((w) => w.id === session.workoutId);
  const list = session.progression ?? [];
  if (!list.length) return null;
  const applicable = list.filter((c) => c.toKg !== c.fromKg);
  const applied = applicable.some((c) => c.applied);
  const ups = list.filter((c) => c.kind === "subir").length;

  return (
    <section className="rounded-xl border border-ok/40 bg-ok/5 p-3" aria-labelledby={`prog-${session.id}`} data-testid="progressao">
      <h3 id={`prog-${session.id}`} className="flex items-center gap-2 font-semibold">
        <TrendingUp size={18} className="text-ok" aria-hidden /> Próximo treino
      </h3>
      <p className="mb-2 text-sm text-muted">
        {ups ? `Você bateu a meta em ${ups} ${ups === 1 ? "exercício" : "exercícios"}. ` : ""}
        {applied ? "A ficha já foi atualizada com as novas cargas." : applicable.length ? "Sugestão para a próxima vez:" : "Continue somando repetições:"}
      </p>
      <ul className="space-y-1 text-sm">
        {list.map((c) => {
          const Icon = c.kind === "subir" ? ArrowUp : c.kind === "reduzir" ? ArrowDown : ArrowRight;
          const bodyweight = EXERCISE_MAP[c.exerciseId]?.equipment === "peso-corporal";
          return (
            <li key={c.exerciseId} className="flex items-center gap-2">
              <Icon size={16} aria-hidden className={clsx("shrink-0", c.kind === "subir" ? "text-ok" : c.kind === "reduzir" ? "text-danger" : "text-muted")} />
              <span className="min-w-0 flex-1 truncate">{EXERCISE_MAP[c.exerciseId]?.name ?? c.exerciseId}</span>
              <span className="shrink-0 tabular-nums text-sand">
                {bodyweight || c.toKg === 0 ? (
                  `${c.reps} reps`
                ) : (
                  <>
                    {c.toKg !== c.fromKg && c.fromKg > 0 && <span className="text-muted line-through">{fmt(c.fromKg)}</span>} <strong>{fmt(c.toKg)} kg</strong>{" "}
                    × {c.reps}
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      {applicable.length > 0 && workoutExists && (
        <button type="button" className="btn-ghost mt-2 min-h-10 px-2 text-sm" onClick={() => toggle(session.id)}>
          {applied ? "Desfazer: voltar as cargas antigas na ficha" : "Atualizar a ficha com essas cargas"}
        </button>
      )}
    </section>
  );
}
