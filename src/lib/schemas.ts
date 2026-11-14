import { z } from "zod";
import { EQUIPMENT, EXPERIENCE, GOALS, MEASUREMENTS, MUSCLES } from "./types";

const equipment = z.enum(Object.keys(EQUIPMENT) as [keyof typeof EQUIPMENT, ...(keyof typeof EQUIPMENT)[]]);

export const workoutExerciseSchema = z.object({
  uid: z.string(),
  exerciseId: z.string(),
  sets: z.number().int().min(1).max(20),
  repsMin: z.number().int().min(1).max(300),
  repsMax: z.number().int().min(1).max(300),
  loadKg: z.number().min(0).max(1000),
  rir: z.number().int().min(0).max(10),
  restSec: z.number().int().min(0).max(1800),
  workSec: z.number().int().min(5).max(900).optional(),
  prepSec: z.number().int().min(0).max(300).optional(),
  superset: z.boolean().optional(),
  drops: z.number().int().min(0).max(3).optional()
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
  kind: z.enum(["aquecimento", "drop"]).optional(),
  completedAt: z.number()
});

const score = z.number().int().min(1).max(5);

const sessionSchema = z.object({
  id: z.string(),
  workoutId: z.string(),
  workoutName: z.string(),
  startedAt: z.number(),
  endedAt: z.number().optional(),
  endedManually: z.boolean().optional(),
  updatedAt: z.number().optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(
    z.object({
      exerciseId: z.string(),
      planned: workoutExerciseSchema.omit({ uid: true, exerciseId: true }),
      sets: z.array(setLogSchema),
      skipped: z.boolean(),
      swappedFrom: z.string().optional(),
      startedAt: z.number().optional(),
      finishedAt: z.number().optional()
    })
  ),
  progression: z
    .array(
      z.object({
        exerciseId: z.string(),
        fromKg: z.number().min(0),
        toKg: z.number().min(0),
        reps: z.number().min(0),
        kind: z.enum(["subir", "manter", "reduzir"]),
        applied: z.boolean()
      })
    )
    .max(60)
    .optional(),
  diary: z
    .object({
      nota: score.optional(),
      energia: score.optional(),
      sono: score.optional(),
      dor: score.optional()
    })
    .optional(),
  phase: z.enum(["base", "volume", "pesada", "alivio"]).optional(),
  currentIndex: z.number().int().min(0),
  rest: z.object({ startedAt: z.number(), endsAt: z.number(), reason: z.string().max(200).optional() }).nullable()
});

const muscle = z.enum(Object.keys(MUSCLES) as [keyof typeof MUSCLES, ...(keyof typeof MUSCLES)[]]);

export const customExerciseSchema = z.object({
  id: z.string().regex(/^cx_/),
  name: z.string().min(1).max(80),
  primary: muscle,
  secondary: z.array(muscle),
  equipment,
  isometric: z.boolean().optional(),
  instructions: z.array(z.string().max(300)).max(10),
  errors: z.array(z.string().max(300)).max(10),
  substitutions: z.array(z.string()).max(10),
  custom: z.boolean().optional()
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
  bodyWeights: z.array(
    z.object({
      id: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      kg: z.number().min(20).max(400)
    })
  ),
  customExercises: z.array(customExerciseSchema).optional(),
  measurements: z
    .array(
      z.object({
        id: z.string(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        cm: z.partialRecord(z.enum(Object.keys(MEASUREMENTS) as [keyof typeof MEASUREMENTS, ...(keyof typeof MEASUREMENTS)[]]), z.number().min(10).max(300))
      })
    )
    .optional(),
  profileUpdatedAt: z.number().optional(),
  tombstones: z.record(z.string(), z.number()).optional(),
  nutrition: z
    .object({
      proteinPerKg: z.number().min(0.8).max(3).optional(),
      proteinGoalG: z.number().min(20).max(400).optional(),
      waterGoalMl: z.number().min(500).max(8000).optional(),
      goalsUpdatedAt: z.number().optional(),
      days: z.record(
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        z.object({
          proteinG: z.number().min(0).max(1000),
          waterMl: z.number().min(0).max(20000),
          onPlan: z.boolean().optional(),
          updatedAt: z.number()
        })
      )
    })
    .optional(),
  shoppingList: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().min(1).max(120),
        qtd: z.string().max(200).optional(),
        done: z.boolean(),
        recipeId: z.string().optional(),
        updatedAt: z.number()
      })
    )
    .max(500)
    .optional()
});

export const exportSchema = z.object({
  app: z.literal("bodybuilder"),
  version: z.number(),
  exportedAt: z.string(),
  data: datasetSchema
});

export type ExportFile = z.infer<typeof exportSchema>;
