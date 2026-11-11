"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { ProgressBar } from "./ui";
import { dailyGoals, dayOf } from "@/lib/nutrition";
import { useData, useStore } from "@/lib/store";
import { todayISO } from "@/lib/time";

/** Resumo de proteína e água do dia, com registro rápido de água, para a tela inicial. */
export function NutritionCard() {
  const data = useData();
  const log = useStore((s) => s.logNutrition);
  const today = todayISO();
  const day = dayOf(data.nutrition, today);
  const goals = dailyGoals(data.nutrition, data.bodyWeights);
  return (
    <section aria-labelledby="nutricao-inicio" className="card space-y-3" data-testid="nutricao-inicio">
      <div className="flex items-center justify-between">
        <h2 id="nutricao-inicio" className="eyebrow">
          Nutrição de hoje
        </h2>
        <Link href="/nutricao" className="flex items-center gap-1 text-sm text-bronze-light">
          Abrir <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="text-sm text-sand">
            Proteína: <strong className="text-parchment">{day.proteinG.toLocaleString("pt-BR")} g</strong>
            {goals.proteinG ? ` de ${goals.proteinG.toLocaleString("pt-BR")} g` : ""}
          </p>
          {goals.proteinG ? <ProgressBar value={day.proteinG / goals.proteinG} label="Proteína de hoje" /> : null}
        </div>
        <div className="space-y-1.5">
          <p className="text-sm text-sand">
            Água: <strong className="text-parchment">{day.waterMl.toLocaleString("pt-BR")} ml</strong> de {goals.waterMl.toLocaleString("pt-BR")} ml
          </p>
          <ProgressBar value={day.waterMl / goals.waterMl} label="Água de hoje" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-secondary min-h-10 px-3 text-sm" onClick={() => log(today, { waterMl: 250 })}>
          +250 ml de água
        </button>
        <button type="button" className="btn-secondary min-h-10 px-3 text-sm" onClick={() => log(today, { proteinG: 25 })}>
          +25 g de proteína
        </button>
        {day.onPlan && (
          <span className="flex items-center gap-1 text-sm text-ok">
            <Check size={16} aria-hidden /> Plano seguido hoje
          </span>
        )}
      </div>
    </section>
  );
}
