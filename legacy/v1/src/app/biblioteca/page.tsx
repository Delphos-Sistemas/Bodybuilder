"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ExerciseVisual } from "@/components/exercises/ExerciseVisual";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { exercises } from "@/data/exercises";
import { ptLabel } from "@/lib/format";

export default function BibliotecaPage() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("Todos");
  const groups = ["Todos", ...Array.from(new Set(exercises.map((exercise) => exercise.primaryMuscle)))];
  const filtered = useMemo(
    () =>
      exercises.filter(
        (exercise) =>
          (group === "Todos" || exercise.primaryMuscle === group) &&
          exercise.name.toLowerCase().includes(query.toLowerCase())
      ),
    [group, query]
  );

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm uppercase text-bronze-light">Biblioteca</p>
        <h1 className="font-display text-4xl font-black">50 exercícios iniciais</h1>
      </header>
      <Card className="grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="relative">
          <Search className="absolute left-3 top-3 text-sand" size={18} />
          <Input
            className="pl-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar exercício"
          />
        </label>
        <select
          className="min-h-11 rounded-lg border border-white/10 bg-iron px-3 text-parchment"
          value={group}
          onChange={(event) => setGroup(event.target.value)}
        >
          {groups.map((item) => (
            <option key={item} value={item}>
              {ptLabel(item)}
            </option>
          ))}
        </select>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((exercise) => (
          <Card key={exercise.id}>
            <div className="mb-3">
              <ExerciseVisual exercise={exercise} compact />
            </div>
            <p className="text-sm text-bronze-light">
              {ptLabel(exercise.primaryMuscle)} · {ptLabel(exercise.equipment)}
            </p>
            <h2 className="text-xl font-black">{exercise.name}</h2>
            <p className="mt-2 text-sm text-sand">{exercise.instructions.join(" ")}</p>
            <p className="mt-3 text-xs text-sand">Substituições: {exercise.substitutions.slice(0, 2).join(", ")}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
