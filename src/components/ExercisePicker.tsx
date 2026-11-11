"use client";

import { Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EXERCISES } from "@/data/exercises";
import { getMedia } from "@/data/media";
import { matchesSearch } from "@/lib/text";
import { EQUIPMENT, MUSCLES } from "@/lib/types";

export function ExercisePicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (id: string) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [added, setAdded] = useState<string[]>([]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setAdded([]);
      d.showModal();
    }
    if (!open && d.open) d.close();
  }, [open]);

  const list = useMemo(() => EXERCISES.filter((e) => matchesSearch([e.name, MUSCLES[e.primary], EQUIPMENT[e.equipment]], q)), [q]);

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="picker-titulo" className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/70 sm:m-auto sm:h-[85vh] sm:max-w-xl sm:rounded-2xl">
      <div className="anim-sheet flex h-full flex-col bg-graphite text-parchment sm:rounded-2xl sm:border sm:border-line">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h2 id="picker-titulo" className="font-display text-xl font-bold">
            Adicionar exercício
          </h2>
          <button type="button" className="btn-primary min-h-11 px-4" onClick={onClose}>
            <X size={18} aria-hidden /> Concluir
          </button>
        </div>
        <div className="border-b border-line p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} aria-hidden />
            <label htmlFor="picker-busca" className="sr-only">
              Buscar exercício
            </label>
            <input id="picker-busca" type="search" className="input pl-10" placeholder="Buscar exercício" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <ul className="flex-1 divide-y divide-line overflow-y-auto">
          {list.map((e) => {
            const count = added.filter((a) => a === e.id).length;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-steel"
                  onClick={() => {
                    onPick(e.id);
                    setAdded((a) => [...a, e.id]);
                  }}
                  aria-label={`Adicionar ${e.name}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getMedia(e.id)?.poster} alt="" className="h-14 w-[74px] shrink-0 rounded-lg bg-[#ECEBE7] object-contain" loading="lazy" width={74} height={56} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{e.name}</span>
                    <span className="block text-sm text-muted">
                      {MUSCLES[e.primary]} · {EQUIPMENT[e.equipment]}
                    </span>
                  </span>
                  {count > 0 ? <span className="text-sm text-ok">Adicionado{count > 1 ? ` ×${count}` : ""}</span> : <Plus size={20} className="text-bronze-light" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </dialog>
  );
}
