"use client";

import { Check, Flame, X } from "lucide-react";
import { fmt } from "@/lib/progression";
import type { WarmupSet } from "@/lib/warmup";

/** Séries de aquecimento sugeridas antes da primeira série pesada. Cada uma é registrada como aquecimento. */
export function WarmupCard({
  plan,
  workKg,
  done,
  onLog,
  onSkip
}: {
  plan: WarmupSet[];
  workKg: number;
  done: number;
  onLog: (w: WarmupSet) => void;
  onSkip: () => void;
}) {
  return (
    <section className="card space-y-2 border-bronze/50" aria-labelledby="aquecimento-titulo" data-testid="aquecimento">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 id="aquecimento-titulo" className="flex items-center gap-1.5 font-semibold">
            <Flame size={18} className="text-bronze-light" aria-hidden /> Aquecimento antes de {fmt(workKg)} kg
          </h2>
          <p className="text-xs text-muted">Cargas leves, poucas repetições, sem cansar. Descanse uns 45 s entre elas.</p>
        </div>
        <button type="button" className="btn-ghost min-h-10 shrink-0 px-2 text-sm" onClick={onSkip}>
          <X size={16} aria-hidden /> Pular
        </button>
      </div>
      <ol className="space-y-1.5">
        {plan.map((w, i) => {
          const ok = i < done;
          return (
            <li key={w.kg} className="flex items-center justify-between gap-2 rounded-xl bg-iron px-3 py-2">
              <span className={ok ? "text-muted line-through" : ""}>
                <strong>{fmt(w.kg)} kg</strong> × {w.reps} <span className="text-xs text-muted">({Math.round(w.pct * 100)}%)</span>
              </span>
              {ok ? (
                <Check size={18} className="text-ok" aria-label="Feito" />
              ) : (
                <button type="button" className="btn-secondary min-h-10 px-3 text-sm" disabled={i !== done} onClick={() => onLog(w)}>
                  Feito
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
