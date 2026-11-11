"use client";

import { ArrowRight, Dumbbell, Sparkles } from "lucide-react";
import Link from "next/link";
import { StartWorkoutButton } from "@/components/StartWorkout";
import { Card, ProgressBar } from "@/components/ui";
import { EXERCISE_MAP } from "@/data/exercises";
import { estimateMinutes, sessionSetCount, sessionVolume } from "@/lib/session";
import { sessionsThisWeek } from "@/lib/stats";
import { useData, useStore } from "@/lib/store";
import { formatDate, formatDuration, workoutElapsed } from "@/lib/time";
import type { Dataset, Workout } from "@/lib/types";

/** Próximo treino da rotação: o seguinte ao último treino concluído. */
function nextWorkout(d: Dataset): Workout | undefined {
  if (!d.workouts.length) return undefined;
  const last = d.sessions.find((s) => s.endedAt);
  if (!last) return d.workouts[0];
  const i = d.workouts.findIndex((w) => w.id === last.workoutId);
  return d.workouts[(i + 1) % d.workouts.length] ?? d.workouts[0];
}

export default function InicioPage() {
  const data = useData();
  const mode = useStore((s) => s.mode);
  const enterDemo = useStore((s) => s.enterDemo);
  const exitDemo = useStore((s) => s.exitDemo);
  const resetDemo = useStore((s) => s.resetDemo);
  const now = Date.now();
  const today = nextWorkout(data);
  const week = sessionsThisWeek(data.sessions, now);
  const goal = data.profile.weeklyGoal;
  const recent = data.sessions.filter((s) => s.endedAt).slice(0, 3);
  const greeting = data.profile.name ? `Olá, ${data.profile.name.split(" ")[0]}` : "Bom treino";

  return (
    <div className="space-y-5">
      {mode === "demo" && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bronze/60 bg-bronze/10 px-4 py-3 text-sm">
          <span>
            <strong>Modo demonstração.</strong> Os dados de exemplo ficam separados dos seus e não entram na exportação.
          </span>
          <span className="flex gap-2">
            <button type="button" className="btn-ghost min-h-10 px-3" onClick={resetDemo}>
              Reiniciar exemplo
            </button>
            <button type="button" className="btn-secondary min-h-10 px-3" onClick={exitDemo}>
              Voltar aos meus dados
            </button>
          </span>
        </div>
      )}

      <header>
        <p className="eyebrow">{new Date(now).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="h1">{greeting}</h1>
      </header>

      {data.activeSession && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-bronze">
          <div>
            <p className="eyebrow">Sessão interrompida</p>
            <p className="font-semibold">{data.activeSession.workoutName}</p>
            <p className="text-sm text-muted">Iniciada em {new Date(data.activeSession.startedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
          </div>
          <Link href="/treino-ativo" className="btn-primary">
            Retomar treino
          </Link>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-3 lg:col-span-2">
          <p className="eyebrow">Treino do dia</p>
          {today ? (
            <>
              <h2 className="font-display text-2xl font-bold">{today.name}</h2>
              <p className="text-sm text-muted">
                {today.exercises.length} exercícios · cerca de {formatDuration(estimateMinutes(today) * 60)}
              </p>
              <ul className="flex flex-wrap gap-2">
                {today.exercises.slice(0, 6).map((e) => (
                  <li key={e.uid} className="chip">
                    {EXERCISE_MAP[e.exerciseId]?.name}
                  </li>
                ))}
                {today.exercises.length > 6 && <li className="chip">+{today.exercises.length - 6}</li>}
              </ul>
              <div className="flex flex-wrap gap-2 pt-1">
                <StartWorkoutButton workoutId={today.id} className="btn-primary flex-1 sm:flex-none" />
                <Link href="/treinos" className="btn-secondary">
                  Outros treinos
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold">Monte seu primeiro treino</h2>
              <p className="text-sand">Crie do zero, use um modelo pronto ou responda o perfil para receber uma sugestão inicial editável.</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/treinos" className="btn-primary">
                  <Dumbbell size={18} aria-hidden /> Criar treino
                </Link>
                <Link href="/perfil" className="btn-secondary">
                  Responder perfil
                </Link>
                {mode === "usuario" && (
                  <button type="button" className="btn-ghost" onClick={enterDemo}>
                    <Sparkles size={18} aria-hidden /> Ver demonstração
                  </button>
                )}
              </div>
            </>
          )}
        </Card>

        <Card className="space-y-3">
          <p className="eyebrow">Meta semanal</p>
          <p className="font-display text-4xl font-bold">
            {week}
            <span className="text-xl text-muted"> / {goal} treinos</span>
          </p>
          <ProgressBar value={goal ? week / goal : 0} label="Meta semanal de treinos" />
          <p className="text-sm text-muted">{week >= goal ? "Meta da semana cumprida." : `Faltam ${goal - week} para cumprir a meta desta semana.`}</p>
          <Link href="/perfil" className="text-sm text-bronze-light underline">
            Ajustar meta
          </Link>
        </Card>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Progresso recente</p>
          <Link href="/historico" className="flex items-center gap-1 text-sm text-bronze-light">
            Histórico <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
        {recent.length ? (
          <ul className="divide-y divide-line">
            {recent.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span>
                  <span className="block font-medium">{s.workoutName}</span>
                  <span className="text-sm text-muted">{formatDate(s.startedAt)}</span>
                </span>
                <span className="text-right text-sm text-sand">
                  {formatDuration(workoutElapsed(s, s.endedAt!))} · {sessionSetCount(s)} séries · {Math.round(sessionVolume(s)).toLocaleString("pt-BR")} kg
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Seus treinos concluídos aparecem aqui.</p>
        )}
      </Card>

      {mode === "usuario" && today && (
        <p className="text-center text-sm text-muted">
          Quer ver o app com dados de exemplo?{" "}
          <button type="button" className="text-bronze-light underline" onClick={enterDemo}>
            Abrir modo demonstração
          </button>
        </p>
      )}
    </div>
  );
}
