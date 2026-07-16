import { z } from "zod";

export const onboardingSchema = z.object({
  name: z.string().min(2),
  birthDate: z.string().min(8),
  heightCm: z.number().min(100).max(230),
  currentWeightKg: z.number().min(30).max(250),
  experienceLevel: z.enum(["Iniciante", "Intermediario", "Avancado"]),
  goals: z.array(z.string()).min(1).max(3)
});
