"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { EQUIPMENT, MUSCLES, type Equipment, type Exercise, type Muscle } from "@/lib/types";

const lines = (t: string) =>
  t
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((s) => s.slice(0, 300));

/** Criar ou editar um exercício próprio (sem demonstração em mídia). */
export function CustomExerciseForm({
  open,
  initial,
  onClose,
  onSaved
}: {
  open: boolean;
  initial?: Exercise;
  onClose: () => void;
  onSaved?: (id: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const save = useStore((s) => s.saveCustomExercise);
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState<Muscle>("peito");
  const [secondary, setSecondary] = useState<Muscle[]>([]);
  const [equipment, setEquipment] = useState<Equipment>("maquina");
  const [isometric, setIsometric] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [errors, setErrors] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setName(initial?.name ?? "");
      setPrimary(initial?.primary ?? "peito");
      setSecondary(initial?.secondary ?? []);
      setEquipment(initial?.equipment ?? "maquina");
      setIsometric(initial?.isometric ?? false);
      setInstructions(initial?.instructions.join("\n") ?? "");
      setErrors(initial?.errors.join("\n") ?? "");
      setErr("");
      d.showModal();
    }
    if (!open && d.open) d.close();
  }, [open, initial]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErr("Dê um nome ao exercício.");
      document.getElementById("cx-nome")?.focus();
      return;
    }
    const id = save({
      id: initial?.id,
      name: name.trim().slice(0, 80),
      primary,
      secondary: secondary.filter((m) => m !== primary),
      equipment,
      ...(isometric ? { isometric: true } : {}),
      instructions: lines(instructions),
      errors: lines(errors),
      substitutions: []
    });
    onSaved?.(id);
    onClose();
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="cx-titulo"
      className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/70 sm:m-auto sm:h-auto sm:max-h-[92vh] sm:max-w-xl sm:rounded-2xl"
    >
      <form onSubmit={submit} className="anim-sheet flex h-full flex-col overflow-y-auto bg-graphite text-parchment sm:rounded-2xl sm:border sm:border-line">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-line bg-graphite/95 px-4 py-3">
          <h2 id="cx-titulo" className="font-display text-xl font-bold">
            {initial ? "Editar exercício" : "Criar exercício"}
          </h2>
          <button type="button" className="btn-ghost min-h-11 px-3" onClick={onClose} aria-label="Fechar">
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="space-y-4 p-4">
          <div>
            <label htmlFor="cx-nome" className="label">
              Nome do exercício
            </label>
            <input
              id="cx-nome"
              className="input"
              maxLength={80}
              value={name}
              placeholder="Ex.: Remada articulada da minha academia"
              onChange={(e) => (setName(e.target.value), setErr(""))}
              aria-invalid={!!err}
            />
            {err && (
              <p role="alert" className="mt-1 text-sm text-danger">
                {err}
              </p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="cx-musculo" className="label">
                Músculo principal
              </label>
              <select id="cx-musculo" className="input" value={primary} onChange={(e) => setPrimary(e.target.value as Muscle)}>
                {(Object.keys(MUSCLES) as Muscle[]).map((m) => (
                  <option key={m} value={m}>
                    {MUSCLES[m]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cx-equip" className="label">
                Equipamento
              </label>
              <select id="cx-equip" className="input" value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}>
                {(Object.keys(EQUIPMENT) as Equipment[]).map((m) => (
                  <option key={m} value={m}>
                    {EQUIPMENT[m]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <fieldset>
            <legend className="label">Músculos secundários (opcional)</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(MUSCLES) as Muscle[])
                .filter((m) => m !== primary)
                .map((m) => {
                  const on = secondary.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={on}
                      className={clsx("chip", on && "chip-on")}
                      onClick={() => setSecondary((l) => (on ? l.filter((x) => x !== m) : [...l, m]))}
                    >
                      {MUSCLES[m]}
                    </button>
                  );
                })}
            </div>
          </fieldset>
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" className="h-5 w-5 accent-[#B07D45]" checked={isometric} onChange={(e) => setIsometric(e.target.checked)} />
            Isométrico (séries medidas em segundos)
          </label>
          <div>
            <label htmlFor="cx-como" className="label">
              Como fazer (opcional, um passo por linha)
            </label>
            <textarea id="cx-como" className="input min-h-24 py-2" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          </div>
          <div>
            <label htmlFor="cx-erros" className="label">
              Cuidados e erros comuns (opcional, um por linha)
            </label>
            <textarea id="cx-erros" className="input min-h-20 py-2" value={errors} onChange={(e) => setErrors(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full">
            Salvar exercício
          </button>
        </div>
      </form>
    </dialog>
  );
}
