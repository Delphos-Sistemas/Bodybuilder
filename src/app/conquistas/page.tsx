"use client";

import clsx from "clsx";
import { Award, CalendarCheck, Dumbbell, Flame, Lock, Medal as MedalIcon, Sparkles, Trophy, Weight } from "lucide-react";
import { useMemo } from "react";
import { Card, PageHeader, ProgressBar } from "@/components/ui";
import { dayStreak, medals, monthGoals, weekStreak, type Medal } from "@/lib/achievements";
import { useData } from "@/lib/store";
import { formatDateShort } from "@/lib/time";

const GROUPS: { key: Medal["group"]; title: string; icon: typeof Award }[] = [
  { key: "constancia", title: "Constância", icon: Flame },
  { key: "treinos", title: "Treinos", icon: Dumbbell },
  { key: "volume", title: "Volume levantado", icon: Weight },
  { key: "recordes", title: "Recordes", icon: Trophy },
  { key: "especiais", title: "Especiais", icon: Sparkles }
];

export default function ConquistasPage() {
  const data = useData();
  const now = Date.now();
  const goal = data.profile.weeklyGoal;
  const all = useMemo(() => medals(data.sessions, goal, now), [data.sessions, goal]); // eslint-disable-line react-hooks/exhaustive-deps
  const streak = weekStreak(data.sessions, goal, now);
  const days = dayStreak(data.sessions, now);
  const month = monthGoals(data.sessions, goal, now);
  const got = all.filter((m) => m.achievedAt).length;
  const volDiff = month.volume.lastMonth ? Math.round((month.volume.value / month.volume.lastMonth - 1) * 100) : null;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={`${got} de ${all.length} medalhas`} title="Desafios e conquistas" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="space-y-1 border-bronze/60" data-testid="sequencia-semanas">
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <Flame size={16} className="text-bronze-light" aria-hidden /> Sequência de semanas
          </p>
          <p className="font-display text-4xl font-bold text-bronze-light">
            {streak.current}
            <span className="text-lg text-muted"> {streak.current === 1 ? "semana" : "semanas"}</span>
          </p>
          <p className="text-xs text-muted">
            Semanas seguidas batendo a meta de {goal} treinos. Recorde: {streak.best}.
          </p>
        </Card>
        <Card className="space-y-1">
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <CalendarCheck size={16} aria-hidden /> Dias seguidos
          </p>
          <p className="font-display text-4xl font-bold">
            {days}
            <span className="text-lg text-muted"> {days === 1 ? "dia" : "dias"}</span>
          </p>
          <p className="text-xs text-muted">Dias de descanso fazem parte: a sequência que vale é a das semanas.</p>
        </Card>
        <Card className="space-y-1">
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <MedalIcon size={16} aria-hidden /> Medalhas
          </p>
          <p className="font-display text-4xl font-bold">
            {got}
            <span className="text-lg text-muted"> de {all.length}</span>
          </p>
          <ProgressBar value={got / all.length} label="Medalhas conquistadas" />
        </Card>
      </div>

      <Card className="space-y-4" data-testid="metas-mes">
        <h2 className="font-display text-xl font-bold">Metas de {month.label}</h2>
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span>Treinos no mês</span>
            <span className="font-semibold">
              {month.treinos.value} de {month.treinos.target}
            </span>
          </div>
          <ProgressBar value={month.treinos.value / month.treinos.target} label="Treinos no mês" />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span>Volume contra o mês passado (até o mesmo dia)</span>
            <span className="font-semibold">{volDiff === null ? "—" : `${volDiff >= 0 ? "+" : ""}${volDiff}%`}</span>
          </div>
          <ProgressBar value={month.volume.lastMonth ? month.volume.value / month.volume.lastMonth : month.volume.value ? 1 : 0} label="Volume do mês" />
          <p className="mt-1 text-xs text-muted">
            {Math.round(month.volume.value).toLocaleString("pt-BR")} kg neste mês · {Math.round(month.volume.lastMonth).toLocaleString("pt-BR")} kg no mesmo
            período do mês passado
          </p>
        </div>
        <p className="text-sm text-sand">
          {month.recordes} {month.recordes === 1 ? "recorde pessoal" : "recordes pessoais"} e {month.diasTreinados}{" "}
          {month.diasTreinados === 1 ? "dia treinado" : "dias treinados"} neste mês.
        </p>
      </Card>

      {GROUPS.map((g) => {
        const Icon = g.icon;
        const list = all.filter((m) => m.group === g.key);
        return (
          <section key={g.key} aria-labelledby={`grupo-${g.key}`} className="space-y-2">
            <h2 id={`grupo-${g.key}`} className="flex items-center gap-2 font-display text-lg font-bold">
              <Icon size={18} className="text-bronze-light" aria-hidden /> {g.title}
            </h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((m) => (
                <li
                  key={m.id}
                  className={clsx("rounded-2xl border p-3", m.achievedAt ? "border-bronze/70 bg-bronze/10" : "border-line bg-iron")}
                  data-testid={m.achievedAt ? "medalha-ok" : "medalha"}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={clsx(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        m.achievedAt ? "bg-bronze text-iron" : "bg-steel text-muted"
                      )}
                      aria-hidden
                    >
                      {m.achievedAt ? <Award size={20} /> : <Lock size={16} />}
                    </span>
                    <span className="min-w-0">
                      <span className={clsx("block font-semibold leading-tight", !m.achievedAt && "text-sand")}>{m.title}</span>
                      <span className="block text-xs text-muted">{m.text}</span>
                    </span>
                  </div>
                  {m.achievedAt ? (
                    <p className="mt-2 text-xs text-bronze-light">Conquistada em {formatDateShort(m.achievedAt)}</p>
                  ) : (
                    <div className="mt-2">
                      <ProgressBar value={m.progress} label={`Progresso de ${m.title}`} />
                      <p className="mt-1 text-xs text-muted">{m.progressText}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
