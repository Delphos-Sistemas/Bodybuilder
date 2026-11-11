"use client";

import clsx from "clsx";
import { fmt } from "@/lib/progression";
import { MUSCLES, type Muscle, type Session } from "@/lib/types";
import { WEEKLY_SETS_RANGE, weeklySetsByMuscle } from "@/lib/volume";

const SCALE = 26;

/** Séries por grupo muscular na semana atual, com a faixa de referência marcada. */
export function WeeklyVolume({ sessions, now }: { sessions: Session[]; now: number }) {
  const sets = weeklySetsByMuscle(sessions, now);
  const all = (Object.keys(MUSCLES) as Muscle[]).map((m) => ({ m, n: sets[m] ?? 0 })).sort((a, b) => b.n - a.n);
  const rows = all.filter((r) => r.n > 0);
  const none = all.filter((r) => r.n === 0).map((r) => MUSCLES[r.m]);
  const any = rows.length > 0;
  const { min, max } = WEEKLY_SETS_RANGE;

  return (
    <section className="space-y-3" aria-labelledby="volume-semanal" data-testid="volume-semanal">
      <div>
        <h2 id="volume-semanal" className="font-display text-xl font-bold">
          Volume semanal por músculo
        </h2>
        <p className="text-sm text-muted">
          Séries válidas desta semana (segunda a domingo). O músculo principal conta 1 série e os secundários, meia. A faixa marcada ({min} a {max} séries) é
          uma referência comum para hipertrofia, não uma prescrição.
        </p>
      </div>
      {!any ? (
        <p className="rounded-xl border border-line bg-iron p-3 text-sm text-sand">Nenhuma série registrada nesta semana ainda.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ m, n }) => {
            const status = n === 0 ? "sem séries" : n < min ? "abaixo da faixa" : n > max ? "acima da faixa" : "na faixa";
            return (
              <li key={m} className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-2 text-sm">
                <span className="truncate">{MUSCLES[m]}</span>
                <span className="relative h-3 overflow-hidden rounded-full bg-iron" role="img" aria-label={`${MUSCLES[m]}: ${fmt(n)} séries, ${status}`}>
                  <span
                    className="absolute inset-y-0 bg-ok/15"
                    style={{
                      left: `${(min / SCALE) * 100}%`,
                      width: `${((max - min) / SCALE) * 100}%`
                    }}
                  />
                  <span
                    className={clsx("absolute inset-y-0 left-0 rounded-full", n === 0 ? "" : n < min ? "bg-sand/45" : n > max ? "bg-danger/80" : "bg-bronze")}
                    style={{ width: `${Math.min(100, (n / SCALE) * 100)}%` }}
                  />
                </span>
                <span className={clsx("text-right tabular-nums", n >= min && n <= max ? "text-bronze-light" : "text-muted")}>{fmt(n)}</span>
              </li>
            );
          })}
        </ul>
      )}
      {any && none.length > 0 && <p className="text-xs text-muted">Sem séries nesta semana: {none.join(", ")}.</p>}
    </section>
  );
}
