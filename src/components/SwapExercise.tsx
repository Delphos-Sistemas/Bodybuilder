"use client";

import { Repeat, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { EXERCISES, EXERCISE_MAP } from "@/data/exercises";
import { substituteOptions } from "@/lib/substitutes";
import { EQUIPMENT, MUSCLES, type Equipment, type Exercise } from "@/lib/types";

/** Aparelho ocupado: escolhe outro exercício que trabalha o mesmo músculo. */
export function SwapExercise({
  exercise,
  equipment,
  exclude,
  canSwap,
  onSwap
}: {
  exercise: Exercise;
  equipment: Equipment[];
  exclude: string[];
  /** false depois de registrar séries válidas */
  canSwap: boolean;
  onSwap: (id: string, inWorkout: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [inWorkout, setInWorkout] = useState(false);
  const all = [...EXERCISES, ...Object.values(EXERCISE_MAP).filter((e) => e.custom)];
  const options = open ? substituteOptions(exercise, all, equipment, exclude) : [];

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="btn-secondary min-h-11 shrink-0 px-3 text-sm"
        onClick={() => setOpen(true)}
        disabled={!canSwap}
        title={canSwap ? "Aparelho ocupado? Troque por outro" : "Já tem série registrada neste exercício"}
      >
        <Repeat size={16} aria-hidden /> Trocar
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        aria-labelledby="trocar-titulo"
        className="m-auto max-h-[90vh] w-[min(94vw,480px)] rounded-2xl bg-transparent p-0 backdrop:bg-black/70"
      >
        <div className="space-y-3 rounded-2xl border border-line bg-graphite p-4 text-parchment">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 id="trocar-titulo" className="font-display text-xl font-bold">
                Trocar {exercise.name}
              </h2>
              <p className="text-sm text-muted">Aparelho ocupado? Estes trabalham {MUSCLES[exercise.primary].toLowerCase()} também.</p>
            </div>
            <button type="button" className="btn-ghost min-h-10 px-2" onClick={() => setOpen(false)} aria-label="Fechar">
              <X size={20} aria-hidden />
            </button>
          </div>
          {options.length ? (
            <ul className="max-h-[50vh] space-y-2 overflow-y-auto" data-testid="opcoes-troca">
              {options.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl border border-line bg-iron p-2 text-left hover:border-bronze"
                    onClick={() => {
                      onSwap(o.id, inWorkout);
                      setOpen(false);
                    }}
                  >
                    <ExerciseThumb id={o.id} className="h-12 w-16 shrink-0" width={64} height={48} />
                    <span className="min-w-0">
                      <span className="block font-medium leading-snug">{o.name}</span>
                      <span className="text-xs text-muted">
                        {EQUIPMENT[o.equipment]}
                        {exercise.substitutions.includes(o.id) ? " · indicado na ficha" : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Nenhum outro exercício deste músculo com os seus equipamentos.</p>
          )}
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" className="h-5 w-5 accent-bronze" checked={inWorkout} onChange={(e) => setInWorkout(e.target.checked)} />
            Trocar também na ficha do treino (para as próximas vezes)
          </label>
        </div>
      </dialog>
    </>
  );
}
