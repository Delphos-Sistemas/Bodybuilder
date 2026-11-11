"use client";

import { useMemo } from "react";
import { EXERCISES } from "@/data/exercises";
import { useData } from "./store";
import type { Exercise } from "./types";

/** Biblioteca completa: exercícios incluídos no app e os criados pelo usuário. */
export function useAllExercises(): Exercise[] {
  const custom = useData().customExercises;
  return useMemo(() => [...EXERCISES, ...(custom ?? []).map((c) => ({ ...c, custom: true }))], [custom]);
}
