"use client";

import clsx from "clsx";
import { Pause, Play, SkipForward, SlidersHorizontal, Square, TimerReset, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Stepper } from "@/components/ui";
import { playAlert, unlockAudio, type AlertKind } from "@/lib/audio";
import { VoiceSettings } from "@/components/VoiceSettings";
import { coachSay, prepareCoach } from "@/lib/coachVoice";
import type { VoiceEvent } from "@/lib/voiceLines";
import { guidedTimes, workingSets } from "@/lib/session";
import { useStore } from "@/lib/store";
import { formatClock } from "@/lib/time";
import type { Exercise, RestState, SessionItem } from "@/lib/types";

type Running = "preparar" | "exercicio";
type Phase =
  | { kind: Running; endsAt: number; total: number }
  | { kind: "pausado"; was: Running; leftMs: number; total: number }
  | { kind: "descanso"; from: number; announced: boolean }
  | { kind: "aguardando" }
  | null;

const LABEL: Record<Running | "descanso", string> = {
  preparar: "Prepare-se",
  exercicio: "Execute",
  descanso: "Descanse"
};

/**
 * Timer guiado: preparação → execução → descanso → preparação… até acabar as séries.
 * O descanso é o mesmo da sessão (session.rest), então os botões −15/+15/Pular continuam valendo.
 */
