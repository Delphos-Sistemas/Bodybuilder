"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { WEEKDAYS, type Session } from "@/lib/types";
import { todayISO } from "@/lib/time";

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Grade do mês com os dias em que houve treino concluído (e, se houver, os dias em que seguiu o plano alimentar). */
export function TrainingCalendar({ sessions, onPlanDays }: { sessions: Session[]; onPlanDays?: Set<string> }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sessions) m.set(dayKey(new Date(s.startedAt)), (m.get(dayKey(new Date(s.startedAt))) ?? 0) + 1);
    return m;
  }, [sessions]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const today = dayKey(new Date());
  const cells: (number | null)[] = [...Array<null>(first).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  const trained = cells.filter((d) => d && counts.has(dayKey(new Date(year, month, d)))).length;
  const title = cursor.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });

  return (
    <section aria-labelledby="calendario-titulo" className="rounded-2xl border border-line bg-graphite p-4" data-testid="calendario">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" className="btn-ghost min-h-10 px-2" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Mês anterior">
          <ChevronLeft size={18} aria-hidden />
        </button>
        <div className="text-center">
          <h2 id="calendario-titulo" className="font-display text-lg font-bold">
            {title}
          </h2>
          <p className="text-xs text-muted">
            {trained} {trained === 1 ? "dia treinado" : "dias treinados"}
          </p>
        </div>
        <button type="button" className="btn-ghost min-h-10 px-2" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Próximo mês">
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs" role="grid" aria-label={`Dias treinados em ${title}`}>
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-1 text-muted" aria-hidden>
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`v${i}`} aria-hidden />;
          const k = dayKey(new Date(year, month, d));
          const n = counts.get(k) ?? 0;
          const plan = onPlanDays?.has(todayISO(new Date(year, month, d).getTime())) ?? false;
          return (
            <div
              key={k}
              role="gridcell"
              aria-label={`${d}: ${n ? `${n} ${n === 1 ? "treino" : "treinos"}` : "sem treino"}${plan ? ", seguiu o plano alimentar" : ""}`}
              className={clsx(
                "relative flex aspect-square items-center justify-center rounded-lg text-sm",
                n ? "bg-bronze font-semibold text-iron" : "bg-iron text-sand",
                k === today && "ring-2 ring-bronze-light"
              )}
              data-treinado={n ? "sim" : undefined}
              data-plano={plan ? "sim" : undefined}
            >
              {d}
              {plan && <span aria-hidden className={clsx("absolute bottom-1 h-1.5 w-1.5 rounded-full", n ? "bg-iron" : "bg-ok")} />}
            </div>
          );
        })}
      </div>
      {onPlanDays && onPlanDays.size > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ok" /> Seguiu o plano alimentar
        </p>
      )}
    </section>
  );
}
