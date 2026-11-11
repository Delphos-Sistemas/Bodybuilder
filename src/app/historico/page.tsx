"use client";

import clsx from "clsx";
import { Trash2, Trophy } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ShareSession } from "@/components/ShareSession";
import { TrainingCalendar } from "@/components/TrainingCalendar";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { EXERCISE_MAP } from "@/data/exercises";
import { sessionSetCount, sessionVolume } from "@/lib/session";
import { sessionRecordHits } from "@/lib/records";
import { useData, useStore } from "@/lib/store";
import { SET_KINDS } from "@/lib/types";
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
  const data = useData();
  const all = data.sessions;
  const onPlanDays = useMemo(
    () =>
      new Set(
        Object.entries(data.nutrition?.days ?? {})
          .filter(([, d]) => d.onPlan)
          .map(([k]) => k)
      ),
    [data.nutrition]
  );
  const sessions = useMemo(() => all.filter((s) => s.endedAt), [all]);
  const records = useMemo(() => new Map(sessions.map((s) => [s.id, sessionRecordHits(s, sessions)])), [sessions]);
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
        <EmptyState
          title="Nenhum treino registrado"
          text="Quando você concluir ou encerrar um treino, ele aparece aqui com duração, séries, cargas e volume."
          action={
            <Link href="/treinos" className="btn-primary">
              Ir para Treinos
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <TrainingCalendar sessions={sessions} onPlanDays={onPlanDays} />
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
                            {formatDate(s.startedAt)} ·{" "}
                            {new Date(s.startedAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                            {s.endedManually && " · encerrado manualmente"}
                          </span>
                          {(records.get(s.id)?.length ?? 0) > 0 && (
                            <span className="mt-1 flex items-center gap-1 text-sm font-semibold text-bronze-light" data-testid="recordes-sessao">
                              <Trophy size={14} aria-hidden />
                              {records.get(s.id)!.length} {records.get(s.id)!.length === 1 ? "recorde pessoal" : "recordes pessoais"}
                            </span>
                          )}
                          {s.notes && <span className="mt-1 block line-clamp-1 text-sm italic text-sand">“{s.notes}”</span>}
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
                                      {set.kind ? SET_KINDS[set.kind] : `Série ${it.sets.slice(0, k + 1).filter((x) => !x.kind).length}`}: {set.loadKg} kg ×{" "}
                                      {set.reps} {ex?.isometric ? "s" : "reps"} · RIR {set.rir}
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
                        <SessionNotes id={s.id} notes={s.notes} />
                        <ShareSession session={s} records={records.get(s.id) ?? []} />
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
        </div>
      )}
    </div>
  );
}

function SessionNotes({ id, notes }: { id: string; notes?: string }) {
  const save = useStore((s) => s.setSessionNotes);
  const [value, setValue] = useState(notes ?? "");
  const [saved, setSaved] = useState(false);
  return (
    <div>
      <label htmlFor={`nota-${id}`} className="label">
        Anotações da sessão
      </label>
      <textarea
        id={`nota-${id}`}
        className="input min-h-20 py-2"
        maxLength={1000}
        placeholder="Como foi o treino? Sono, energia, ajustes para a próxima vez…"
        value={value}
        onChange={(e) => (setValue(e.target.value), setSaved(false))}
        onBlur={() => {
          if (value.trim() !== (notes ?? "")) {
            save(id, value);
            setSaved(true);
          }
        }}
      />
      {saved && (
        <p role="status" className="mt-1 text-xs text-ok">
          Anotação salva.
        </p>
      )}
    </div>
  );
}
