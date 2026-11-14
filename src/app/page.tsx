"use client";

import { ArrowRight, Award, Calculator, Dumbbell, Flame, Share2, Sparkles, Users } from "lucide-react";
import { ShareCanvas } from "@/components/ShareCanvas";
import { WeekMuscleMap } from "@/components/WeekMuscleMap";
import { medals, weekStreak } from "@/lib/achievements";
import { CYCLE, currentPhase, cycleWeek } from "@/lib/periodization";
import { drawWeekCard } from "@/lib/shareCard";
import { weekSummary } from "@/lib/weekly";
import { PHASES } from "@/lib/types";
import Link from "next/link";
import { useMemo } from "react";
import { BackupReminder } from "@/components/BackupReminder";
import { NutritionCard } from "@/components/NutritionCard";
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
  const settings = useStore((s) => s.settings);
  const phase = currentPhase(settings, now);
  const streak = weekStreak(data.sessions, goal, now);
  const medalList = useMemo(() => medals(data.sessions, goal, Date.now()), [data.sessions, goal]);
  const gotMedals = medalList.filter((m) => m.achievedAt).length;
  const nextMedal = medalList.filter((m) => !m.achievedAt).sort((a, b) => b.progress - a.progress)[0];
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
        <p className="eyebrow">
          {new Date(now).toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long"
          })}
        </p>
        <h1 className="h1">{greeting}</h1>
      </header>

      <BackupReminder />

      {data.activeSession && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-bronze">
          <div>
            <p className="eyebrow">Sessão interrompida</p>
            <p className="font-semibold">{data.activeSession.workoutName}</p>
            <p className="text-sm text-muted">
              Iniciada em{" "}
              {new Date(data.activeSession.startedAt).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short"
              })}
            </p>
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
              {phase && settings.periodization && (
                <p className="text-sm text-bronze-light" data-testid="fase-semana">
                  Semana {cycleWeek(settings.periodization.start, now) + 1} de 4 do ciclo · <strong>{PHASES[phase]}</strong>:{" "}
                  {CYCLE.find((c) => c.phase === phase)!.text}
                </p>
              )}
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
          {streak.current > 0 && (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-bronze-light" data-testid="sequencia">
              <Flame size={16} aria-hidden /> {streak.current} {streak.current === 1 ? "semana" : "semanas"} seguidas batendo a meta
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <ShareCanvas
              title="Resumo da semana"
              fileName={`semana-${new Date(now).toISOString().slice(0, 10)}.png`}
              draw={(c, logo) => drawWeekCard(c, weekSummary(data.sessions, goal, Date.now()), logo)}
            >
              <Share2 size={16} aria-hidden /> Resumo da semana
            </ShareCanvas>
            <Link href="/perfil" className="text-sm text-bronze-light underline">
              Ajustar meta
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <WeekMuscleMap sessions={data.sessions} now={now} compact />
        </Card>
        <Card className="space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Conquistas</p>
            <Link href="/conquistas" className="flex items-center gap-1 text-sm text-bronze-light">
              Ver todas <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
          <p className="flex items-center gap-2">
            <Award size={28} className="text-bronze-light" aria-hidden />
            <span className="font-display text-3xl font-bold">{gotMedals}</span>
            <span className="text-muted">de {medalList.length} medalhas</span>
          </p>
          {nextMedal && (
            <div>
              <p className="text-sm">
                Próxima: <strong>{nextMedal.title}</strong> <span className="text-muted">· {nextMedal.text.toLowerCase()}</span>
              </p>
              <ProgressBar value={nextMedal.progress} label={`Progresso de ${nextMedal.title}`} />
              <p className="mt-1 text-xs text-muted">{nextMedal.progressText}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/desafio" className="btn-secondary min-h-10 px-3 text-sm">
              <Users size={16} aria-hidden /> Desafio com amigos
            </Link>
            <Link href="/calculadora" className="btn-ghost min-h-10 px-3 text-sm">
              <Calculator size={16} aria-hidden /> 1RM e anilhas
            </Link>
          </div>
        </Card>
      </div>

      <NutritionCard />

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
