"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Clock, Music2, Pause, Play, Plus, SkipForward, Timer, Vibrate, Volume2 } from "lucide-react";
import { ExerciseVisual } from "@/components/exercises/ExerciseVisual";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { MascotMessage } from "@/components/mascot/MascotMessage";
import { exercises } from "@/data/exercises";
import { ptLabel } from "@/lib/format";
import { useAppStore } from "@/stores/appStore";
import { nextLoadSuggestion, shouldSuggestDoubleProgression } from "@/utils/progression";

export default function ActiveWorkoutPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { plan, sessions, completeSet, finishWorkout } = useAppStore();
  const session = sessions.find((item) => item.id === params.sessionId);
  const day = plan.days.find((item) => item.id === session?.workoutDayId) ?? plan.days[0];
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [weight, setWeight] = useState(40);
  const [reps, setReps] = useState(10);
  const [rir, setRir] = useState(2);
  const [pain, setPain] = useState(0);
  const [rest, setRest] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [exerciseElapsed, setExerciseElapsed] = useState(0);
  const [exerciseStartedAt, setExerciseStartedAt] = useState(Date.now());
  const [finished, setFinished] = useState(false);
  const [musicStyle, setMusicStyle] = useState<"metal" | "rock" | "hiphop">("metal");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [summary, setSummary] = useState({ difficulty: 7, energy: 4, painLevel: 1, bodyWeight: "", notes: "" });
  const musicRef = useRef<{ context: AudioContext; intervals: number[] } | null>(null);
  const restDoneRef = useRef(false);

  const prescription = day.exercises[exerciseIndex];
  const exercise = exercises.find((item) => item.id === prescription.exerciseId) ?? exercises[0];
  const completedForExercise = useMemo(
    () => session?.sets.filter((set) => set.exerciseId === exercise.id).sort((a, b) => a.setNumber - b.setNumber) ?? [],
    [session?.sets, exercise.id]
  );
  const progress = Math.round(((exerciseIndex + completedForExercise.length / prescription.sets) / day.exercises.length) * 100);
  const progression = shouldSuggestDoubleProgression(prescription, completedForExercise)
    ? nextLoadSuggestion(weight, exercise.primaryMuscle)
    : "";

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(session?.startedAt ?? Date.now()).getTime()) / 1000));
      setExerciseElapsed(Math.floor((Date.now() - exerciseStartedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [exerciseStartedAt, session?.startedAt]);

  useEffect(() => {
    if (rest <= 0) {
      if (restDoneRef.current) {
        playAlert();
        restDoneRef.current = false;
      }
      return;
    }
    restDoneRef.current = true;
    const timer = window.setTimeout(() => setRest((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rest]);

  useEffect(() => () => stopMusic(), []);

  function saveSet() {
    completeSet(params.sessionId, exercise.id, setNumber, weight, reps, rir, pain);
    if (navigator.vibrate) navigator.vibrate(80);
    playTap();
    setRest(prescription.restSeconds);
    if (setNumber >= prescription.sets) {
      if (exerciseIndex < day.exercises.length - 1) {
        setExerciseIndex(exerciseIndex + 1);
        setExerciseStartedAt(Date.now());
        setSetNumber(1);
      } else {
        playAlert();
        setFinished(true);
      }
    } else {
      setSetNumber(setNumber + 1);
    }
  }

  function finish() {
    stopMusic();
    finishWorkout(
      params.sessionId,
      summary.difficulty,
      summary.energy,
      summary.painLevel,
      summary.notes,
      summary.bodyWeight ? Number(summary.bodyWeight) : undefined
    );
    router.push("/historico");
  }

  function getAudioContext() {
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    return new AudioContextCtor();
  }

  function tone(context: AudioContext, frequency: number, duration: number, type: OscillatorType, volume = 0.08) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    osc.connect(gain).connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + duration);
  }

  function playTap() {
    const context = getAudioContext();
    tone(context, 420, 0.08, "triangle", 0.05);
    window.setTimeout(() => context.close(), 220);
  }

  function playAlert() {
    const context = getAudioContext();
    [0, 180, 360].forEach((delay, index) => {
      window.setTimeout(() => tone(context, 740 + index * 90, 0.18, "square", 0.09), delay);
    });
    window.setTimeout(() => context.close(), 900);
    if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
  }

  function startMusic() {
    stopMusic();
    const context = getAudioContext();
    const intervals: number[] = [];
    const patterns = {
      metal: { bpm: 154, bass: [82, 82, 110, 98], lead: [220, 247, 262, 294], wave: "sawtooth" as OscillatorType },
      rock: { bpm: 124, bass: [98, 123, 146, 123], lead: [196, 220, 247, 220], wave: "triangle" as OscillatorType },
      hiphop: { bpm: 92, bass: [55, 65, 73, 65], lead: [165, 196, 185, 147], wave: "sine" as OscillatorType }
    };
    const pattern = patterns[musicStyle];
    const beat = 60000 / pattern.bpm;
    let step = 0;
    const mainLoop = window.setInterval(() => {
      const note = step % pattern.bass.length;
      tone(context, pattern.bass[note], 0.14, "sawtooth", musicStyle === "hiphop" ? 0.12 : 0.08);
      if (step % 2 === 0) tone(context, pattern.lead[note], 0.08, pattern.wave, 0.035);
      if (step % 4 === 0) tone(context, 55, 0.05, "square", 0.11);
      if (step % 4 === 2) tone(context, 180, 0.04, "triangle", 0.05);
      step += 1;
    }, beat);
    intervals.push(mainLoop);
    musicRef.current = { context, intervals };
    setMusicPlaying(true);
  }

  function stopMusic() {
    musicRef.current?.intervals.forEach((id) => window.clearInterval(id));
    musicRef.current?.context.close().catch(() => undefined);
    musicRef.current = null;
    setMusicPlaying(false);
  }

  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-iron p-5 text-parchment">
        <Card>
          <h1 className="text-xl font-black">Sessão não encontrada</h1>
          <Link className="mt-4 inline-block text-bronze-light" href="/treinos">Voltar aos treinos</Link>
        </Card>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="min-h-screen bg-iron p-4 text-parchment">
        <div className="mx-auto max-w-2xl space-y-4">
          <MascotMessage variant="achievement" title="Missão cumprida" message="Agora recupere-se. O corpo é treinado. O caráter é construído." />
          <Card className="space-y-3">
            <h1 className="font-display text-3xl font-black">Resumo do treino</h1>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Volume" value={`${session.totalVolume.toFixed(0)} kg`} />
              <Metric label="Series" value={`${session.sets.length}`} />
              <Metric label="Exercicios" value={`${day.exercises.length}`} />
            </div>
            <label className="block text-sm text-sand">Dificuldade geral 1-10</label>
            <Input type="number" value={summary.difficulty} onChange={(event) => setSummary({ ...summary, difficulty: Number(event.target.value) })} />
            <label className="block text-sm text-sand">Energia 1-5</label>
            <Input type="number" value={summary.energy} onChange={(event) => setSummary({ ...summary, energy: Number(event.target.value) })} />
            <label className="block text-sm text-sand">Dor 0-10</label>
            <Input type="number" value={summary.painLevel} onChange={(event) => setSummary({ ...summary, painLevel: Number(event.target.value) })} />
            <label className="block text-sm text-sand">Peso corporal opcional</label>
            <Input value={summary.bodyWeight} onChange={(event) => setSummary({ ...summary, bodyWeight: event.target.value })} placeholder="86.4" />
            <label className="block text-sm text-sand">Observacoes</label>
            <Input value={summary.notes} onChange={(event) => setSummary({ ...summary, notes: event.target.value })} placeholder="Técnica boa, energia estável." />
            <Button onClick={finish} className="w-full">Finalizar e salvar</Button>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-iron p-4 text-parchment">
      <div className="mx-auto max-w-2xl space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-bronze-light">{day.name}</p>
            <h1 className="font-display text-3xl font-black">Treino ativo</h1>
          </div>
          <div className="grid justify-items-end gap-1 text-sand">
            <span className="flex items-center gap-2"><Clock size={18} /> {formatSeconds(elapsed)}</span>
            <span className="text-xs">{progress}% concluído</span>
          </div>
        </header>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-bronze" style={{ width: `${progress}%` }} />
        </div>
        <Card className="space-y-4">
          <div className="grid gap-3 rounded-lg border border-white/10 bg-iron p-3 sm:grid-cols-3">
            <Metric label="Tempo do treino" value={formatSeconds(elapsed)} />
            <Metric label="Exercício atual" value={formatSeconds(exerciseElapsed)} />
            <Metric label="Descanso" value={rest > 0 ? formatSeconds(rest) : "Pronto"} />
          </div>
          <div className="rounded-lg border border-bronze/30 bg-iron p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-bronze-light"><Music2 size={17} /> Trilha de treino</p>
                <p className="text-xs text-sand">Loop instrumental gerado no navegador. Funciona bem com fone.</p>
              </div>
              <Button variant="secondary" onClick={musicPlaying ? stopMusic : startMusic}>
                {musicPlaying ? <Pause size={17} /> : <Play size={17} />}
                {musicPlaying ? "Pausar" : "Tocar"}
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["metal", "rock", "hiphop"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    setMusicStyle(style);
                    if (musicPlaying) window.setTimeout(startMusic, 0);
                  }}
                  className={`min-h-10 rounded-lg border px-2 text-sm font-bold capitalize ${
                    musicStyle === style ? "border-bronze bg-bronze text-iron" : "border-white/10 text-sand"
                  }`}
                >
                  {style === "hiphop" ? "Hip hop" : style}
                </button>
              ))}
            </div>
          </div>
          <ExerciseVisual exercise={exercise} />
          <div>
            <p className="text-sm text-sand">Exercício atual</p>
            <h2 className="text-2xl font-black">{exercise.name}</h2>
            <p className="text-sm text-sand">
              {ptLabel(exercise.equipment)} · {prescription.sets} séries · {prescription.minReps}-{prescription.maxReps} reps · RIR{" "}
              {prescription.targetRir} · descanso {prescription.restSeconds}s
            </p>
          </div>
          <p className="text-sm text-sand">{exercise.instructions[0]} {exercise.instructions[1]}</p>
          {pain >= 7 && <p className="rounded-lg border border-danger bg-danger/10 p-3 text-sm">Você informou dor neste movimento. Interrompa movimentos que agravam a dor e procure avaliação de um profissional de saúde.</p>}
          {progression && <p className="rounded-lg border border-bronze/40 bg-bronze/10 p-3 text-sm text-bronze-light">{progression}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Carga kg" value={weight} setValue={setWeight} />
            <Field label="Repeticoes" value={reps} setValue={setReps} />
            <Field label="RIR" value={rir} setValue={setRir} />
            <Field label="Dor 0-10" value={pain} setValue={setPain} />
          </div>
          <Button onClick={saveSet} className="min-h-14 w-full text-base">
            <Vibrate size={19} /> Concluir série {setNumber}
          </Button>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" onClick={() => setSetNumber(setNumber + 1)}><Plus size={16} /> Serie</Button>
            <Button variant="secondary" onClick={() => setExerciseIndex(Math.min(day.exercises.length - 1, exerciseIndex + 1))}><SkipForward size={16} /> Pular</Button>
            <Button variant="secondary" onClick={() => setFinished(true)}><ChevronRight size={16} /> Encerrar</Button>
          </div>
        </Card>
        {rest > 0 && (
          <Card className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Timer className="text-bronze-light" /> Descanso iniciado: {rest}s</span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setRest(Math.max(0, rest - 15))}>-15s</Button>
              <Button variant="secondary" onClick={() => setRest(rest + 15)}>+15s</Button>
            </div>
          </Card>
        )}
        <Card className="flex items-center gap-3 text-sm text-sand">
          <Volume2 className="shrink-0 text-bronze-light" />
          O alerta sonoro toca quando o descanso chega ao fim. Para ouvir, mantenha o som do navegador liberado.
        </Card>
        <footer className="border-t border-white/10 pt-5 text-center text-sm text-sand">
          Desenvolvido por Delphos Sistemas
        </footer>
      </div>
    </main>
  );
}

function Field({ label, value, setValue }: { label: string; value: number; setValue: (value: number) => void }) {
  return (
    <label className="block text-sm text-sand">
      {label}
      <Input className="mt-1" type="number" value={value} onChange={(event) => setValue(Number(event.target.value))} />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-iron p-3">
      <p className="text-xs text-sand">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}
