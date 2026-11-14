"use client";

import { Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { EXERCISE_MAP } from "@/data/exercises";
import { fmt } from "@/lib/progression";
import { allRecords } from "@/lib/records";
import { formatDateShort } from "@/lib/time";
import type { Session } from "@/lib/types";
import { ShareRecord } from "./ShareRecord";

/** Quadro com o recorde de cada exercício (maior carga e 1RM estimado), com card para compartilhar. */
export function RecordsList({ sessions }: { sessions: Session[] }) {
  const list = useMemo(() => allRecords(sessions), [sessions]);
  const [all, setAll] = useState(false);
  if (!list.length) return null;
  const shown = all ? list : list.slice(0, 6);
  return (
    <section className="space-y-3" aria-labelledby="quadro-recordes" data-testid="quadro-recordes">
      <h2 id="quadro-recordes" className="flex items-center gap-2 font-display text-xl font-bold">
        <Trophy size={20} className="text-bronze-light" aria-hidden /> Recordes pessoais
      </h2>
      <ul className="divide-y divide-line">
        {shown.map((r) => {
          const name = EXERCISE_MAP[r.exerciseId]?.name ?? r.exerciseId;
          return (
            <li key={r.exerciseId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{name}</span>
                <span className="text-xs text-muted">
                  {r.maxLoad && `Maior carga ${fmt(r.maxLoad.value)} kg × ${r.maxLoad.reps} em ${formatDateShort(r.maxLoad.date)}`}
                  {r.best1RM && ` · 1RM est. ${fmt(r.best1RM.value)} kg`}
                </span>
              </span>
              {r.maxLoad && (
                <ShareRecord
                  label="Card"
                  className="min-h-9"
                  info={{
                    exerciseName: name,
                    label: "Maior carga",
                    value: `${fmt(r.maxLoad.value)} kg`,
                    detail: `${r.maxLoad.reps} ${r.maxLoad.reps === 1 ? "repetição" : "repetições"}`,
                    previous: r.best1RM ? `1RM estimado: ${fmt(r.best1RM.value)} kg` : undefined,
                    date: r.maxLoad.date
                  }}
                />
              )}
            </li>
          );
        })}
      </ul>
      {list.length > 6 && (
        <button type="button" className="btn-ghost min-h-10 px-2 text-sm" onClick={() => setAll((v) => !v)}>
          {all ? "Mostrar menos" : `Ver todos (${list.length})`}
        </button>
      )}
    </section>
  );
}
