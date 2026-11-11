"use client";

import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useData, useStore } from "@/lib/store";
import { playAlert } from "@/lib/audio";

/** Botão "Iniciar treino" com tratamento de sessão já em andamento. */
export function StartWorkoutButton({ workoutId, className = "btn-primary", label = "Iniciar treino" }: { workoutId: string; className?: string; label?: string }) {
  const router = useRouter();
  const data = useData();
  const startSession = useStore((s) => s.startSession);
  const discardActive = useStore((s) => s.discardActive);
  const settings = useStore((s) => s.settings);
  const [conflict, setConflict] = useState(false);
  const workout = data.workouts.find((w) => w.id === workoutId);
  const empty = !workout || workout.exercises.length === 0;

  const start = () => {
    if (startSession(workoutId)) {
      playAlert("inicio", { sound: settings.audioEnabled, vibrate: settings.vibration, volume: settings.alertVolume });
      router.push("/treino-ativo");
    }
  };

  if (conflict && data.activeSession) {
    return (
      <div className="w-full rounded-xl border border-bronze/50 bg-steel p-3 text-sm" role="alert">
        <p className="mb-2">
          O treino <strong>{data.activeSession.workoutName}</strong> está em andamento.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary min-h-11 flex-1" onClick={() => router.push("/treino-ativo")}>
            Retomar
          </button>
          <button
            type="button"
            className="btn-danger min-h-11 flex-1"
            onClick={() => {
              discardActive();
              setConflict(false);
              start();
            }}
          >
            Descartar e iniciar este
          </button>
          <button type="button" className="btn-ghost min-h-11" onClick={() => setConflict(false)}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      disabled={empty}
      title={empty ? "Adicione exercícios para iniciar" : undefined}
      onClick={() => (data.activeSession ? setConflict(true) : start())}
    >
      <Play size={18} aria-hidden /> {label}
    </button>
  );
}
