"use client";

import clsx from "clsx";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { EXERCISE_MAP } from "@/data/exercises";
import { sessionSetCount, sessionVolume } from "@/lib/session";
import { useData, useStore } from "@/lib/store";
import { formatClock, formatDate, workoutElapsed } from "@/lib/time";

export default function HistoricoPage() {
  return (
    <Suspense fallback={null}>
      <Historico />
    </Suspense>
  );
}

function Historico() {
  const highlight = useSearchParams().get("sessao");
  const sessions = useData().sessions.filter((s) => s.endedAt);
  const remove = useStore((s) => s.deleteSession);
  const [confirm, setConfirm] = useState<string | null>(null);

  return (
    <div>
      <PageHeader eyebrow={`${sessions.length} ${sessions.length === 1 ? "sessão" : "sessões"}`} title="Histórico" />
      {highlight && sessions.some((s) => s.id === highlight) && (
        <p role="status" className="anim-fade mb-4 rounded-xl border border-ok/40 bg-ok/10 px-4 py-3 text-sm">
          Treino salvo no histórico.
        </p>
      )}
      {sessions.length === 0 ? (
        <EmptyState title="Nenhum treino registrado" text="Quando você concluir ou encerrar um treino, ele aparece aqui com duração, séries, cargas e volume." action={<Link href="/treinos" className="btn-primary">Ir para Treinos</Link>} />
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => {
            const open = s.id === highlight;
            return (
              <li key={s.id}>
                <Card className={clsx(open && "border-ok/60")} data-testid="sessao-historico">
                  <details open={open}>
                    <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-2">
                      <span>
                        <span className="block text-lg font-semibold">{s.workoutName}</span>
                        <span className="text-sm text-muted">
                          {formatDate(s.startedAt)} · {new Date(s.startedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {s.endedManually && " · encerrado manualmente"}
                        </span>
                      </span>
                      <span className="grid grid-cols-3 gap-3 text-right text-sm">
                        <span>
                          <span className="block text-xs text-muted">Duração</span>
                          <span data-testid="duracao">{formatClock(workoutElapsed(s, s.endedAt!))}</span>
                        </span>
                        <span>
                          <span className="block text-xs text-muted">Séries</span>
                          {sessionSetCount(s)}
                        </span>
                        <span>
                          <span className="block text-xs text-muted">Volume</span>
                          {Math.round(sessionVolume(s)).toLocaleString("pt-BR")} kg
                        </span>
                      </span>
                    </summary>
                    <div className="mt-3 space-y-3 border-t border-line pt-3">
                      {s.items.map((it, i) => {
                        const ex = EXERCISE_MAP[it.exerciseId];
                        return (
                          <div key={`${it.exerciseId}-${i}`}>
                            <p className="font-medium">
                              {ex?.name ?? it.exerciseId}
                              {it.skipped && <span className="ml-2 text-xs text-muted">(pulado)</span>}
                            </p>
                            {it.sets.length ? (
                              <ol className="mt-1 space-y-0.5 text-sm text-sand">
                                {it.sets.map((set, k) => (
                                  <li key={k}>
                                    Série {k + 1}: {set.loadKg} kg × {set.reps} {ex?.isometric ? "s" : "reps"} · RIR {set.rir}
                                    {set.pain && <span className="text-danger"> · dor: {set.pain}</span>}
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <p className="text-sm text-muted">Nenhuma série registrada.</p>
                            )}
                          </div>
                        );
                      })}
                      {confirm === s.id ? (
                        <div className="flex gap-2">
                          <button type="button" className="btn-danger min-h-10 flex-1" onClick={() => remove(s.id)}>
                            Confirmar exclusão
                          </button>
                          <button type="button" className="btn-ghost min-h-10 flex-1" onClick={() => setConfirm(null)}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button type="button" className="btn-ghost min-h-10 px-2 text-sm text-danger" onClick={() => setConfirm(s.id)}>
                          <Trash2 size={16} aria-hidden /> Excluir sessão
                        </button>
                      )}
                    </div>
                  </details>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
