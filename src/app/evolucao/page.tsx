"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BodyProgress } from "@/components/BodyProgress";
import { RecordsList } from "@/components/RecordsList";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { WeeklyVolume } from "@/components/WeeklyVolume";
import { fmt } from "@/lib/progression";
import { exerciseRecords } from "@/lib/records";
import { EXERCISE_MAP } from "@/data/exercises";
import { exercisesWithHistory, loadHistory, sortedWeights } from "@/lib/stats";
import { useData, useStore } from "@/lib/store";
import { formatDate, formatDateShort, todayISO } from "@/lib/time";

const axis = { stroke: "#9C9284", fontSize: 12 };
const tooltipStyle = {
  background: "#171513",
  border: "1px solid #34302A",
  borderRadius: 12,
  color: "#F3EEE6"
};

export default function EvolucaoPage() {
  const data = useData();
  const addWeight = useStore((s) => s.addBodyWeight);
  const removeWeight = useStore((s) => s.removeBodyWeight);
  const [date, setDate] = useState(todayISO());
  const [kg, setKg] = useState("");
  const [err, setErr] = useState("");

  const weights = sortedWeights(data.bodyWeights);
  const withHistory = useMemo(() => exercisesWithHistory(data.sessions), [data.sessions]);
  const [selected, setSelected] = useState<string>("");
  const exId = selected && withHistory.includes(selected) ? selected : (withHistory[0] ?? "");
  const loads = useMemo(() => (exId ? loadHistory(data.sessions, exId) : []), [data.sessions, exId]);
  const recs = useMemo(() => (exId ? exerciseRecords(data.sessions, exId) : null), [data.sessions, exId]);
  const now = Date.now();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(kg.replace(",", "."));
    if (!Number.isFinite(v) || v < 20 || v > 400) {
      setErr("Informe um peso entre 20 e 400 kg.");
      return;
    }
    addWeight(date, Math.round(v * 10) / 10);
    setKg("");
    setErr("");
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Acompanhamento" title="Evolução" />

      <Card>
        <WeeklyVolume sessions={data.sessions} now={now} />
      </Card>

      {data.sessions.some((s) => s.endedAt) && (
        <Card>
          <RecordsList sessions={data.sessions} />
        </Card>
      )}

      <Card className="space-y-4">
        <h2 className="font-display text-xl font-bold">Peso corporal</h2>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="peso-data" className="label">
              Data
            </label>
            <input id="peso-data" type="date" className="input" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="peso-kg" className="label">
              Peso (kg)
            </label>
            <input
              id="peso-kg"
              inputMode="decimal"
              className="input"
              placeholder="Ex.: 78,5"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              aria-invalid={!!err}
              aria-describedby={err ? "peso-erro" : undefined}
            />
          </div>
          <button type="submit" className="btn-primary">
            Registrar
          </button>
        </form>
        {err && (
          <p id="peso-erro" className="text-sm text-danger">
            {err}
          </p>
        )}
        {weights.length >= 2 ? (
          <div
            className="h-64"
            role="img"
            aria-label={`Gráfico de peso corporal com ${weights.length} registros, de ${weights[0].kg} kg a ${weights[weights.length - 1].kg} kg`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weights.map((w) => ({
                  ...w,
                  label: formatDateShort(w.date)
                }))}
                margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid stroke="#34302A" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={axis} stroke="#34302A" />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={axis} stroke="#34302A" unit=" kg" width={64} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, "Peso"]} />
                <Line type="monotone" dataKey="kg" stroke="#D3A46B" strokeWidth={2.5} dot={{ r: 3, fill: "#D3A46B" }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title={weights.length ? "Falta pouco para o gráfico" : "Nenhum peso registrado"}
            text="Registre seu peso em pelo menos duas datas para ver a evolução."
          />
        )}
        {weights.length > 0 && (
          <details>
            <summary className="cursor-pointer text-sm text-sand">Ver registros ({weights.length})</summary>
            <ul className="mt-2 divide-y divide-line text-sm">
              {weights
                .slice()
                .reverse()
                .map((w) => (
                  <li key={w.id} className="flex items-center justify-between py-1.5">
                    <span>
                      {formatDate(w.date)} · <strong>{w.kg.toLocaleString("pt-BR")} kg</strong>
                    </span>
                    <button
                      type="button"
                      className="btn-ghost min-h-10 px-2"
                      onClick={() => removeWeight(w.id)}
                      aria-label={`Excluir registro de ${formatDate(w.date)}`}
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </li>
                ))}
            </ul>
          </details>
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-xl font-bold">Carga por exercício</h2>
        {withHistory.length === 0 ? (
          <EmptyState title="Sem séries registradas" text="Faça um treino e registre as séries para acompanhar a evolução da carga de cada exercício." />
        ) : (
          <>
            <div>
              <label htmlFor="exercicio-grafico" className="label">
                Exercício
              </label>
              <select id="exercicio-grafico" className="input" value={exId} onChange={(e) => setSelected(e.target.value)}>
                {withHistory.map((id) => (
                  <option key={id} value={id}>
                    {EXERCISE_MAP[id]?.name ?? id}
                  </option>
                ))}
              </select>
            </div>
            {recs && (
              <dl className="grid grid-cols-3 gap-2 text-center" data-testid="recordes">
                {[
                  [
                    "Maior carga",
                    recs.maxLoad ? `${fmt(recs.maxLoad.value)} kg` : "—",
                    recs.maxLoad ? `× ${recs.maxLoad.reps} · ${formatDateShort(recs.maxLoad.date)}` : ""
                  ],
                  ["1RM estimado", recs.best1RM ? `${fmt(recs.best1RM.value)} kg` : "—", recs.best1RM ? recs.best1RM.set : "até 12 repetições"],
                  ["Melhor série", recs.bestSetVolume ? `${fmt(recs.bestSetVolume.value)} kg` : "—", recs.bestSetVolume ? recs.bestSetVolume.set : ""]
                ].map(([t, v, sub]) => (
                  <div key={t} className="rounded-xl border border-line bg-iron p-2">
                    <dt className="text-xs text-muted">{t}</dt>
                    <dd className="font-display text-lg font-bold text-bronze-light">{v}</dd>
                    <dd className="text-xs text-muted">{sub}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="text-xs text-muted">1RM estimado pela fórmula de Epley: uma estimativa da carga máxima para 1 repetição, sem precisar testar.</p>
            {loads.length >= 2 ? (
              <div className="h-64" role="img" aria-label={`Gráfico da maior carga por sessão em ${EXERCISE_MAP[exId]?.name}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={loads.map((p) => ({
                      ...p,
                      label: formatDateShort(p.date)
                    }))}
                    margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#34302A" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={axis} stroke="#34302A" />
                    <YAxis tick={axis} stroke="#34302A" unit=" kg" width={64} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v, name, p) =>
                        name === "Maior carga" ? [`${v} kg (melhor série: ${(p.payload as { bestSet: string }).bestSet})`, name] : [`${v} kg`, name]
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#9C9284" }} />
                    <Line
                      name="Maior carga"
                      type="monotone"
                      dataKey="maxLoad"
                      stroke="#D3A46B"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#D3A46B" }}
                      isAnimationActive={false}
                    />
                    <Line
                      name="1RM estimado"
                      type="monotone"
                      dataKey="e1rm"
                      stroke="#9C9284"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title="Uma sessão registrada"
                text={`Melhor série até agora: ${loads[0]?.bestSet ?? "—"}. Com duas sessões ou mais, o gráfico aparece.`}
              />
            )}
          </>
        )}
      </Card>

      <Card>
        <BodyProgress />
      </Card>
    </div>
  );
}
