"use client";

import clsx from "clsx";
import { Check, ChevronDown, Flag, SkipForward, Square, Timer, BookOpen, Trophy, Link2, Brain } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { ExerciseSheet } from "@/components/ExerciseSheet";
import { GuidedTimer } from "@/components/GuidedTimer";
import { MusicPlayer } from "@/components/MusicPlayer";
import { EmptyState, ProgressBar, Stepper } from "@/components/ui";
import { EXERCISE_MAP } from "@/data/exercises";
import { playAlert } from "@/lib/audio";
import { currentItem, dropCount, dropsPending, isItemDone, isSessionComplete, nextStep, sessionSetCount, supersetRange, workingSets } from "@/lib/session";
import { SwapExercise } from "@/components/SwapExercise";
import { WarmupCard } from "@/components/WarmupCard";
import { needsWarmup, warmupPlan } from "@/lib/warmup";
import { loadIncrement } from "@/lib/progression";
import { estimate1RM, exerciseRecords, recordCardInfo, setRecordHits } from "@/lib/records";
import { ShareRecord } from "@/components/ShareRecord";
import type { RecordCardInfo } from "@/lib/shareCard";
import { useData, useStore } from "@/lib/store";
import { fmt, lastPerformance, platesPerSide, suggestNext } from "@/lib/progression";
import { formatClock, formatDateShort, restRemaining, secondsBetween, workoutElapsed } from "@/lib/time";
import { useNow } from "@/lib/useHydrated";
import { EQUIPMENT, MUSCLES, PHASES, SET_KINDS, type SetKind } from "@/lib/types";

