"use client";

import clsx from "clsx";
import { DIARY_FIELDS } from "@/lib/diary";
import { useStore } from "@/lib/store";
import type { Diary } from "@/lib/types";

/** Diário rápido do treino: toques de 1 a 5, salva na hora. */
export function DiaryForm({ id, diary, highlight }: { id: string; diary?: Diary; highlight?: boolean }) {
  const save = useStore((s) => s.setSessionDiary);
  const d = diary ?? {};
  return (
    <section
      className={clsx("space-y-2 rounded-xl border p-3", highlight ? "border-bronze/60 bg-bronze/5" : "border-line")}
      aria-label="Diário do treino"
      data-testid="diario"
    >
      <h3 className="font-semibold">Diário do treino</h3>
      {highlight && <p className="text-xs text-muted">Leva 5 segundos. Com o tempo, o app mostra se sono e energia mudam seu desempenho.</p>}
      {DIARY_FIELDS.map((f) => (
        <div key={f.key}>
          <p id={`${id}-${f.key}`} className="flex justify-between gap-2 text-sm text-sand">
            <span>{f.label}</span>
            <span className="text-xs text-muted">
              1 {f.low.toLowerCase()} · 5 {f.high.toLowerCase()}
            </span>
          </p>
          <div className="mt-1 flex items-center gap-1.5" role="radiogroup" aria-labelledby={`${id}-${f.key}`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={d[f.key] === n}
                aria-label={`${f.label}: ${n} de 5`}
                className={clsx(
                  "h-10 max-w-14 flex-1 rounded-full border text-sm font-semibold",
                  d[f.key] === n ? "border-bronze bg-bronze text-iron" : "border-line bg-iron text-sand"
                )}
                onClick={() => {
                  const next: Diary = { ...d };
                  if (next[f.key] === n) delete next[f.key];
                  else next[f.key] = n;
                  save(id, next);
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
