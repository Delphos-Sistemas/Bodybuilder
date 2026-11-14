"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Clock, Plus, SkipForward, Timer, Vibrate } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { MascotMessage } from "@/components/mascot/MascotMessage";
import { exercises } from "@/data/exercises";
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
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState({ difficulty: 7, energy: 4, painLevel: 1, bodyWeight: "", notes: "" });

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

  function saveSet() {
    completeSet(params.sessionId, exercise.id, setNumber, weight, reps, rir, pain);
    if (navigator.vibrate) navigator.vibrate(80);
    setRest(prescription.restSeconds);
    if (setNumber >= prescription.sets) {
      if (exerciseIndex < day.exercises.length - 1) {
        setExerciseIndex(exerciseIndex + 1);
        setSetNumber(1);
      } else {
        setFinished(true);
      }
    } else {
      setSetNumber(setNumber + 1);
    }
  }

  function finish() {
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

  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-iron p-5 text-parchment">
        <Card>
          <h1 className="text-xl font-black">Sessao nao encontrada</h1>
          <Link className="mt-4 inline-block text-bronze-light" href="/treinos">Voltar aos treinos</Link>
        </Card>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="min-h-screen bg-iron p-4 text-parchment">
        <div className="mx-auto max-w-2xl space-y-4">
          <MascotMessage variant="achievement" title="Missao cumprida" message="Agora recupere-se. O corpo e treinado. O carater e construido." />
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
            <Input value={summary.notes} onChange={(event) => setSummary({ ...summary, notes: event.target.value })} placeholder="Tecnica boa, energia estavel." />
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
          <div className="flex items-center gap-2 text-sand"><Clock size={18} /> {progress}%</div>
        </header>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-bronze" style={{ width: `${progress}%` }} />
        </div>
        <Card className="space-y-4">
          <div className="grid aspect-video place-items-center rounded-lg border border-white/10 bg-[linear-gradient(135deg,#171717,#282018)] text-5xl font-black text-bronze/70">
            BB
          </div>
          <div>
            <p className="text-sm text-sand">Exercicio atual</p>
            <h2 className="text-2xl font-black">{exercise.name}</h2>
            <p className="text-sm text-sand">{prescription.sets} series · {prescription.minReps}-{prescription.maxReps} reps · RIR {prescription.targetRir} · descanso {prescription.restSeconds}s</p>
          </div>
          <p className="text-sm text-sand">{exercise.instructions[0]} {exercise.instructions[1]}</p>
          {pain >= 7 && <p className="rounded-lg border border-danger bg-danger/10 p-3 text-sm">Voce informou dor neste movimento. Interrompa movimentos que agravam a dor e procure avaliacao de um profissional de saude.</p>}
          {progression && <p className="rounded-lg border border-bronze/40 bg-bronze/10 p-3 text-sm text-bronze-light">{progression}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Carga kg" value={weight} setValue={setWeight} />
            <Field label="Repeticoes" value={reps} setValue={setReps} />
            <Field label="RIR" value={rir} setValue={setRir} />
            <Field label="Dor 0-10" value={pain} setValue={setPain} />
          </div>
          <Button onClick={saveSet} className="min-h-14 w-full text-base">
            <Vibrate size={19} /> Concluir serie {setNumber}
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
