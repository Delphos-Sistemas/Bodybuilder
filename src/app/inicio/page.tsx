"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, AlertTriangle, CalendarDays, Dumbbell, Flame, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MascotMessage } from "@/components/mascot/MascotMessage";
import { useAppStore } from "@/stores/appStore";
import type { Readiness } from "@/types/domain";
import { readinessRecommendation } from "@/utils/progression";

export default function InicioPage() {
  const router = useRouter();
  const { profile, plan, sessions, weightLogs, readiness, setReadiness, startWorkout, checkins } = useAppStore();
  const today = plan.days[(new Date().getDay() + 5) % plan.days.length] ?? plan.days[0];
  const completedThisWeek = sessions.filter((session) => session.finishedAt).slice(0, 6).length;

  function handleStart() {
    const sessionId = startWorkout(today.id);
    router.push(`/treino-ativo/${sessionId}`);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase text-bronze-light">{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
          <h1 className="font-display text-4xl font-black">Bom treino, {profile.name.split(" ")[0]}.</h1>
        </div>
        <Button onClick={handleStart}>
          <Play size={18} /> Iniciar treino
        </Button>
      </header>

      <MascotMessage title="Foco do dia" message="Hoje, execute o que foi planejado. O treino termina. A construcao continua." />

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-sand">Treino de hoje</p>
              <h2 className="text-2xl font-black">{today.name}</h2>
              <p className="mt-1 text-sand">{today.muscleGroups.join(", ")} · {today.exercises.length} exercicios · {today.estimatedDurationMinutes} min</p>
            </div>
            <Dumbbell className="text-bronze-light" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat icon={<CalendarDays />} label="Semana" value={`${completedThisWeek}/${profile.weeklyTarget}`} />
            <Stat icon={<Flame />} label="Sequencia" value="3 semanas" />
            <Stat icon={<Activity />} label="Peso atual" value={`${weightLogs[0]?.weightKg ?? profile.currentWeightKg} kg`} />
          </div>
        </Card>
        <Card>
          <h2 className="font-bold">Como voce esta hoje?</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["Excelente", "Bem", "Cansado", "Dolorido", "Muito fatigado"] as Readiness[]).map((item) => (
              <button
                key={item}
                onClick={() => setReadiness(item)}
                className={`min-h-11 rounded-lg border px-3 text-sm ${readiness === item ? "border-bronze bg-bronze text-iron" : "border-white/10 bg-iron text-sand"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-sand">{readinessRecommendation(readiness)}</p>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="font-bold">Proximo treino</h3>
          <p className="mt-2 text-sand">{plan.days[1]?.name}</p>
        </Card>
        <Card>
          <h3 className="font-bold">Fadiga</h3>
          <p className="mt-2 text-sand">{checkins[0]?.recommendation}</p>
        </Card>
        <Card className="border-danger/30">
          <h3 className="flex items-center gap-2 font-bold"><AlertTriangle size={18} /> Registrar dor</h3>
          <p className="mt-2 text-sand">Dor forte, persistente ou progressiva pede avaliacao profissional.</p>
        </Card>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-iron p-3">
      <div className="text-bronze-light">{icon}</div>
      <p className="mt-2 text-xs text-sand">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  );
}
