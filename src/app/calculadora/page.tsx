"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { Card, PageHeader, Stepper } from "@/components/ui";
import { EXERCISE_MAP } from "@/data/exercises";
import { fmt, platesPerSide } from "@/lib/progression";
import { allRecords, estimate1RM } from "@/lib/records";
import { useData } from "@/lib/store";

/** Percentuais do 1RM e repetições aproximadas (tabela comum de treino). */
const TABLE: [number, string][] = [
  [100, "1"],
  [95, "2"],
  [90, "3 a 4"],
  [85, "5 a 6"],
  [80, "7 a 8"],
  [75, "9 a 10"],
  [70, "11 a 12"],
  [65, "13 a 15"],
  [60, "16 a 20"],
  [50, "aquecimento"]
];

const ALL_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
// cores comuns das anilhas olímpicas
const PLATE_COLOR: Record<number, string> = { 25: "#C0392B", 20: "#2F5FA7", 15: "#D4AC0D", 10: "#2E8B57", 5: "#ECEBE7", 2.5: "#7A7A7A", 1.25: "#B0B0B0" };

export default function CalculadoraPage() {
  const data = useData();
  const records = useMemo(() => allRecords(data.sessions).filter((r) => r.best1RM), [data.sessions]);
  const [load, setLoad] = useState(60);
  const [reps, setReps] = useState(8);
  const [target, setTarget] = useState(80);
  const [bar, setBar] = useState(20);
  const [plates, setPlates] = useState<number[]>(ALL_PLATES);

  const oneRm = estimate1RM(load, reps);
  const result = platesPerSide(target, bar, plates);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Ferramentas" title="Calculadora de 1RM e anilhas" />

      <Card className="space-y-4" data-testid="calc-1rm">
        <h2 className="font-display text-xl font-bold">Carga máxima estimada (1RM)</h2>
        <p className="text-sm text-muted">
          Coloque uma série que você fez bem perto da falha. O app estima quanto você levantaria em 1 repetição, sem precisar testar.
        </p>
        {records.length > 0 && (
          <div>
            <label htmlFor="usar-recorde" className="label">
              Usar um recorde seu
            </label>
            <select
              id="usar-recorde"
              className="input"
              defaultValue=""
              onChange={(e) => {
                const r = records.find((x) => x.exerciseId === e.target.value);
                const m = r?.best1RM?.set.match(/([\d.]+) kg × (\d+)/);
                if (m) {
                  setLoad(parseFloat(m[1]));
                  setReps(parseInt(m[2], 10));
                }
              }}
            >
              <option value="">Escolha o exercício…</option>
              {records.map((r) => (
                <option key={r.exerciseId} value={r.exerciseId}>
                  {EXERCISE_MAP[r.exerciseId]?.name ?? r.exerciseId} ({r.best1RM!.set})
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Stepper id="calc-carga" label="Carga" suffix="kg" step={2.5} max={1000} value={load} onChange={setLoad} />
          <Stepper id="calc-reps" label="Repetições" min={1} max={30} value={reps} onChange={setReps} />
        </div>
        {oneRm === null ? (
          <p className="rounded-xl bg-iron p-3 text-sm text-sand">A estimativa só é confiável até 12 repetições e com carga. Tente uma série mais pesada.</p>
        ) : (
          <>
            <p className="text-center">
              <span className="block text-sm text-muted">1RM estimado</span>
              <span className="font-display text-5xl font-bold text-bronze-light" data-testid="resultado-1rm">
                {fmt(oneRm)} kg
              </span>
            </p>
            <table className="w-full text-sm">
              <caption className="sr-only">Cargas por percentual do 1RM</caption>
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="py-1 font-medium">% do 1RM</th>
                  <th className="py-1 font-medium">Carga</th>
                  <th className="py-1 text-right font-medium">Repetições</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {TABLE.map(([pct, r]) => {
                  const kg = Math.round((oneRm * pct) / 100 / 2.5) * 2.5;
                  return (
                    <tr key={pct}>
                      <td className="py-1.5">{pct}%</td>
                      <td className="py-1.5 font-semibold">
                        <button type="button" className="underline decoration-dotted" onClick={() => setTarget(Math.max(kg, bar))} title="Montar na barra">
                          {fmt(kg)} kg
                        </button>
                      </td>
                      <td className="py-1.5 text-right text-sand">{r}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-muted">Fórmula de Epley. Toque numa carga para montar na barra abaixo.</p>
          </>
        )}
      </Card>

      <Card className="space-y-4" data-testid="calc-anilhas">
        <h2 className="font-display text-xl font-bold">Anilhas na barra</h2>
        <div className="grid grid-cols-2 gap-3">
          <Stepper id="calc-alvo" label="Carga total" suffix="kg" step={2.5} max={1000} value={target} onChange={setTarget} />
          <div>
            <label htmlFor="calc-barra" className="label">
              Barra
            </label>
            <select id="calc-barra" className="input" value={bar} onChange={(e) => setBar(Number(e.target.value))}>
              {[20, 15, 10, 0].map((b) => (
                <option key={b} value={b}>
                  {b ? `${b} kg` : "sem barra (só anilhas)"}
                </option>
              ))}
            </select>
          </div>
        </div>
        <fieldset>
          <legend className="label">Anilhas que tem na sua academia</legend>
          <div className="flex flex-wrap gap-2">
            {ALL_PLATES.map((p) => {
              const on = plates.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={on}
                  className={clsx("chip", on && "chip-on")}
                  onClick={() => setPlates((l) => (on ? l.filter((x) => x !== p) : [...l, p].sort((a, b) => b - a)))}
                >
                  {fmt(p)} kg
                </button>
              );
            })}
          </div>
        </fieldset>
        {!result ? (
          <p className="text-sm text-danger">A carga é menor que a barra.</p>
        ) : (
          <>
            <BarDrawing plates={result.plates} />
            <p className="text-center text-lg" data-testid="resultado-anilhas">
              {result.plates.length ? (
                <>
                  Em cada lado: <strong>{result.plates.map((p) => fmt(p)).join(" + ")} kg</strong>
                </>
              ) : (
                "Só a barra."
              )}
            </p>
            {result.remainder > 0 && (
              <p className="text-center text-sm text-bronze-light">
                Com essas anilhas não fecha exato: ficam faltando {fmt(result.remainder)} kg (total {fmt(target - result.remainder)} kg).
              </p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function BarDrawing({ plates }: { plates: number[] }) {
  // um lado espelhado no outro; altura proporcional ao peso
  const h = (p: number) => 30 + Math.min(70, p * 2.8);
  const side = plates.map((p, i) => ({ p, i }));
  const width = 16;
  const W = 400;
  const cx = W / 2;
  return (
    <svg viewBox={`0 0 ${W} 120`} className="mx-auto h-28 w-full max-w-md" role="img" aria-label={`Barra com ${plates.length} anilhas de cada lado`}>
      <rect x="6" y="56" width={W - 12} height="8" rx="3" fill="#9C9284" />
      <rect x={cx - 40} y="54" width="80" height="12" rx="3" fill="#6E665C" />
      {side.map(({ p, i }) => {
        const xLeft = cx - 44 - (i + 1) * (width + 2);
        const xRight = cx + 44 + i * (width + 2);
        return (
          <g key={i}>
            <rect x={xLeft} y={60 - h(p) / 2} width={width} height={h(p)} rx="3" fill={PLATE_COLOR[p] ?? "#888"} stroke="#0B0A09" strokeWidth="1" />
            <rect x={xRight} y={60 - h(p) / 2} width={width} height={h(p)} rx="3" fill={PLATE_COLOR[p] ?? "#888"} stroke="#0B0A09" strokeWidth="1" />
          </g>
        );
      })}
    </svg>
  );
}
