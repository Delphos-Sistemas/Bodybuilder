import type { Profile, Workout } from "./types";
import { TEMPLATES, adaptToEquipment, workoutsFromTemplate } from "@/data/templates";

export type PlanSuggestion = {
  templateId: string;
  reason: string;
  workouts: Workout[];
};

/**
 * Sugestão inicial simples, baseada em regras fixas (dias disponíveis, experiência e equipamentos).
 * Não é prescrição: o usuário revisa e edita tudo antes de usar.
 */
export function suggestPlan(profile: Profile, now: number): PlanSuggestion {
  const days = profile.days.length;
  let templateId = "full-body";
  let reason = "Com até 2 dias por semana, treinar o corpo inteiro em cada sessão distribui melhor o estímulo.";
  if (days === 3) {
    templateId = profile.experience === "iniciante" ? "full-body" : "abc";
    reason =
      profile.experience === "iniciante"
        ? "Com 3 dias e pouca experiência, o Full Body repete os movimentos básicos e facilita aprender a técnica."
        : "Com 3 dias, o ABC permite trabalhar cada grupo com mais volume por sessão.";
  } else if (days === 4) {
    templateId = "upper-lower";
    reason = "Com 4 dias, alternar superiores e inferiores treina cada região duas vezes por semana.";
  } else if (days >= 5) {
    templateId = profile.experience === "iniciante" ? "abc" : "ppl";
    reason =
      profile.experience === "iniciante"
        ? "Com 5 ou mais dias, o ABC repetido mantém sessões curtas e organizadas."
        : "Com 5 ou mais dias, o Push/Pull/Legs permite repetir cada treino duas vezes por semana.";
  }
  // objetivo força: modelos próprios de força (o iniciante aprende a técnica antes, com o plano padrão)
  if (profile.goal === "forca" && profile.experience !== "iniciante" && days >= 3) {
    templateId = days >= 4 ? "forca-4-dias" : "forca-5x5";
    reason =
      days >= 4
        ? "Para ganhar força com 4 ou mais dias, o Força 4 dias treina os básicos pesados duas vezes por semana."
        : "Para ganhar força com 3 dias, o 5×5 foca nos básicos com carga alta e progressão constante.";
  }
  const template = TEMPLATES.find((t) => t.id === templateId)!;
  const strengthTemplate = template.goal === "forca";
  let workouts = workoutsFromTemplate(template, now).map((w) => adaptToEquipment(w, profile.equipment));
  if (profile.goal === "forca" && !strengthTemplate) {
    workouts = workouts.map((w) => ({
      ...w,
      exercises: w.exercises.map((e, i) => (i < 2 && e.repsMin > 3 ? { ...e, repsMin: 4, repsMax: 6, restSec: Math.max(e.restSec, 180) } : e))
    }));
  } else if (profile.goal === "emagrecimento" || profile.goal === "condicionamento") {
    workouts = workouts.map((w) => ({
      ...w,
      exercises: w.exercises.map((e) => ({
        ...e,
        restSec: Math.min(e.restSec, 75)
      }))
    }));
  }
  return { templateId, reason, workouts };
}
