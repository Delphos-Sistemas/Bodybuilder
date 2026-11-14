"use client";

import { ExerciseMedia } from "./ExerciseMedia";
import { EQUIPMENT, MUSCLES, type Exercise } from "@/lib/types";

export function ExerciseCard({ exercise, onOpen, action }: { exercise: Exercise; onOpen: (id: string) => void; action?: React.ReactNode }) {
  return (
    <article className="card flex flex-col gap-3 p-3" aria-labelledby={`ex-${exercise.id}`}>
      <ExerciseMedia exercise={exercise} variant="card" />
      <div className="flex flex-1 flex-col gap-1 px-1">
        <h3 id={`ex-${exercise.id}`} className="font-semibold leading-snug">
          {exercise.name}
        </h3>
        <p className="text-sm text-sand">{MUSCLES[exercise.primary]}</p>
        <p className="text-sm text-muted">{EQUIPMENT[exercise.equipment]}</p>
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary min-h-11 flex-1 text-sm" onClick={() => onOpen(exercise.id)}>
          Ver ficha
        </button>
        {action}
      </div>
    </article>
  );
}
