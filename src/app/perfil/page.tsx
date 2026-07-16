"use client";

import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useAppStore } from "@/stores/appStore";

export default function PerfilPage() {
  const { profile, achievements, plan } = useAppStore();
  return (
    <div className="space-y-5">
      <Card className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="grid h-24 w-24 place-items-center rounded-lg border border-bronze/40 bg-iron font-display text-4xl font-black text-bronze-light">BB</div>
        <div>
          <p className="text-sm text-bronze-light">Perfil</p>
          <h1 className="font-display text-4xl font-black">{profile.name}</h1>
          <p className="text-sand">{profile.experienceLevel} · {profile.heightCm} cm · {profile.currentWeightKg} kg · meta {profile.weeklyTarget}x/semana</p>
          <p className="mt-2 text-sm text-sand">Objetivos: {profile.goals.join(", ")}</p>
        </div>
      </Card>
      <Card>
        <h2 className="font-bold">Treino atual</h2>
        <p className="mt-2 text-sand">{plan.name} · {plan.daysPerWeek} dias por semana</p>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {achievements.map((item) => (
          <Card key={item.id} className="flex gap-3">
            <Trophy className="shrink-0 text-bronze-light" />
            <div>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-sand">{item.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
