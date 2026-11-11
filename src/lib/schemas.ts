import { z } from "zod";
import { EQUIPMENT, EXPERIENCE, GOALS } from "./types";

const equipment = z.enum(Object.keys(EQUIPMENT) as [keyof typeof EQUIPMENT, ...(keyof typeof EQUIPMENT)[]]);

export const workoutExerciseSchema = z.object({
  uid: z.string(),
  exerciseId: z.string(),
  sets: z.number().int().min(1).max(20),
  repsMin: z.number().int().min(1).max(300),
  repsMax: z.number().int().min(1).max(300),
  loadKg: z.number().min(0).max(1000),
  rir: z.number().int().min(0).max(10),
  restSec: z.number().int().min(0).max(1800)
});

export const workoutSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  notes: z.string().max(500),
  exercises: z.array(workoutExerciseSchema),
  createdAt: z.number(),
  updatedAt: z.number()
});

const setLogSchema = z.object({
  reps: z.number().min(0),
  loadKg: z.number().min(0),
  rir: z.number().min(0),
  pain: z.string().max(200).optional(),
  completedAt: z.number()
});

const sessionSchema = z.object({
  id: z.string(),
  workoutId: z.string(),
  workoutName: z.string(),
  startedAt: z.number(),
  endedAt: z.number().optional(),
  endedManually: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(
    z.object({
      exerciseId: z.string(),
      planned: workoutExerciseSchema.omit({ uid: true, exerciseId: true }),
      sets: z.array(setLogSchema),
      skipped: z.boolean(),
      startedAt: z.number().optional(),
      finishedAt: z.number().optional()
    })
  ),
  currentIndex: z.number().int().min(0),
  rest: z.object({ startedAt: z.number(), endsAt: z.number() }).nullable()
});

export const profileSchema = z.object({
  name: z.string().max(60),
  goal: z.enum(Object.keys(GOALS) as [keyof typeof GOALS, ...(keyof typeof GOALS)[]]),
  experience: z.enum(Object.keys(EXPERIENCE) as [keyof typeof EXPERIENCE, ...(keyof typeof EXPERIENCE)[]]),
  days: z.array(z.number().int().min(0).max(6)),
  equipment: z.array(equipment),
  weeklyGoal: z.number().int().min(1).max(7),
  onboarded: z.boolean()
});

export const datasetSchema = z.object({
  profile: profileSchema,
  workouts: z.array(workoutSchema),
  sessions: z.array(sessionSchema),
  activeSession: sessionSchema.nullable(),
  bodyWeights: z.array(z.object({ id: z.string(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), kg: z.number().min(20).max(400) }))
});

export const exportSchema = z.object({
  app: z.literal("bodybuilder"),
  version: z.number(),
  exportedAt: z.string(),
  data: datasetSchema
});

export type ExportFile = z.infer<typeof exportSchema>;
