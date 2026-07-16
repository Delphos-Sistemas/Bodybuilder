"use client";

import { Card } from "@/components/ui/Card";
import { MascotMessage } from "@/components/mascot/MascotMessage";
import { useAppStore } from "@/stores/appStore";

export default function HistoricoPage() {
  const { sessions, plan } = useAppStore();
  const finished = sessions.filter((item) => item.finishedAt);
  return (
    <div className="space-y-5">
      <MascotMessage variant="achievement" title="Historico" message="Nao persiga apenas numeros. Construa capacidade." />
      <div className="space-y-3">
        {finished.map((session) => {
          const day = plan.days.find((item) => item.id === session.workoutDayId);
          return (
            <Card key={session.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-bronze-light">{new Date(session.startedAt).toLocaleDateString("pt-BR")}</p>
                <h2 className="text-xl font-black">{day?.name ?? "Treino"}</h2>
                <p className="text-sm text-sand">{session.sets.length} series · volume {session.totalVolume.toFixed(0)} kg · dificuldade {session.difficulty ?? "-"}/10</p>
              </div>
              <span className="rounded-lg border border-white/10 px-3 py-2 text-sm text-sand">{Math.round(session.durationSeconds / 60)} min</span>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
