"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CustomExerciseForm } from "./CustomExerciseForm";
import { useStore } from "@/lib/store";
import { ExerciseMedia } from "./ExerciseMedia";
import { MuscleMap } from "./MuscleMap";
import { EXERCISE_MAP } from "@/data/exercises";
import { MACHINE_IMAGES } from "@/data/media";
import { EQUIPMENT, MUSCLES } from "@/lib/types";

/** Ficha completa do exercício, em um diálogo modal. Usada na Biblioteca e no Treino ativo. */
export function ExerciseSheet({ exerciseId, onClose, onSelect }: { exerciseId: string | null; onClose: () => void; onSelect?: (id: string) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const exercise = exerciseId ? EXERCISE_MAP[exerciseId] : undefined;
  const removeCustom = useStore((s) => s.deleteCustomExercise);
  useStore((s) => (s.mode === "demo" && s.demo ? s.demo : s.usuario).customExercises); // re-renderiza ao editar
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (exercise && !d.open) d.showModal();
    if (!exercise && d.open) d.close();
  }, [exercise]);

  const machineImg = exercise ? MACHINE_IMAGES[exercise.id] : undefined;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="ficha-titulo"
      className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/70 sm:m-auto sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl"
    >
      {exercise && (
        <div className="anim-sheet flex h-full flex-col overflow-y-auto bg-graphite text-parchment sm:rounded-2xl sm:border sm:border-line">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-graphite/95 px-4 py-3 backdrop-blur">
            <div>
              <p className="eyebrow">
                {MUSCLES[exercise.primary]} · {EQUIPMENT[exercise.equipment]}
              </p>
              <h2 id="ficha-titulo" className="font-display text-2xl font-bold">
                {exercise.name}
              </h2>
            </div>
            <button type="button" className="btn-ghost min-h-11 px-3" onClick={onClose} aria-label="Fechar ficha">
              <X size={22} aria-hidden />
            </button>
          </div>
          <div className="space-y-6 p-4">
            <ExerciseMedia exercise={exercise} variant="large" />

            <section aria-labelledby="ficha-musculos">
              <h3 id="ficha-musculos" className="mb-2 font-semibold">
                Músculos trabalhados
              </h3>
              <MuscleMap primary={exercise.primary} secondary={exercise.secondary} />
              <p className="mt-2 text-sm text-sand">
                Principal: <strong className="text-parchment">{MUSCLES[exercise.primary]}</strong>
                {exercise.secondary.length > 0 && <> · Secundários: {exercise.secondary.map((m) => MUSCLES[m]).join(", ")}</>}
              </p>
            </section>

            {machineImg && (
              <section aria-labelledby="ficha-aparelho">
                <h3 id="ficha-aparelho" className="mb-2 font-semibold">
                  O aparelho
                </h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={machineImg} alt={`Aparelho usado em ${exercise.name}`} className="rounded-xl bg-[#ECEBE7]" />
              </section>
            )}

            {exercise.custom && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-iron p-3 text-sm">
                <span className="mr-auto text-sand">Exercício criado por você.</span>
                <button type="button" className="btn-secondary min-h-10 px-3" onClick={() => setEditing(true)}>
                  Editar
                </button>
                {confirmDelete ? (
                  <button
                    type="button"
                    className="btn-danger min-h-10 px-3"
                    onClick={() => {
                      removeCustom(exercise.id);
                      setConfirmDelete(false);
                      onClose();
                    }}
                  >
                    Confirmar exclusão
                  </button>
                ) : (
                  <button type="button" className="btn-ghost min-h-10 px-3 text-danger" onClick={() => setConfirmDelete(true)}>
                    Excluir
                  </button>
                )}
              </div>
            )}

            {exercise.instructions.length > 0 && (
              <section aria-labelledby="ficha-como">
                <h3 id="ficha-como" className="mb-2 font-semibold">
                  Como fazer
                </h3>
                <ol className="list-decimal space-y-1.5 pl-5 text-sand">
                  {exercise.instructions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </section>
            )}

            {exercise.errors.length > 0 && (
              <section aria-labelledby="ficha-erros">
                <h3 id="ficha-erros" className="mb-2 font-semibold">
                  Erros comuns
                </h3>
                <ul className="list-disc space-y-1.5 pl-5 text-sand">
                  {exercise.errors.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </section>
            )}

            {exercise.substitutions.length > 0 && (
              <section aria-labelledby="ficha-subs">
                <h3 id="ficha-subs" className="mb-2 font-semibold">
                  Substituições
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {exercise.substitutions.map((id) => {
                    const sub = EXERCISE_MAP[id];
                    if (!sub) return null;
                    return (
                      <li key={id}>
                        {onSelect ? (
                          <button type="button" className="chip hover:border-bronze" onClick={() => onSelect(id)}>
                            {sub.name}
                          </button>
                        ) : (
                          <span className="chip">{sub.name}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <p className="rounded-xl border border-line p-3 text-xs text-muted">
              Orientação geral de execução, sem caráter de diagnóstico ou prescrição. Em caso de dor ou condição de saúde, procure um profissional.
            </p>
          </div>
        </div>
      )}
      {exercise?.custom && <CustomExerciseForm open={editing} initial={exercise} onClose={() => setEditing(false)} />}
    </dialog>
  );
}
