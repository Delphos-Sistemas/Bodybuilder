"use client";

import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { StartWorkoutButton } from "@/components/StartWorkout";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { EXERCISE_MAP } from "@/data/exercises";
import { TEMPLATE_GOALS, TEMPLATES, workoutsFromTemplate, type TemplateGoal } from "@/data/templates";
import clsx from "clsx";
import { useData, useStore } from "@/lib/store";
import { formatDuration } from "@/lib/time";
import { estimateMinutes } from "@/lib/session";

export default function TreinosPage() {
  const data = useData();
  const addWorkouts = useStore((s) => s.addWorkouts);
  const duplicate = useStore((s) => s.duplicateWorkout);
  const remove = useStore((s) => s.deleteWorkout);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [goal, setGoal] = useState<TemplateGoal | "">("");
  const templates = goal ? TEMPLATES.filter((t) => t.goal === goal) : TEMPLATES;

  const applyTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id)!;
    addWorkouts(workoutsFromTemplate(t, Date.now()));
    setNotice(`${t.days.length === 1 ? "Treino criado" : `${t.days.length} treinos criados`} a partir do modelo ${t.name}. Ajuste as cargas antes de começar.`);
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Seus treinos" title="Treinos">
        <Link href="/treinos/editar?novo=1" className="btn-primary">
          <Plus size={18} aria-hidden /> Criar do zero
        </Link>
      </PageHeader>

      {notice && (
        <p role="status" className="anim-fade rounded-xl border border-ok/40 bg-ok/10 px-4 py-3 text-sm">
          {notice}
        </p>
      )}

      <section aria-labelledby="meus-treinos">
        <h2 id="meus-treinos" className="sr-only">
          Meus treinos
        </h2>
        {data.workouts.length === 0 ? (
          <EmptyState title="Você ainda não tem treinos" text="Crie um treino do zero ou comece por um dos modelos abaixo. Tudo pode ser editado depois." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {data.workouts.map((w) => (
              <li key={w.id}>
                <Card className="flex h-full flex-col gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{w.name}</h3>
                    <p className="text-sm text-muted">
                      {w.exercises.length} {w.exercises.length === 1 ? "exercício" : "exercícios"} · cerca de {formatDuration(estimateMinutes(w) * 60)}
                    </p>
                  </div>
                  <p className="line-clamp-2 text-sm text-sand">
                    {w.exercises
                      .map((e) => EXERCISE_MAP[e.exerciseId]?.name)
                      .filter(Boolean)
                      .join(" · ") || "Nenhum exercício adicionado."}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <StartWorkoutButton workoutId={w.id} className="btn-primary min-h-11 flex-1" />
                    <Link href={`/treinos/editar?id=${w.id}`} className="btn-secondary min-h-11" aria-label={`Editar ${w.name}`}>
                      <Pencil size={16} aria-hidden /> Editar
                    </Link>
                    <button type="button" className="btn-secondary min-h-11" onClick={() => duplicate(w.id)} aria-label={`Duplicar ${w.name}`}>
                      <Copy size={16} aria-hidden /> Duplicar
                    </button>
                    <button type="button" className="btn-ghost min-h-11 text-danger" onClick={() => setConfirm(w.id)} aria-label={`Excluir ${w.name}`}>
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                  {confirm === w.id && (
                    <div role="alert" className="rounded-xl border border-danger/50 p-3 text-sm">
                      <p className="mb-2">Excluir “{w.name}”? O histórico de sessões já feitas continua salvo.</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn-danger min-h-10 flex-1"
                          onClick={() => {
                            remove(w.id);
                            setConfirm(null);
                          }}
                        >
                          Excluir
                        </button>
                        <button type="button" className="btn-ghost min-h-10 flex-1" onClick={() => setConfirm(null)}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="modelos">
        <h2 id="modelos" className="font-display text-2xl font-bold">
          Treinos prontos
        </h2>
        <p className="mb-3 text-sm text-muted">Escolha pelo seu objetivo. O modelo vira treinos seus, e você pode editar tudo depois.</p>
        <div className="mb-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Objetivo do treino pronto">
          {([["", "Todos"], ...Object.entries(TEMPLATE_GOALS)] as [TemplateGoal | "", string][]).map(([k, label]) => (
            <button
              key={k || "todos"}
              type="button"
              role="radio"
              aria-checked={goal === k}
              className={clsx("chip", goal === k && "chip-on")}
              onClick={() => setGoal(k)}
            >
              {label}
            </button>
          ))}
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="modelos">
          {templates.map((t) => (
            <li key={t.id}>
              <Card className="flex h-full flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ok">{TEMPLATE_GOALS[t.goal]}</p>
                <h3 className="text-lg font-semibold">{t.name}</h3>
                <p className="text-xs text-bronze-light">
                  {t.daysPerWeek} · {t.level}
                </p>
                <p className="text-sm text-sand">{t.description}</p>
                <ul className="text-sm text-muted">
                  {t.days.map((d) => (
                    <li key={d.name}>• {d.name}</li>
                  ))}
                </ul>
                <button type="button" className="btn-secondary mt-auto min-h-11" onClick={() => applyTemplate(t.id)}>
                  Usar modelo {t.name}
                </button>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
