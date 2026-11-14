import type { ExerciseSet, WorkoutExercise } from "@/types/domain";

export function calculateVolume(sets: Pick<ExerciseSet, "weight" | "reps">[]): number {
  return sets.reduce((total, set) => total + set.weight * set.reps, 0);
}

export function shouldSuggestDoubleProgression(
  prescription: Pick<WorkoutExercise, "sets" | "maxReps" | "targetRir">,
  completedSets: Pick<ExerciseSet, "reps" | "rir">[]
): boolean {
  if (completedSets.length < prescription.sets) return false;
  return completedSets
    .slice(0, prescription.sets)
    .every((set) => set.reps >= prescription.maxReps && set.rir >= prescription.targetRir);
}

export function nextLoadSuggestion(currentWeight: number, primaryMuscle: string): string {
  const lowerBody = ["Quadriceps", "Posteriores", "Gluteos", "Panturrilhas"].includes(primaryMuscle);
  const min = lowerBody ? currentWeight * 1.05 : currentWeight * 1.02;
  const max = lowerBody ? currentWeight * 1.1 : currentWeight * 1.05;
  return `Sugestao: testar entre ${min.toFixed(1)} kg e ${max.toFixed(1)} kg no proximo treino.`;
}

export function readinessRecommendation(readiness: string): string {
  if (readiness === "Muito fatigado") {
    return "Reduza a carga em 10%, tire uma serie dos acessorios e evite falha muscular hoje.";
  }
  if (readiness === "Dolorido") return "Priorize amplitude confortavel, tecnica limpa e aquecimento mais longo.";
  if (readiness === "Cansado") return "Mantenha o plano, mas preserve 2 a 3 repeticoes em reserva.";
  if (readiness === "Excelente") return "Bom dia para executar com intencao. Progrida apenas se a tecnica acompanhar.";
  return "Siga o plano e registre tudo. Constancia antes de intensidade.";
}