export function GuidedTimer({
  item,
  index,
  exercise,
  rest,
  restLeft,
  now,
  complete,
  upcoming,
  onLogSet
}: {
  item: SessionItem;
  /** posição do exercício atual na sessão */
  index: number;
  exercise: Exercise;
  rest: RestState | null;
  restLeft: number;
  now: number;
  complete: boolean;
  /** exercícios da sessão, para baixar os anúncios antes */
  upcoming: Exercise[];
  onLogSet: (repsOverride?: number) => void;
}) {
  const store = useStore();
  const { settings } = store;
  const [phase, setPhase] = useState<Phase>(null);
  const [tune, setTune] = useState(false);
  const beeped = useRef<string>("");
  const lastIndex = useRef(index);
  const autoNext = settings.guidedAutoNext !== false;
  const times = guidedTimes(item.planned, exercise.isometric);
  const setsDone = workingSets(item.sets).length;

  const alert = (kind: AlertKind) =>
    playAlert(kind, {
      sound: settings.audioEnabled,
      vibrate: settings.vibration,
      volume: settings.alertVolume
    });

  const voiceOn = settings.voiceCues !== false;
  const say = (event: VoiceEvent, next?: Exercise) => void coachSay(settings, event, next);

  const startPrep = (at: number, afterRest: boolean) => {
    if (times.prepSec <= 0) {
      alert("inicio");
      say("iniciar");
      setPhase({ kind: "exercicio", endsAt: at + times.workSec * 1000, total: times.workSec });
    } else {
      if (afterRest && setsDone > 0) say(setsDone + 1 >= item.planned.sets ? "ultima" : "retomar");
      else say("preparar", exercise);
      setPhase({ kind: "preparar", endsAt: at + times.prepSec * 1000, total: times.prepSec });
    }
  };

  const goExercise = (at: number) => {
    alert("inicio");
    say("iniciar");
    setPhase({ kind: "exercicio", endsAt: at + times.workSec * 1000, total: times.workSec });
  };

  const start = async () => {
    // o toque do usuário libera o áudio (Safari exige)
    prepareCoach(settings, upcoming);
    const ok = await unlockAudio();
    prepareCoach(settings, upcoming);
    if (ok && !settings.audioEnabled) store.updateSettings({ audioEnabled: true });
    beeped.current = "";
    setTune(false);
    startPrep(Date.now(), false);
  };

  const finishExercise = () => {
    alert("fim-serie");
    const lastOfExercise = setsDone + 1 >= item.planned.sets;
    // fim do exercício: a fala espera o app escolher o próximo, para anunciar o nome e o aparelho
    if (!lastOfExercise) say("serie-feita");
    setPhase({ kind: "descanso", from: index, announced: !lastOfExercise });
    onLogSet(exercise.isometric ? times.workSec : undefined);
  };

  // máquina de estados, avaliada a cada tique do relógio da página
  useEffect(() => {
    if (!phase) return;
    if (complete) {
      say("treino-feito");
      setPhase(null);
      return;
    }
    // descanso iniciado pelo botão "Concluir série" durante a preparação/execução
    if (rest && (phase.kind === "preparar" || phase.kind === "exercicio")) {
      setPhase({ kind: "descanso", from: lastIndex.current, announced: true });
      return;
    }
    if (phase.kind === "preparar" || phase.kind === "exercicio") lastIndex.current = index;
    if (phase.kind === "aguardando") return;
    if (phase.kind === "descanso") {
      if (!phase.announced) {
        say("exercicio-feito", phase.from !== index ? exercise : undefined);
        setPhase({ ...phase, announced: true });
        return;
      }
      if (!rest) {
        // trocou de exercício: no modo manual espera o usuário escolher e confirmar
        if (phase.from !== index && !autoNext) setPhase({ kind: "aguardando" });
        else startPrep(now, phase.from === index);
      } else if (restLeft === 10 && rest.endsAt - rest.startedAt >= 25_000 && beeped.current !== `v${rest.endsAt}`) {
        beeped.current = `v${rest.endsAt}`;
        say("faltam-10");
      } else if (restLeft > 0 && restLeft <= 3 && beeped.current !== `d${rest.endsAt}:${restLeft}`) {
        beeped.current = `d${rest.endsAt}:${restLeft}`;
        alert("tique");
      }
      return;
    }
    if (phase.kind === "pausado") return;
    const left = Math.ceil((phase.endsAt - now) / 1000);
    if (left <= 0) {
      if (phase.kind === "preparar") goExercise(now);
      else finishExercise();
      return;
    }
    const key = `${phase.kind}${phase.endsAt}:${left}`;
    if (left <= 3 && beeped.current !== key) {
      beeped.current = key;
      alert("tique");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, phase, rest, complete, index]);

  if (complete) return null;

  const nextMode = (
    <div>
      <p className="label">Ao terminar um exercício</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Ao terminar um exercício">
        {(
          [
            [true, "Seguir automático"],
            [false, "Esperar eu escolher"]
          ] as const
        ).map(([v, text]) => (
          <button
            key={text}
            type="button"
            role="radio"
            aria-checked={autoNext === v}
            className={clsx("chip", autoNext === v && "chip-on")}
            onClick={() => store.updateSettings({ guidedAutoNext: v })}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );

  if (phase?.kind === "aguardando") {
    return (
      <section className="card space-y-3 border-2 border-sand text-center" aria-label="Timer guiado" data-testid="timer-guiado" data-fase="aguardando">
        <p className="font-display text-xl font-bold uppercase tracking-wide" data-testid="timer-fase">
          Exercício concluído
        </p>
        <p className="text-sand">
          Próximo: <strong>{exercise.name}</strong>
        </p>
        <button type="button" className="btn-primary w-full" onClick={() => startPrep(Date.now(), false)}>
          <Play size={18} aria-hidden /> Começar {exercise.name}
        </button>
        <p className="text-xs text-muted">Quer outro? Toque no exercício na lista acima e depois em Começar.</p>
        <button type="button" className="btn-ghost min-h-11 w-full" onClick={() => setPhase(null)}>
          <Square size={14} aria-hidden /> Parar timer
        </button>
      </section>
    );
  }

  const showKind = phase?.kind === "pausado" ? phase.was : phase?.kind;
  const left = !phase
    ? 0
    : phase.kind === "descanso"
      ? restLeft
      : phase.kind === "pausado"
        ? Math.ceil(phase.leftMs / 1000)
        : Math.max(0, Math.ceil((phase.endsAt - now) / 1000));
  const total = !phase ? 1 : phase.kind === "descanso" ? Math.max(1, Math.round(((rest?.endsAt ?? 0) - (rest?.startedAt ?? 0)) / 1000)) : phase.total;
  const frac = phase ? Math.min(1, Math.max(0, left / total)) : 1;

  const tuning = tune && (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" data-testid="timer-ajustes">
      <Stepper id="g-exec" label="Execução" suffix="s" step={5} min={5} max={900} value={times.workSec} onChange={(v) => store.setItemTimes({ workSec: v })} />
      <Stepper
        id="g-desc"
        label="Descanso"
        suffix="s"
        step={15}
        min={0}
        max={1800}
        value={times.restSec}
        onChange={(v) => store.setItemTimes({ restSec: v })}
      />
      <Stepper id="g-prep" label="Preparo" suffix="s" step={5} min={0} max={300} value={times.prepSec} onChange={(v) => store.setItemTimes({ prepSec: v })} />
      <p className="text-xs text-muted sm:col-span-3">Vale para este exercício neste treino. Para salvar de vez, ajuste em Treinos → editar.</p>
      <div className="text-left sm:col-span-3">{nextMode}</div>
      <div className="text-left sm:col-span-3">
        <VoiceSettings />
      </div>
    </div>
  );

  const voiceToggle = (
    <button
      type="button"
      className="btn-ghost min-h-11 px-3"
      aria-pressed={voiceOn}
      aria-label={voiceOn ? "Desligar voz" : "Ligar voz"}
      title={voiceOn ? "Voz ligada" : "Voz desligada"}
      onClick={() => store.updateSettings({ voiceCues: !voiceOn })}
    >
      {voiceOn ? <Volume2 size={18} aria-hidden /> : <VolumeX size={18} aria-hidden />}
    </button>
  );

  if (!phase) {
    return (
      <section className="card space-y-3" aria-labelledby="timer-guiado" data-testid="timer-guiado">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 id="timer-guiado" className="flex items-center gap-1.5 font-semibold">
              <TimerReset size={18} aria-hidden /> Timer guiado
            </h2>
            <p className="text-sm text-muted">
              Execução {times.workSec}s · Descanso {times.restSec}s · Preparo {times.prepSec}s · {autoNext ? "segue sozinho" : "você escolhe o próximo"}
            </p>
          </div>
          <div className="flex shrink-0">
            {voiceToggle}
            <button type="button" className="btn-ghost min-h-11 px-3" aria-expanded={tune} aria-label="Ajustar tempos" onClick={() => setTune((t) => !t)}>
              <SlidersHorizontal size={18} aria-hidden />
            </button>
          </div>
        </div>
        {tuning}
        <button type="button" className="btn-primary w-full" onClick={() => void start()}>
          <Play size={18} aria-hidden /> Iniciar timer guiado
        </button>
        <p className="text-xs text-muted">
          Conta o tempo da série, registra sozinho com a carga e repetições abaixo, descansa e avisa a hora de voltar, com bipes, voz e vibração.
        </p>
      </section>
    );
  }

  const color = showKind === "exercicio" ? "text-ok" : showKind === "descanso" ? "text-bronze-light" : "text-parchment";
  const border = showKind === "exercicio" ? "border-ok" : showKind === "descanso" ? "border-bronze" : "border-sand";
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <section className={clsx("card space-y-3 border-2 text-center", border)} aria-label="Timer guiado" data-testid="timer-guiado" data-fase={showKind}>
      <p className="text-xs text-muted">
        {exercise.name} · série {Math.min(setsDone + (showKind === "descanso" ? 0 : 1), item.planned.sets)} de {item.planned.sets}
      </p>
      <div className="relative mx-auto h-48 w-48">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={R} fill="none" stroke="currentColor" strokeWidth="8" className="text-steel" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - frac)}
            className={clsx(color, "transition-[stroke-dashoffset] duration-300")}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" aria-live="polite">
          <span className={clsx("font-display text-xl font-bold uppercase tracking-wide", color)} data-testid="timer-fase">
            {phase.kind === "pausado" ? "Pausado" : LABEL[showKind as Running | "descanso"]}
          </span>
          <span className="font-display text-5xl font-bold tabular-nums" data-testid="timer-tempo">
            {formatClock(left)}
          </span>
        </div>
      </div>
      {showKind === "preparar" && setsDone === 0 && <p className="text-sm text-sand">Próximo: {exercise.name}</p>}
      <div className="grid grid-cols-3 gap-2">
        {phase.kind === "descanso" ? (
          <>
            <button type="button" className="btn-secondary min-h-11 px-2" onClick={() => store.changeRest(15)} aria-label="Aumentar descanso em 15 segundos">
              +15s
            </button>
            <button type="button" className="btn-secondary min-h-11 px-2" onClick={() => store.endRest()}>
              <SkipForward size={16} aria-hidden /> Voltar já
            </button>
          </>
        ) : phase.kind === "pausado" ? (
          <>
            <button
              type="button"
              className="btn-primary col-span-2 min-h-11 px-2"
              onClick={() => setPhase({ kind: phase.was, endsAt: Date.now() + phase.leftMs, total: phase.total })}
            >
              <Play size={16} aria-hidden /> Retomar
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn-secondary min-h-11 px-2"
              onClick={() => setPhase({ kind: "pausado", was: phase.kind, leftMs: Math.max(0, phase.endsAt - Date.now()), total: phase.total })}
            >
              <Pause size={16} aria-hidden /> Pausar
            </button>
            {phase.kind === "preparar" ? (
              <button type="button" className="btn-secondary min-h-11 px-2" onClick={() => goExercise(Date.now())}>
                <SkipForward size={16} aria-hidden /> Já
              </button>
            ) : (
              <button type="button" className="btn-secondary min-h-11 px-2" onClick={finishExercise}>
                <SkipForward size={16} aria-hidden /> Terminei
              </button>
            )}
          </>
        )}
        <button type="button" className="btn-ghost min-h-11 px-2" onClick={() => setPhase(null)}>
          <Square size={14} aria-hidden /> Parar
        </button>
      </div>
      <div className="flex items-center justify-center gap-2">
        {voiceToggle}
        <button type="button" className="flex min-h-11 items-center gap-1 text-xs text-muted" aria-expanded={tune} onClick={() => setTune((t) => !t)}>
          <SlidersHorizontal size={14} aria-hidden /> Ajustar tempos
        </button>
      </div>
      {tuning}
    </section>
  );
}
