"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  nome: z.string().min(2),
  altura: z.coerce.number().min(100).max(230),
  peso: z.coerce.number().min(30).max(250)
});

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ nome: "Tiago", altura: "178", peso: "86.4" });
  const valid = schema.safeParse(form).success;
  const titles = ["Perfil", "Objetivos", "Disponibilidade", "Limitacoes", "Estrutura", "Plano inicial"];
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-4xl font-black">Onboarding</h1>
      <Card className="space-y-4">
        <p className="text-sm text-bronze-light">Etapa {step} de 6 · {titles[step - 1]}</p>
        {step === 1 && (
          <div className="space-y-3">
            <Input aria-label="Nome" value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} />
            <Input aria-label="Altura" value={form.altura} onChange={(event) => setForm({ ...form, altura: event.target.value })} />
            <Input aria-label="Peso" value={form.peso} onChange={(event) => setForm({ ...form, peso: event.target.value })} />
          </div>
        )}
        {step === 2 && <Checklist items={["Hipertrofia", "Emagrecimento", "Forca", "Condicionamento", "Saude", "Manutencao"]} />}
        {step === 3 && <Checklist items={["3 dias", "4 dias", "5 dias", "6 dias", "Cardio a tarde", "Domingo descanso"]} />}
        {step === 4 && <p className="text-sand">Este aplicativo nao substitui orientacao medica, fisioterapeutica ou acompanhamento presencial de um profissional de educacao fisica.</p>}
        {step === 5 && <Checklist items={["Academia completa", "Academia basica", "Treino em casa", "Somente halteres", "Peso corporal"]} />}
        {step === 6 && <p className="text-sand">Plano sugerido: Push, Pull, Legs, Push, Pull, Legs. Voce pode editar antes de confirmar.</p>}
        <div className="flex justify-between gap-3">
          <Button variant="secondary" disabled={step === 1} onClick={() => setStep(step - 1)}>Voltar</Button>
          <Button disabled={!valid} onClick={() => setStep(Math.min(6, step + 1))}>{step === 6 ? "Confirmar" : "Avancar"}</Button>
        </div>
      </Card>
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <label key={item} className="flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-iron px-3 text-sand">
          <input type="checkbox" defaultChecked={item.includes("Hipertrofia") || item.includes("6 dias")} /> {item}
        </label>
      ))}
    </div>
  );
}
