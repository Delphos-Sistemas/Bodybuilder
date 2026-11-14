"use client";

import { ArrowDown, ArrowUp, Link2, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ExercisePicker } from "@/components/ExercisePicker";
import { ExerciseSheet } from "@/components/ExerciseSheet";
import { Card, EmptyState, Stepper, Toggle } from "@/components/ui";
import { EXERCISE_MAP } from "@/data/exercises";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { uid } from "@/lib/id";
import { DEFAULT_PREP_SEC, DEFAULT_WORK_SEC } from "@/lib/session";
import { useData, useStore } from "@/lib/store";
import type { Workout, WorkoutExercise } from "@/lib/types";

export default function EditarTreinoPage() {
  return (
    <Suspense fallback={<p className="text-muted">Carregando…</p>}>
      <Editor />
    </Suspense>
  );
}

function Editor() {
  const params = useSearchParams();
  const id = params.get("id");
  const data = useData();
  const existing = id ? data.workouts.find((w) => w.id === id) : undefined;

  if (id && !existing) {
    return (
      <EmptyState
        title="Treino não encontrado"
        text="Ele pode ter sido excluído."
        action={
          <Link className="btn-secondary" href="/treinos">
            Voltar aos treinos
          </Link>
        }
      />
    );
  }
  return <EditorForm key={existing?.id ?? "novo"} initial={existing} />;
}