export default function TreinoAtivoPage() {
  const router = useRouter();
  const data = useData();
  const session = data.activeSession;
  const store = useStore();
  const { settings } = store;
  const now = useNow(250);
  const [sheet, setSheet] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [flash, setFlash] = useState(0);
  const [showPain, setShowPain] = useState(false);
  const [form, setForm] = useState<{
    loadKg: number;
    reps: number;
    rir: number;
    pain: string;
    kind: SetKind | "";
  }>({ loadKg: 0, reps: 0, rir: 2, pain: "", kind: "" });
  const [record, setRecord] = useState<{ text: string; info: RecordCardInfo } | null>(null);
  const alertedRest = useRef<number | null>(null);

  const item = session ? currentItem(session) : undefined;
  const exercise = item ? EXERCISE_MAP[item.exerciseId] : undefined;
  const setsDone = item ? workingSets(item.sets).length : 0;
  const extras = item ? item.sets.filter((s) => s.kind) : [];
  const formKey = `${session?.id}:${session?.currentIndex}:${item?.sets.length ?? 0}`;
  const last = item ? lastPerformance(data.sessions, item.exerciseId) : null;
  // semana pesada ou de alívio da periodização: vale a carga planejada da semana, não a sugestão
  const phaseLoad = session?.phase === "pesada" || session?.phase === "alivio";
  const suggestion = item && exercise && !phaseLoad ? suggestNext(item.planned, last, exercise.equipment) : null;
  const [barKg, setBarKg] = useState(20);
  const [skipWarm, setSkipWarm] = useState<string>("");
  const pendingDrops = item ? dropsPending(item) : 0;

  // preenche o formulário com a última série registrada ou com o planejado
  useEffect(() => {
    if (!item) return;
    const prev = workingSets(item.sets).at(-1);
    if (dropsPending(item) > 0 && exercise) {
      // drop set: tira uns 20% da última carga e vai até a falha
      const last = item.sets.at(-1)?.loadKg ?? prev?.loadKg ?? item.planned.loadKg;
      const step = loadIncrement(exercise.equipment) || 2.5;
      setForm({ loadKg: Math.max(0, Math.round((last * 0.8) / step) * step), reps: prev?.reps ?? item.planned.repsMin, rir: 0, pain: "", kind: "drop" });
      setShowPain(false);
      return;
    }
    setForm({
      loadKg: prev?.loadKg ?? suggestion?.loadKg ?? item.planned.loadKg,
      reps: prev?.reps ?? suggestion?.repsTarget ?? item.planned.repsMax,
      rir: item.planned.rir,
      pain: "",
      kind: ""
    });
    setShowPain(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey]);

  // mantém a tela acesa durante o treino, quando o navegador permite
  useEffect(() => {
    if (!session) return;
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & {
      wakeLock?: {
        request: (t: "screen") => Promise<{ release: () => Promise<void> }>;
      };
    };
    const request = () =>
      nav.wakeLock
        ?.request("screen")
        .then((l) => (lock = l))
        .catch(() => undefined);
    void request();
    const onVis = () => document.visibilityState === "visible" && void request();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      void lock?.release().catch(() => undefined);
    };
  }, [session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const rest = session?.rest ?? null;
  const remaining = restRemaining(rest, now);

  // alerta de fim do descanso (uma vez por descanso)
  useEffect(() => {
    if (!rest || remaining > 0 || alertedRest.current === rest.endsAt) return;
    alertedRest.current = rest.endsAt;
    // se o descanso terminou há muito tempo (app fechado), não toca o alerta atrasado
    if (now - rest.endsAt < 30_000) {
      playAlert("fim-descanso", {
        sound: settings.audioEnabled,
        vibrate: settings.vibration,
        volume: settings.alertVolume
      });
    }
    store.endRest();
  }, [rest, remaining, now, settings, store]);

  if (!session) {
    return (
      <EmptyState
        title="Nenhum treino em andamento"
        text="Escolha um treino para começar. Se você fechou o app no meio de uma sessão, ela aparece aqui automaticamente."
        action={
          <Link href="/treinos" className="btn-primary">
            Escolher treino
          </Link>
        }
      />
    );
  }

  const total = workoutElapsed(session, now);
  const exerciseTime = item?.startedAt ? secondsBetween(item.startedAt, now) : 0;
  const complete = isSessionComplete(session);
  const totalSets = session.items.reduce((a, it) => a + (it.skipped ? workingSets(it.sets).length : it.planned.sets), 0);
  const iso = exercise?.isometric;
  const [gA, gB] = item ? supersetRange(session.items, session.currentIndex) : [0, 0];
  const partners =
    gB > gA
      ? session.items
          .slice(gA, gB + 1)
          .map((it, k) => ({ it, k: gA + k }))
          .filter(({ k }) => k !== session.currentIndex)
      : [];
  const workKg = item ? (suggestion?.loadKg ?? item.planned.loadKg) : 0;
  const warmKey = `${session.id}:${session.currentIndex}`;
  const warmups = item ? item.sets.filter((x) => x.kind === "aquecimento").length : 0;
  const warmPlan =
    item && exercise && settings.autoWarmup !== false && skipWarm !== warmKey && setsDone === 0 && (warmups > 0 || needsWarmup(session, exercise, EXERCISE_MAP))
      ? warmupPlan(workKg, exercise.equipment, barKg)
      : [];
  const step = nextStep(session);

  const finish = (manual: boolean) => {
    const id = store.finish(manual);
    playAlert("encerramento", {
      sound: settings.audioEnabled,
      vibrate: settings.vibration,
      volume: settings.alertVolume
    });
    router.push(id ? `/historico?sessao=${id}` : "/historico");
  };

  const logSet = (repsOverride?: number) => {
    // o aviso de recorde fica na tela até a próxima série (dá tempo de compartilhar)
    setRecord(null);
    if (item && !form.kind) {
      // recorde em relação ao histórico e às séries anteriores desta sessão
      const history = exerciseRecords(data.sessions, item.exerciseId);
      if (history.maxLoad) {
        const before = exerciseRecords([...data.sessions, { ...session, endedAt: now }], item.exerciseId);
        const hits = setRecordHits({ loadKg: form.loadKg, reps: repsOverride ?? form.reps }, before, item.exerciseId);
        if (hits.length) {
          const h = hits.find((x) => x.type === "carga") ?? hits[0];
          const reps = repsOverride ?? form.reps;
          setRecord({
            text:
              h.type === "carga"
                ? `Novo recorde de carga: ${fmt(h.value)} kg (antes ${fmt(h.previous ?? 0)} kg).`
                : `Novo recorde de força: 1RM estimado de ${fmt(h.value)} kg (antes ${fmt(h.previous ?? 0)} kg).`,
            info: recordCardInfo(h, exercise?.name ?? item.exerciseId, now, `${fmt(form.loadKg)} kg × ${reps}`)
          });
          if (settings.vibration && "vibrate" in navigator) navigator.vibrate?.([120, 60, 120, 60, 240]);
        }
      }
    }
    store.logSet({
      loadKg: form.loadKg,
      reps: repsOverride ?? form.reps,
      rir: form.rir,
      ...(form.kind ? { kind: form.kind } : {}),
      ...(form.pain.trim() ? { pain: form.pain.trim() } : {})
    });
    setFlash((f) => f + 1);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Cronômetros */}
      <section aria-label="Tempos do treino" className="grid grid-cols-3 gap-2 text-center">
        <div className="card p-3">
          <p className="text-xs text-muted">Treino</p>
          <p className="font-display text-2xl font-bold tabular-nums" data-testid="tempo-treino">
            {formatClock(total)}
          </p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-muted">Exercício</p>
          <p className="font-display text-2xl font-bold tabular-nums">{formatClock(exerciseTime)}</p>
        </div>
        <div className={clsx("card p-3", rest && "border-bronze")}>
          <p className="text-xs text-muted">Descanso</p>
          <p className={clsx("font-display text-2xl font-bold tabular-nums", rest ? "text-bronze-light" : "text-muted")} data-testid="tempo-descanso">
            {rest ? formatClock(remaining) : "--:--"}
          </p>
        </div>
      </section>

      <div>
        <div className="mb-1 flex justify-between gap-2 text-xs text-muted">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {session.workoutName}
            {session.phase && session.phase !== "base" && (
              <span className="whitespace-nowrap rounded-full border border-bronze/60 px-2 py-0.5 text-bronze-light" data-testid="fase-ciclo">
                Semana {PHASES[session.phase].toLowerCase()}
              </span>
            )}
          </span>
          <span className="shrink-0">
            {sessionSetCount(session)} de {totalSets} séries
          </span>
        </div>
        <ProgressBar value={totalSets ? sessionSetCount(session) / totalSets : 0} label="Progresso do treino" />
      </div>

      {/* Lista de exercícios da sessão */}
      <nav aria-label="Exercícios da sessão" className="-mx-4 overflow-x-auto px-4">
        <ol className="flex gap-2 pb-1">
          {session.items.map((it, i) => {
            const ex = EXERCISE_MAP[it.exerciseId];
            const current = i === session.currentIndex;
            return (
              <li key={`${it.exerciseId}-${i}`}>
                <button
                  type="button"
                  onClick={() => store.goTo(i)}
                  aria-current={current ? "step" : undefined}
                  className={clsx(
                    "flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm",
                    current ? "border-bronze bg-bronze/15 text-bronze-light" : isItemDone(it) ? "border-line text-muted line-through" : "border-line text-sand"
                  )}
                >
                  {isItemDone(it) && !it.skipped && <Check size={14} aria-hidden />}
                  {i + 1}. {ex?.name ?? it.exerciseId}
                  {it.planned.superset && i + 1 < session.items.length && (
                    <Link2 size={14} className="text-bronze-light" aria-label="em supersérie com o próximo" />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {exercise && item && (
        <GuidedTimer
          item={item}
          index={session.currentIndex}
          exercise={exercise}
          rest={rest}
          restLeft={remaining}
          now={now}
          complete={complete}
          upcoming={session.items.map((it) => EXERCISE_MAP[it.exerciseId]).filter(Boolean)}
          step={step}
          onLogSet={(r) => logSet(r)}
        />
      )}

      {complete ? (
        <section className="card anim-fade space-y-3 border-ok/50 text-center" aria-live="polite">
          <p className="eyebrow text-ok">Tudo feito</p>
          <h1 className="h1">Todas as séries concluídas</h1>
          <p className="text-sand">
            {sessionSetCount(session)} séries em {formatClock(total)}. Finalize para salvar no histórico.
          </p>
          <button type="button" className="btn-primary w-full" onClick={() => finish(false)}>
            <Flag size={18} aria-hidden /> Finalizar e salvar treino
          </button>
        </section>
      ) : (
        exercise &&
        item && (
          <>
            <section aria-labelledby="exercicio-atual" className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">
                    Exercício {session.currentIndex + 1} de {session.items.length} · {MUSCLES[exercise.primary]} · {EQUIPMENT[exercise.equipment]}
                  </p>
                  <h1 id="exercicio-atual" className="font-display text-2xl font-bold leading-tight sm:text-3xl">
                    {exercise.name}
                  </h1>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                  <button type="button" className="btn-secondary min-h-11 shrink-0 px-3 text-sm" onClick={() => setSheet(exercise.id)}>
                    <BookOpen size={16} aria-hidden /> Ficha
                  </button>
                  <SwapExercise
                    exercise={exercise}
                    equipment={data.profile.equipment}
                    exclude={session.items.map((it) => it.exerciseId)}
                    canSwap={setsDone === 0}
                    onSwap={(id, inWorkout) => store.swapExercise(id, inWorkout)}
                  />
                </div>
              </div>
              {item.swappedFrom && (
                <p className="text-xs text-muted" data-testid="trocado">
                  Trocado de {EXERCISE_MAP[item.swappedFrom]?.name ?? item.swappedFrom}.
                </p>
              )}
              {partners.length > 0 && (
                <p className="flex items-center gap-1.5 rounded-xl border border-bronze/50 bg-bronze/10 px-3 py-2 text-sm" data-testid="superserie">
                  <Link2 size={16} className="shrink-0 text-bronze-light" aria-hidden />
                  <span>
                    <strong>Supersérie</strong> com {partners.map(({ it }) => EXERCISE_MAP[it.exerciseId]?.name ?? it.exerciseId).join(" e ")}. Faça uma série
                    de cada, sem descanso entre eles; o descanso vem no fim da rodada.
                  </span>
                </p>
              )}
              <ExerciseMedia exercise={exercise} variant="large" />
              <p className="text-sm text-sand">
                Meta: {item.planned.sets} séries{item.planned.drops ? ` + ${item.planned.drops} drop${item.planned.drops > 1 ? "s" : ""}` : ""} ·{" "}
                {item.planned.repsMin}–{item.planned.repsMax} {iso ? "segundos" : "repetições"}
                {item.planned.loadKg ? ` · ${fmt(item.planned.loadKg)} kg` : ""} · RIR {item.planned.rir} · descanso {item.planned.restSec} s
              </p>
              {last && (
                <div className="rounded-xl border border-line bg-iron p-3 text-sm" data-testid="ultima-vez">
                  <p>
                    <span className="text-muted">Última vez ({formatDateShort(last.date)}):</span>{" "}
                    {last.sets.map((st) => `${fmt(st.loadKg)} kg × ${st.reps}`).join(" · ")}
                  </p>
                  {suggestion && (
                    <p className={clsx("mt-1", suggestion.kind === "subir" ? "text-ok" : suggestion.kind === "reduzir" ? "text-danger" : "text-sand")}>
                      <strong>
                        Sugestão:{" "}
                        {exercise.equipment === "peso-corporal"
                          ? `${suggestion.repsTarget} ${iso ? "s" : "repetições"}`
                          : `${fmt(suggestion.loadKg)} kg × ${suggestion.repsTarget}`}
                        .
                      </strong>{" "}
                      <span className="text-muted">{suggestion.reason}</span>
                    </p>
                  )}
                </div>
              )}
            </section>

            {warmPlan.length > 0 && (
              <WarmupCard
                plan={warmPlan}
                workKg={workKg}
                done={warmups}
                onSkip={() => setSkipWarm(warmKey)}
                onLog={(w) => store.logSet({ loadKg: w.kg, reps: w.reps, rir: 4, kind: "aquecimento" })}
              />
            )}

            <div aria-live="polite">
              {record && (
                <div
                  className="anim-fade flex flex-wrap items-center gap-2 rounded-xl border border-bronze bg-bronze/15 px-3 py-2 text-sm font-semibold text-bronze-light"
                  data-testid="recorde"
                >
                  <Trophy size={18} aria-hidden /> <span className="min-w-0 flex-1">{record.text}</span>
                  <ShareRecord info={record.info} label="Compartilhar" className="min-h-9" />
                </div>
              )}
            </div>

            {/* Painel de série: altura fixa para os botões não mudarem de lugar */}
            <section aria-labelledby="serie-atual" className="card space-y-4">
              <div>
                <h2 id="serie-atual" className="text-lg font-semibold">
                  {pendingDrops > 0
                    ? `Drop set ${dropCount(item.sets) + 1} de ${item.planned.drops}`
                    : `Série ${Math.min(setsDone + 1, item.planned.sets)} de ${item.planned.sets}`}
                </h2>
                {pendingDrops > 0 && (
                  <p className="text-sm text-bronze-light" data-testid="aviso-drop">
                    Sem descanso: tire uns 20% da carga e vá até a falha.
                  </p>
                )}
                <ol className="mt-1 flex gap-1.5" aria-label="Séries concluídas">
                  {Array.from({ length: item.planned.sets }, (_, i) => (
                    <li
                      key={i}
                      className={clsx("h-2.5 w-7 rounded-full", i < setsDone ? "bg-ok" : "bg-steel")}
                      aria-label={i < setsDone ? `Série ${i + 1} concluída` : `Série ${i + 1} pendente`}
                    />
                  ))}
                </ol>
                {extras.length > 0 && (
                  <p className="mt-1 text-xs text-muted" data-testid="series-extras">
                    Extras:{" "}
                    {(Object.keys(SET_KINDS) as SetKind[])
                      .map((k) => [k, extras.filter((x) => x.kind === k).length] as const)
                      .filter(([, n]) => n)
                      .map(([k, n]) => `${n} ${SET_KINDS[k].toLowerCase()}`)
                      .join(" · ")}
                  </p>
                )}
              </div>

              <div
                className={clsx("flex min-h-[72px] flex-wrap items-center gap-x-2 rounded-xl px-3", rest ? "bg-bronze/10" : "bg-iron", rest?.reason && "py-2")}
                aria-live="polite"
              >
                {rest ? (
                  <>
                    <span className="mr-auto min-w-0">
                      <span className="block text-xs text-bronze-light">Descanso</span>
                      <span className="font-display text-2xl font-bold tabular-nums">{formatClock(remaining)}</span>
                    </span>
                    <button
                      type="button"
                      className="btn-secondary min-h-11 px-3"
                      onClick={() => store.changeRest(-15)}
                      aria-label="Reduzir descanso em 15 segundos"
                    >
                      −15
                    </button>
                    <button
                      type="button"
                      className="btn-secondary min-h-11 px-3"
                      onClick={() => store.changeRest(15)}
                      aria-label="Aumentar descanso em 15 segundos"
                    >
                      +15
                    </button>
                    <button type="button" className="btn-ghost min-h-11 px-3 text-sm" aria-label="Pular descanso" onClick={() => store.endRest()}>
                      Pular
                    </button>
                    {rest.reason && (
                      <span className="flex basis-full items-center gap-1 text-xs text-muted" data-testid="descanso-motivo">
                        <Brain size={13} className="shrink-0 text-bronze-light" aria-hidden /> Descanso inteligente {rest.reason}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-muted">
                    <Timer size={16} aria-hidden />{" "}
                    {step === "troca" ? "Faça a série; depois vai direto ao próximo da supersérie." : "Faça a série e toque em concluir."}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <Stepper
                    id="carga"
                    label="Carga"
                    suffix="kg"
                    step={2.5}
                    max={1000}
                    value={form.loadKg}
                    onChange={(v) => setForm((f) => ({ ...f, loadKg: v }))}
                  />
                  {(exercise.equipment === "barra" || exercise.equipment === "smith") && <PlateLine totalKg={form.loadKg} barKg={barKg} onBar={setBarKg} />}
                </div>
                <Stepper id="reps" label={iso ? "Segundos" : "Repetições"} max={300} value={form.reps} onChange={(v) => setForm((f) => ({ ...f, reps: v }))} />
                <Stepper id="rir" label="RIR" max={10} value={form.rir} onChange={(v) => setForm((f) => ({ ...f, rir: v }))} />
              </div>

              <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Tipo de série">
                {(
                  [
                    ["", "Série válida"],
                    ["aquecimento", SET_KINDS.aquecimento],
                    ["drop", SET_KINDS.drop]
                  ] as const
                ).map(([k, text]) => (
                  <button
                    key={k || "normal"}
                    type="button"
                    role="radio"
                    aria-checked={form.kind === k}
                    className={clsx("chip", form.kind === k && "chip-on")}
                    onClick={() => setForm((f) => ({ ...f, kind: k }))}
                  >
                    {text}
                  </button>
                ))}
                {form.kind && <span className="text-xs text-muted">Não conta nas séries da meta, não inicia descanso e fica fora dos recordes.</span>}
              </div>

              <div>
                <button
                  type="button"
                  className="flex min-h-10 items-center gap-1 text-sm text-sand"
                  aria-expanded={showPain}
                  aria-controls="campo-dor"
                  onClick={() => setShowPain((v) => !v)}
                >
                  <ChevronDown size={16} className={clsx("transition-transform", showPain && "rotate-180")} aria-hidden />
                  Registrar dor ou desconforto (opcional)
                </button>
                {showPain && (
                  <div id="campo-dor" className="mt-1">
                    <label htmlFor="dor" className="sr-only">
                      Descreva a dor ou desconforto
                    </label>
                    <input
                      id="dor"
                      className="input"
                      maxLength={200}
                      placeholder="Ex.: incômodo leve no ombro direito"
                      value={form.pain}
                      onChange={(e) => setForm((f) => ({ ...f, pain: e.target.value }))}
                    />
                    <p className="mt-1 text-xs text-muted">Se a dor for forte ou persistir, interrompa o exercício e procure um profissional.</p>
                  </div>
                )}
              </div>

              <button key={flash} type="button" className={clsx("btn-primary w-full text-lg", flash > 0 && "anim-set-done")} onClick={() => logSet()}>
                <Check size={20} aria-hidden />{" "}
                {form.kind === "aquecimento" ? "Registrar aquecimento" : form.kind === "drop" ? "Registrar drop set" : "Concluir série"}
              </button>
              {estimate1RM(form.loadKg, form.reps) !== null && !form.kind && !iso && (
                <p className="-mt-2 text-center text-xs text-muted">1RM estimado desta série: {fmt(estimate1RM(form.loadKg, form.reps)!)} kg</p>
              )}
            </section>
          </>
        )
      )}

      <p className="text-center text-xs text-muted" data-testid="aviso-tela">
        Mantenha o app aberto durante o descanso: com a tela bloqueada, o navegador pode silenciar o alerta. O tempo continua sendo contado corretamente.
      </p>

      <section className="grid grid-cols-2 gap-2" aria-label="Ações do treino">
        <button type="button" className="btn-secondary" disabled={complete} onClick={() => store.skipCurrent()}>
          <SkipForward size={18} aria-hidden /> Pular exercício
        </button>
        <button type="button" className="btn-danger" onClick={() => setConfirmEnd(true)}>
          <Square size={16} aria-hidden /> Encerrar treino
        </button>
      </section>
      {confirmEnd && (
        <div role="alert" className="card anim-fade space-y-3 border-danger/50">
          <p>Encerrar o treino agora? As séries já registradas serão salvas no histórico.</p>
          <div className="flex gap-2">
            <button type="button" className="btn-danger flex-1" onClick={() => finish(true)}>
              Encerrar e salvar
            </button>
            <button type="button" className="btn-ghost flex-1" onClick={() => setConfirmEnd(false)}>
              Continuar treinando
            </button>
          </div>
          <button
            type="button"
            className="w-full text-center text-sm text-muted underline"
            onClick={() => {
              store.discardActive();
              router.push("/");
            }}
          >
            Descartar sem salvar
          </button>
        </div>
      )}

      <details className="card">
        <summary className="flex min-h-10 cursor-pointer items-center font-semibold">Música e som</summary>
        <div className="mt-3">
          <MusicPlayer compact />
        </div>
      </details>

      <ExerciseSheet exerciseId={sheet} onClose={() => setSheet(null)} />
    </div>
  );
}

function PlateLine({ totalKg, barKg, onBar }: { totalKg: number; barKg: number; onBar: (v: number) => void }) {
  const r = platesPerSide(totalKg, barKg);
  return (
    <div className="mt-1.5 flex min-h-8 flex-wrap items-center gap-x-2 text-xs text-muted" data-testid="anilhas">
      <label htmlFor="barra-kg">Barra</label>
      <select
        id="barra-kg"
        className="rounded-md border border-line bg-iron px-1 py-0.5 text-sand"
        value={barKg}
        onChange={(e) => onBar(Number(e.target.value))}
      >
        {[20, 15, 10, 0].map((b) => (
          <option key={b} value={b}>
            {b ? `${b} kg` : "sem barra"}
          </option>
        ))}
      </select>
      <span>
        {!r
          ? "Carga menor que a barra."
          : r.plates.length === 0
            ? "Só a barra."
            : `Por lado: ${r.plates.map((p) => fmt(p)).join(" + ")} kg${r.remainder ? ` (faltam ${fmt(r.remainder)} kg)` : ""}`}
      </span>
    </div>
  );
}
