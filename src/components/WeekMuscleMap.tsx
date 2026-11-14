"use client";

import Link from "next/link";
import { BACK, FRONT, SILHOUETTE, type Shape } from "@/components/MuscleMap";
import { lastTrainedByMuscle, weeklySetsByMuscle } from "@/lib/volume";
import { MUSCLES, type Muscle, type Session } from "@/lib/types";

// escala de calor: nada → pouco → bom → muito
const LEVELS = [
  { min: 0, color: "#BDB9B2", label: "Nada" },
  { min: 0.5, color: "#F2C6A0", label: "1 a 4 séries" },
  { min: 5, color: "#E08A5A", label: "5 a 9" },
  { min: 10, color: "#B5432A", label: "10 ou mais" }
];

function colorFor(sets: number) {
  let c = LEVELS[0].color;
  for (const l of LEVELS) if (sets >= l.min) c = l.color;
  return c;
}

function Figure({ shapes, sets, title }: { shapes: Shape[]; sets: Partial<Record<Muscle, number>>; title: string }) {
  return (
    <figure className="flex flex-col items-center">
      <svg viewBox="0 0 120 250" className="h-44 w-auto" aria-hidden="true">
        <path d={SILHOUETTE} fill="#D4D1CB" />
        {shapes.map((s) => {
          const fill = s.m ? colorFor(sets[s.m] ?? 0) : "#BDB9B2";
          return s.ellipse ? (
            <ellipse key={s.key} cx={s.ellipse[0]} cy={s.ellipse[1]} rx={s.ellipse[2]} ry={s.ellipse[3]} fill={fill} stroke="#8E8A84" strokeWidth="0.6" />
          ) : (
            <path key={s.key} d={s.d} fill={fill} stroke="#8E8A84" strokeWidth="0.6" />
          );
        })}
      </svg>
      <figcaption className="mt-1 text-xs text-neutral-600">{title}</figcaption>
    </figure>
  );
}

/** Esquecidos: músculos sem nenhuma série na semana, do mais tempo parado para o menos. */
export function forgottenMuscles(sessions: Session[], now: number): { m: Muscle; days: number | null }[] {
  const sets = weeklySetsByMuscle(sessions, now);
  const last = lastTrainedByMuscle(sessions);
  return (Object.keys(MUSCLES) as Muscle[])
    .filter((m) => !(sets[m] ?? 0))
    .map((m) => ({ m, days: last[m] ? Math.floor((now - last[m]!) / 86_400_000) : null }))
    .sort((a, b) => (b.days ?? 9999) - (a.days ?? 9999));
}

/** Boneco com os músculos treinados na semana (segunda a domingo) e os esquecidos. */
export function WeekMuscleMap({ sessions, now, compact }: { sessions: Session[]; now: number; compact?: boolean }) {
  const sets = weeklySetsByMuscle(sessions, now);
  const forgotten = forgottenMuscles(sessions, now);
  const trained = (Object.keys(MUSCLES) as Muscle[]).filter((m) => (sets[m] ?? 0) > 0);
  const label = trained.length
    ? `Treinados nesta semana: ${trained.map((m) => `${MUSCLES[m]} ${Math.round(sets[m]!)} séries`).join(", ")}.`
    : "Nenhum músculo treinado nesta semana ainda.";
  return (
    <section className="space-y-3" aria-labelledby="mapa-semana" data-testid="mapa-semana">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="mapa-semana" className={compact ? "eyebrow" : "font-display text-xl font-bold"}>
          Músculos da semana
        </h2>
        {compact && (
          <Link href="/evolucao" className="text-sm text-bronze-light underline">
            Detalhes
          </Link>
        )}
      </div>
      <div role="img" aria-label={label} className="rounded-xl bg-[#ECEBE7] p-3">
        <div className="flex justify-center gap-6">
          <Figure shapes={FRONT} sets={sets} title="Frente" />
          <Figure shapes={BACK} sets={sets} title="Costas" />
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-neutral-700">
          {LEVELS.map((l) => (
            <span key={l.label} className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: l.color }} /> {l.label}
            </span>
          ))}
        </div>
      </div>
      {forgotten.length > 0 && trained.length > 0 ? (
        <p className="text-sm text-sand" data-testid="esquecidos">
          <strong className="text-bronze-light">Esquecidos:</strong>{" "}
          {forgotten
            .slice(0, compact ? 4 : 14)
            .map(({ m, days }) => `${MUSCLES[m]}${days !== null ? ` (${days === 0 ? "hoje" : days === 1 ? "há 1 dia" : `há ${days} dias`})` : " (nunca)"}`)
            .join(", ")}
          {compact && forgotten.length > 4 ? ` e mais ${forgotten.length - 4}` : ""}.
        </p>
      ) : trained.length === 0 ? (
        <p className="text-sm text-muted">Treine e os músculos trabalhados vão ganhando cor ao longo da semana.</p>
      ) : (
        <p className="text-sm text-ok">Todos os grupos musculares receberam treino nesta semana.</p>
      )}
    </section>
  );
}