function EditorForm({ initial }: { initial?: Workout }) {
  const router = useRouter();
  const saveWorkout = useStore((s) => s.saveWorkout);
  const [name, setName] = useState(initial?.name ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [items, setItems] = useState<WorkoutExercise[]>(initial?.exercises ?? []);
  const [picker, setPicker] = useState(false);
  const [sheet, setSheet] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const change = (fn: (list: WorkoutExercise[]) => WorkoutExercise[]) => {
    setItems(fn);
    setDirty(true);
  };
  const patch = (uidv: string, p: Partial<WorkoutExercise>) => change((l) => l.map((x) => (x.uid === uidv ? { ...x, ...p } : x)));
  const move = (i: number, dir: -1 | 1) =>
    change((l) => {
      const j = i + dir;
      if (j < 0 || j >= l.length) return l;
      const copy = l.slice();
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const save = () => {
    if (!name.trim()) {
      setError("Dê um nome ao treino.");
      document.getElementById("nome-treino")?.focus();
      return;
    }
    const fixed = items.map((x, i) => ({
      ...x,
      repsMax: Math.max(x.repsMin, x.repsMax),
      // o último exercício não tem com quem fazer supersérie
      superset: x.superset && i < items.length - 1 ? true : undefined
    }));
    saveWorkout({
      id: initial?.id ?? "",
      name: name.trim(),
      notes: notes.trim(),
      exercises: fixed,
      createdAt: initial?.createdAt
    });
    router.push("/treinos");
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{initial ? "Editar treino" : "Novo treino"}</p>
          <h1 className="h1">{name.trim() || "Treino sem nome"}</h1>
        </div>
        <Link href="/treinos" className="btn-ghost">
          Cancelar
        </Link>
      </header>

      <Card className="grid gap-4">
        <div>
          <label htmlFor="nome-treino" className="label">
            Nome do treino
          </label>
          <input
            id="nome-treino"
            className="input"
            maxLength={80}
            value={name}
            placeholder="Ex.: Treino A — Peito e tríceps"
            onChange={(e) => {
              setName(e.target.value);
              setError("");
              setDirty(true);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "erro-nome" : undefined}
          />
          {error && (
            <p id="erro-nome" className="mt-1 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="obs-treino" className="label">
            Observações (opcional)
          </label>
          <textarea
            id="obs-treino"
            className="input min-h-20 py-2"
            maxLength={500}
            value={notes}
            onChange={(e) => (setNotes(e.target.value), setDirty(true))}
          />
        </div>
      </Card>

      <section aria-labelledby="lista-exercicios" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="lista-exercicios" className="font-display text-xl font-bold">
            Exercícios ({items.length})
          </h2>
          <button type="button" className="btn-secondary" onClick={() => setPicker(true)}>
            <Plus size={18} aria-hidden /> Adicionar exercício
          </button>
        </div>
        {items.length === 0 && <EmptyState title="Nenhum exercício ainda" text="Toque em “Adicionar exercício” para montar o treino." />}
        <ol className="space-y-3">
          {items.map((it, i) => {
            const ex = EXERCISE_MAP[it.exerciseId];
            const iso = ex?.isometric;
            return (
              <li key={it.uid}>
                <Card className="space-y-3" data-testid="item-exercicio">
                  <div className="flex items-start gap-3">
                    <button type="button" onClick={() => setSheet(it.exerciseId)} className="shrink-0" aria-label={`Ver ficha de ${ex?.name}`}>
                      <ExerciseThumb id={it.exerciseId} className="h-16 w-[86px]" width={86} height={64} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted">Exercício {i + 1}</p>
                      <h3 className="font-semibold leading-snug">{ex?.name ?? "Exercício removido da biblioteca"}</h3>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        className="btn-ghost min-h-11 px-2"
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                        aria-label={`Mover ${ex?.name} para cima`}
                      >
                        <ArrowUp size={18} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn-ghost min-h-11 px-2"
                        disabled={i === items.length - 1}
                        onClick={() => move(i, 1)}
                        aria-label={`Mover ${ex?.name} para baixo`}
                      >
                        <ArrowDown size={18} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn-ghost min-h-11 px-2 text-danger"
                        onClick={() => change((l) => l.filter((x) => x.uid !== it.uid))}
                        aria-label={`Remover ${ex?.name}`}
                      >
                        <Trash2 size={18} aria-hidden />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Stepper id={`series-${it.uid}`} label="Séries" value={it.sets} min={1} max={20} onChange={(v) => patch(it.uid, { sets: v })} />
                    <Stepper
                      id={`repmin-${it.uid}`}
                      label={iso ? "Tempo mín. (s)" : "Repetições mín."}
                      value={it.repsMin}
                      min={1}
                      max={300}
                      onChange={(v) => patch(it.uid, { repsMin: v })}
                    />
                    <Stepper
                      id={`repmax-${it.uid}`}
                      label={iso ? "Tempo máx. (s)" : "Repetições máx."}
                      value={it.repsMax}
                      min={1}
                      max={300}
                      onChange={(v) => patch(it.uid, { repsMax: v })}
                    />
                    <Stepper
                      id={`carga-${it.uid}`}
                      label="Carga"
                      suffix="kg"
                      step={2.5}
                      value={it.loadKg}
                      min={0}
                      max={1000}
                      onChange={(v) => patch(it.uid, { loadKg: v })}
                    />
                    <Stepper id={`rir-${it.uid}`} label="RIR" value={it.rir} min={0} max={10} onChange={(v) => patch(it.uid, { rir: v })} />
                    <Stepper
                      id={`descanso-${it.uid}`}
                      label="Descanso"
                      suffix="s"
                      step={15}
                      value={it.restSec}
                      min={0}
                      max={1800}
                      onChange={(v) => patch(it.uid, { restSec: v })}
                    />
                    <Stepper
                      id={`exec-${it.uid}`}
                      label="Execução (timer)"
                      suffix="s"
                      step={5}
                      value={it.workSec ?? (iso ? it.repsMax : DEFAULT_WORK_SEC)}
                      min={5}
                      max={900}
                      onChange={(v) => patch(it.uid, { workSec: v })}
                    />
                    <Stepper
                      id={`prep-${it.uid}`}
                      label="Preparo (timer)"
                      suffix="s"
                      step={5}
                      value={it.prepSec ?? DEFAULT_PREP_SEC}
                      min={0}
                      max={300}
                      onChange={(v) => patch(it.uid, { prepSec: v })}
                    />
                    <Stepper
                      id={`drops-${it.uid}`}
                      label="Drop sets no fim"
                      value={it.drops ?? 0}
                      min={0}
                      max={3}
                      onChange={(v) => patch(it.uid, { drops: v || undefined })}
                    />
                  </div>
                  {i < items.length - 1 && (
                    <div className="border-t border-line pt-1">
                      <Toggle
                        id={`super-${it.uid}`}
                        label="Supersérie com o próximo"
                        description={`Faz ${ex?.name ?? "este"} e ${EXERCISE_MAP[items[i + 1].exerciseId]?.name ?? "o próximo"} em sequência, sem descanso entre eles.`}
                        checked={!!it.superset}
                        onChange={(v) => patch(it.uid, { superset: v || undefined })}
                      />
                    </div>
                  )}
                </Card>
                {it.superset && i < items.length - 1 && (
                  <p className="flex items-center justify-center gap-1 py-1 text-xs font-semibold text-bronze-light" aria-hidden>
                    <Link2 size={14} /> supersérie
                  </p>
                )}
              </li>
            );
          })}
        </ol>
        <p className="text-xs text-muted">RIR: repetições em reserva, quantas repetições você ainda conseguiria fazer ao fim da série.</p>
        <p className="text-xs text-muted">Execução e preparo são usados pelo timer guiado no treino: tempo da série, descanso e o aviso para voltar.</p>
      </section>

      <div className="sticky bottom-[88px] z-10 flex gap-2 rounded-2xl border border-line bg-iron/95 p-2 backdrop-blur lg:bottom-4">
        <button type="button" className="btn-primary flex-1" onClick={save}>
          <Save size={18} aria-hidden /> Salvar treino
        </button>
      </div>
      {dirty && <p className="text-center text-xs text-muted">Alterações ainda não salvas.</p>}

      <ExercisePicker
        open={picker}
        onClose={() => setPicker(false)}
        onPick={(exerciseId) =>
          change((l) => [
            ...l,
            {
              uid: uid("we_"),
              exerciseId,
              sets: 3,
              repsMin: EXERCISE_MAP[exerciseId]?.isometric ? 30 : 8,
              repsMax: EXERCISE_MAP[exerciseId]?.isometric ? 45 : 12,
              loadKg: 0,
              rir: 2,
              restSec: 90
            }
          ])
        }
      />
      <ExerciseSheet exerciseId={sheet} onClose={() => setSheet(null)} />
    </div>
  );
}
