"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/stores/appStore";

export default function AvaliacaoSemanalPage() {
  const submitCheckin = useAppStore((state) => state.submitCheckin);
  const latest = useAppStore((state) => state.checkins[0]);
  const [values, setValues] = useState({ trainedDays: 5, energy: 4, sleep: 3, motivation: 4, soreness: 3, jointPain: 1, nutrition: 4, stress: 3 });
  const [saved, setSaved] = useState(false);
  function save() {
    submitCheckin({ ...values, nextWeekTime: "60 minutos", agendaChanged: false });
    setSaved(true);
  }
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-4xl font-black">Avaliacao semanal</h1>
      <Card className="space-y-3">
        {Object.entries(values).map(([key, value]) => (
          <label key={key} className="block text-sm text-sand">
            {key}
            <Input type="number" min={key === "trainedDays" ? 0 : 1} max={key === "trainedDays" ? 7 : 5} value={value} onChange={(event) => setValues({ ...values, [key]: Number(event.target.value) })} />
          </label>
        ))}
        <Button onClick={save} className="w-full">Salvar check-in</Button>
      </Card>
      {(saved || latest) && (
        <Card>
          <h2 className="font-bold">Recomendacao</h2>
          <p className="mt-2 text-sand">{latest?.recommendation}</p>
        </Card>
      )}
    </div>
  );
}
