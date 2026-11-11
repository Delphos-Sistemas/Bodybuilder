"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { Card, PageHeader } from "@/components/ui";
import { EXERCISE_MAP } from "@/data/exercises";
import { TEMPLATES } from "@/data/templates";
import { suggestPlan, type PlanSuggestion } from "@/lib/plan";
import { useData, useStore } from "@/lib/store";
import { EQUIPMENT, EXPERIENCE, GOALS, WEEKDAYS, type Equipment, type Experience, type Goal, type Profile } from "@/lib/types";

export default function PerfilPage() {
  const data = useData();
  const saveProfile = useStore((s) => s.saveProfile);
  const addWorkouts = useStore((s) => s.addWorkouts);
  const [p, setP] = useState<Profile>(data.profile);
  const [editing, setEditing] = useState(!data.profile.onboarded);
  const [suggestion, setSuggestion] = useState<PlanSuggestion | null>(null);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const toggleDay = (d: number) => setP((x) => ({ ...x, days: x.days.includes(d) ? x.days.filter((y) => y !== d) : [...x.days, d].sort() }));
  const toggleEq = (e: Equipment) => setP((x) => ({ ...x, equipment: x.equipment.includes(e) ? x.equipment.filter((y) => y !== e) : [...x.equipment, e] }));

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!p.days.length) {
      setError("Escolha pelo menos um dia disponível.");
      return;
    }
    const saved = { ...p, onboarded: true, weeklyGoal: Math.min(7, Math.max(1, p.weeklyGoal || p.days.length)) };
    saveProfile(saved);
    setP(saved);
    setError("");
    setEditing(false);
    setAdded(false);
    setSuggestion(suggestPlan(saved, Date.now()));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader eyebrow={editing ? "Configuração inicial" : "Seu perfil"} title="Perfil" />

      {editing ? (
        <form onSubmit={submit} className="space-y-4">
          <Card className="space-y-4">
            <div>
              <label htmlFor="nome" className="label">
                Como podemos te chamar? (opcional)
              </label>
              <input id="nome" className="input" maxLength={60} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
            </div>
            <fieldset>
              <legend className="label">Objetivo principal</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(GOALS) as Goal[]).map((g) => (
                  <label key={g} className={clsx("flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3", p.goal === g ? "border-bronze bg-bronze/10" : "border-line")}>
                    <input type="radio" name="objetivo" className="accent-[#B07D45]" checked={p.goal === g} onChange={() => setP({ ...p, goal: g })} />
                    {GOALS[g]}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">Experiência com musculação</legend>
              <div className="grid gap-2">
                {(Object.keys(EXPERIENCE) as Experience[]).map((x) => (
                  <label key={x} className={clsx("flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3", p.experience === x ? "border-bronze bg-bronze/10" : "border-line")}>
                    <input type="radio" name="experiencia" className="accent-[#B07D45]" checked={p.experience === x} onChange={() => setP({ ...p, experience: x })} />
                    {EXPERIENCE[x]}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">Dias disponíveis para treinar</legend>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d, i) => (
                  <button key={d} type="button" aria-pressed={p.days.includes(i)} className={clsx("chip min-w-12 justify-center", p.days.includes(i) && "chip-on")} onClick={() => toggleDay(i)}>
                    {d}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">Equipamentos a que você tem acesso</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(EQUIPMENT) as Equipment[]).map((e) => (
                  <button key={e} type="button" aria-pressed={p.equipment.includes(e)} className={clsx("chip", p.equipment.includes(e) && "chip-on")} onClick={() => toggleEq(e)}>
                    {EQUIPMENT[e]}
                  </button>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="meta" className="label">
                Meta de treinos por semana
              </label>
              <input id="meta" type="number" min={1} max={7} className="input w-32" value={p.weeklyGoal} onChange={(e) => setP({ ...p, weeklyGoal: parseInt(e.target.value, 10) || 1 })} />
            </div>
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
          </Card>
          <p className="text-xs text-muted">
            As sugestões do app são regras gerais de organização de treino, não diagnóstico nem prescrição. Se você tem alguma condição de saúde, lesão ou dúvida, consulte um médico ou profissional de educação física.
          </p>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">
              Salvar e sugerir plano
            </button>
            {data.profile.onboarded && (
              <button type="button" className="btn-ghost" onClick={() => (setP(data.profile), setEditing(false))}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      ) : (
        <Card className="space-y-2">
          {data.profile.name && <p className="text-lg font-semibold">{data.profile.name}</p>}
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Objetivo</dt>
              <dd>{GOALS[data.profile.goal]}</dd>
            </div>
            <div>
              <dt className="text-muted">Experiência</dt>
              <dd>{EXPERIENCE[data.profile.experience]}</dd>
            </div>
            <div>
              <dt className="text-muted">Dias disponíveis</dt>
              <dd>{data.profile.days.map((d) => WEEKDAYS[d]).join(", ")}</dd>
            </div>
            <div>
              <dt className="text-muted">Meta semanal</dt>
              <dd>{data.profile.weeklyGoal} treinos</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Equipamentos</dt>
              <dd>{data.profile.equipment.map((e) => EQUIPMENT[e]).join(", ") || "Nenhum informado"}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => (setP(data.profile), setEditing(true))}>
              Editar perfil
            </button>
            <button type="button" className="btn-secondary" onClick={() => (setAdded(false), setSuggestion(suggestPlan(data.profile, Date.now())))}>
              Ver plano sugerido
            </button>
          </div>
        </Card>
      )}

      {suggestion && (
        <Card className="anim-fade space-y-3 border-bronze/60" aria-live="polite">
          <p className="eyebrow">Sugestão de plano inicial</p>
          <h2 className="font-display text-2xl font-bold">Modelo {TEMPLATES.find((t) => t.id === suggestion.templateId)?.name}</h2>
          <p className="text-sm text-sand">{suggestion.reason}</p>
          <ul className="space-y-2">
            {suggestion.workouts.map((w) => (
              <li key={w.id} className="rounded-xl border border-line p-3">
                <p className="font-semibold">{w.name}</p>
                <p className="text-sm text-muted">{w.exercises.map((e) => `${EXERCISE_MAP[e.exerciseId]?.name} (${e.sets}×${e.repsMin}–${e.repsMax})`).join(" · ")}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">Ponto de partida editável. Ajuste exercícios, cargas e descanso ao seu nível; não é uma prescrição individual.</p>
          {added ? (
            <p role="status" className="text-sm text-ok">
              Treinos adicionados. <Link href="/treinos" className="underline">Revise e edite em Treinos</Link>.
            </p>
          ) : (
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => {
                addWorkouts(suggestion.workouts);
                setAdded(true);
              }}
            >
              Adicionar aos meus treinos
            </button>
          )}
        </Card>
      )}
    </div>
  );
}
