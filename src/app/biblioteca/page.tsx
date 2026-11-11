"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ExerciseCard } from "@/components/ExerciseCard";
import { ExerciseSheet } from "@/components/ExerciseSheet";
import { EmptyState, PageHeader } from "@/components/ui";
import { EXERCISES } from "@/data/exercises";
import { matchesSearch } from "@/lib/text";
import { EQUIPMENT, MUSCLES, type Equipment, type Muscle } from "@/lib/types";

const usedMuscles = [...new Set(EXERCISES.map((e) => e.primary))] as Muscle[];
const usedEquipment = [...new Set(EXERCISES.map((e) => e.equipment))] as Equipment[];

export default function BibliotecaPage() {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<Muscle | "">("");
  const [equipment, setEquipment] = useState<Equipment | "">("");
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(
    () =>
      EXERCISES.filter(
        (e) =>
          (!muscle || e.primary === muscle || e.secondary.includes(muscle)) &&
          (!equipment || e.equipment === equipment) &&
          matchesSearch([e.name, MUSCLES[e.primary], EQUIPMENT[e.equipment], ...e.secondary.map((m) => MUSCLES[m])], query)
      ),
    [query, muscle, equipment]
  );

  return (
    <div>
      <PageHeader eyebrow={`${EXERCISES.length} exercícios`} title="Biblioteca" />
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} aria-hidden />
          <label htmlFor="busca" className="sr-only">
            Buscar exercício
          </label>
          <input id="busca" type="search" className="input pl-10" placeholder="Buscar (ex.: supino, triceps, agachamento)" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div>
          <label htmlFor="filtro-musculo" className="sr-only">
            Filtrar por músculo
          </label>
          <select id="filtro-musculo" className="input" value={muscle} onChange={(e) => setMuscle(e.target.value as Muscle | "")}>
            <option value="">Todos os músculos</option>
            {usedMuscles.map((m) => (
              <option key={m} value={m}>
                {MUSCLES[m]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filtro-equipamento" className="sr-only">
            Filtrar por equipamento
          </label>
          <select id="filtro-equipamento" className="input" value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment | "")}>
            <option value="">Todos os equipamentos</option>
            {usedEquipment.map((m) => (
              <option key={m} value={m}>
                {EQUIPMENT[m]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="mb-3 text-sm text-muted" aria-live="polite">
        {list.length === 1 ? "1 exercício encontrado" : `${list.length} exercícios encontrados`}
      </p>
      {list.length ? (
        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((e) => (
            <ExerciseCard key={e.id} exercise={e} onOpen={setOpen} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum exercício encontrado"
          text="Tente outro termo ou limpe os filtros."
          action={
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setQuery("");
                setMuscle("");
                setEquipment("");
              }}
            >
              Limpar filtros
            </button>
          }
        />
      )}
      <ExerciseSheet exerciseId={open} onClose={() => setOpen(null)} onSelect={setOpen} />
    </div>
  );
}
