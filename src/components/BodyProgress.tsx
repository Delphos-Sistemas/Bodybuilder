"use client";

import clsx from "clsx";
import { Camera, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { uid } from "@/lib/id";
import { addPhoto, listPhotos, POSES, removePhoto, shrinkImage, type Pose, type ProgressPhoto } from "@/lib/photoDb";
import { fmt } from "@/lib/progression";
import { useData, useStore } from "@/lib/store";
import { formatDate, formatDateShort, todayISO } from "@/lib/time";
import { MEASUREMENTS, type BodyWeight, type Measurement, type MeasurementKey } from "@/lib/types";

const KEYS = Object.keys(MEASUREMENTS) as MeasurementKey[];

/** Medidas corporais (cm) com comparação e fotos de progresso guardadas só no aparelho. */
export function BodyProgress() {
  const data = useData();
  const add = useStore((s) => s.addMeasurement);
  const remove = useStore((s) => s.removeMeasurement);
  const list = data.measurements ?? [];
  const [date, setDate] = useState(todayISO());
  const [values, setValues] = useState<Partial<Record<MeasurementKey, string>>>({});
  const [err, setErr] = useState("");

  const first = list[0];
  const last = list[list.length - 1];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cm: Partial<Record<MeasurementKey, number>> = {};
    for (const k of KEYS) {
      const raw = values[k]?.trim();
      if (!raw) continue;
      const v = parseFloat(raw.replace(",", "."));
      if (!Number.isFinite(v) || v < 10 || v > 300) {
        setErr(`${MEASUREMENTS[k]}: informe um valor entre 10 e 300 cm.`);
        return;
      }
      cm[k] = Math.round(v * 10) / 10;
    }
    if (!Object.keys(cm).length) {
      setErr("Preencha pelo menos uma medida.");
      return;
    }
    add(date, cm);
    setValues({});
    setErr("");
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-labelledby="medidas-titulo">
        <h2 id="medidas-titulo" className="font-display text-xl font-bold">
          Medidas corporais
        </h2>
        <form onSubmit={submit} className="space-y-3">
          <div className="max-w-xs">
            <label htmlFor="medida-data" className="label">
              Data
            </label>
            <input id="medida-data" type="date" className="input" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KEYS.map((k) => (
              <div key={k}>
                <label htmlFor={`medida-${k}`} className="label">
                  {MEASUREMENTS[k]} (cm)
                </label>
                <input
                  id={`medida-${k}`}
                  inputMode="decimal"
                  className="input"
                  value={values[k] ?? ""}
                  placeholder={last?.cm[k] ? fmt(last.cm[k]!) : ""}
                  onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          {err && (
            <p role="alert" className="text-sm text-danger">
              {err}
            </p>
          )}
          <button type="submit" className="btn-primary">
            Registrar medidas
          </button>
        </form>

        {list.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[22rem] text-sm" data-testid="tabela-medidas">
              <caption className="sr-only">Comparação das medidas</caption>
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="py-1 font-medium">Medida</th>
                  <th className="py-1 font-medium">{list.length > 1 ? `Primeira (${formatDate(first.date)})` : "Registro"}</th>
                  {list.length > 1 && <th className="py-1 font-medium">Última ({formatDate(last.date)})</th>}
                  {list.length > 1 && <th className="py-1 text-right font-medium">Diferença</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {KEYS.filter((k) => list.some((m) => m.cm[k])).map((k) => {
                  const a = list.find((m) => m.cm[k])?.cm[k];
                  const b = [...list].reverse().find((m) => m.cm[k])?.cm[k];
                  const diff = a !== undefined && b !== undefined ? Math.round((b - a) * 10) / 10 : null;
                  return (
                    <tr key={k}>
                      <td className="py-1.5">{MEASUREMENTS[k]}</td>
                      <td className="py-1.5">{a !== undefined ? `${fmt(a)} cm` : "—"}</td>
                      {list.length > 1 && <td className="py-1.5">{b !== undefined ? `${fmt(b)} cm` : "—"}</td>}
                      {list.length > 1 && <td className="py-1.5 text-right tabular-nums">{diff === null ? "—" : `${diff > 0 ? "+" : ""}${fmt(diff)} cm`}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-sand">Ver registros ({list.length})</summary>
              <ul className="mt-2 divide-y divide-line text-sm">
                {[...list].reverse().map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 py-1.5">
                    <span>
                      {formatDate(m.date)} ·{" "}
                      {KEYS.filter((k) => m.cm[k])
                        .map((k) => `${MEASUREMENTS[k]} ${fmt(m.cm[k]!)}`)
                        .join(", ")}
                    </span>
                    <button
                      type="button"
                      className="btn-ghost min-h-10 px-2"
                      onClick={() => remove(m.id)}
                      aria-label={`Excluir medidas de ${formatDate(m.date)}`}
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </section>

      <ProgressPhotos />
    </div>
  );
}

/** Valor de referência numa data: o último registro até a data; se não houver, o primeiro depois dela. */
function valueAt<T extends { date: string }>(list: T[], date: string, has: (x: T) => boolean): T | undefined {
  const sorted = list.filter(has).sort((a, b) => a.date.localeCompare(b.date));
  return [...sorted].reverse().find((x) => x.date <= date) ?? sorted[0];
}

/** Diferenças de peso e medidas entre as datas de duas fotos. */
export function compareDates(a: string, b: string, weights: BodyWeight[], measurements: Measurement[]) {
  const days = Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
  const rows: { label: string; from: number; to: number; unit: string }[] = [];
  const wa = valueAt(weights, a, () => true);
  const wb = valueAt(weights, b, () => true);
  if (wa && wb && wa.id !== wb.id) rows.push({ label: "Peso", from: wa.kg, to: wb.kg, unit: "kg" });
  for (const k of KEYS) {
    const ma = valueAt(measurements, a, (m) => m.cm[k] !== undefined);
    const mb = valueAt(measurements, b, (m) => m.cm[k] !== undefined);
    if (ma && mb && ma.id !== mb.id) rows.push({ label: MEASUREMENTS[k], from: ma.cm[k]!, to: mb.cm[k]!, unit: "cm" });
  }
  return { days, rows };
}

const photoLabel = (p: ProgressPhoto) => `${formatDateShort(p.date)}${p.pose ? ` · ${POSES[p.pose]}` : ""}`;

function ProgressPhotos() {
  const data = useData();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [date, setDate] = useState(todayISO());
  const [pose, setPose] = useState<Pose>("frente");
  const [filter, setFilter] = useState<Pose | "">("");
  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");
  const [mode, setMode] = useState<"lado" | "deslizar">("lado");
  const [split, setSplit] = useState(50);
  const urls = useRef(new Map<string, string>());
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void listPhotos().then(setPhotos);
    const map = urls.current;
    return () => map.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const urlFor = (p: ProgressPhoto) => {
    let u = urls.current.get(p.id);
    if (!u) {
      u = URL.createObjectURL(p.blob);
      urls.current.set(p.id, u);
    }
    return u;
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const added: ProgressPhoto[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      const p: ProgressPhoto = {
        id: uid("ph_"),
        date,
        pose,
        blob: await shrinkImage(f),
        addedAt: Date.now()
      };
      try {
        await addPhoto(p);
      } catch {
        /* sem IndexedDB: a foto fica só nesta visita */
      }
      added.push(p);
    }
    setPhotos((l) => [...l, ...added].sort((a, b) => a.date.localeCompare(b.date) || a.addedAt - b.addedAt));
    setAfterId("");
  };

  const posesPresent = (Object.keys(POSES) as Pose[]).filter((k) => photos.some((p) => p.pose === k));
  const pool = filter ? photos.filter((p) => p.pose === filter) : photos;
  const before = pool.find((p) => p.id === beforeId) ?? pool[0];
  const after = pool.find((p) => p.id === afterId) ?? pool[pool.length - 1];
  const diff = before && after && before.id !== after.id ? compareDates(before.date, after.date, data.bodyWeights, data.measurements ?? []) : null;

  return (
    <section className="space-y-3" aria-labelledby="fotos-titulo">
      <h2 id="fotos-titulo" className="font-display text-xl font-bold">
        Fotos de evolução
      </h2>
      <p className="text-sm text-muted">
        As fotos ficam só neste aparelho. Elas não são enviadas a nenhum servidor e não entram no arquivo de backup. Dica: tire sempre no mesmo lugar, com a
        mesma luz e na mesma posição.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="foto-data" className="label">
            Data da foto
          </label>
          <input id="foto-data" type="date" className="input" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div role="radiogroup" aria-label="Posição da foto" className="flex gap-1.5">
          {(Object.keys(POSES) as Pose[]).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={pose === k} className={clsx("chip", pose === k && "chip-on")} onClick={() => setPose(k)}>
              {POSES[k]}
            </button>
          ))}
        </div>
        <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
          <Camera size={18} aria-hidden /> Adicionar foto
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label="Escolher fotos de progresso"
          onChange={(e) => void onFiles(e.target.files).then(() => (e.target.value = ""))}
        />
      </div>

      {photos.length >= 2 && (
        <div className="space-y-3 rounded-xl border border-line p-3" data-testid="comparar-fotos">
          <h3 className="font-semibold">Comparar</h3>
          {posesPresent.length > 1 && (
            <div role="radiogroup" aria-label="Filtrar por posição" className="flex flex-wrap gap-1.5">
              {([["", "Todas"], ...posesPresent.map((k) => [k, POSES[k]])] as [Pose | "", string][]).map(([k, label]) => (
                <button
                  key={k || "todas"}
                  type="button"
                  role="radio"
                  aria-checked={filter === k}
                  className={clsx("chip", filter === k && "chip-on")}
                  onClick={() => (setFilter(k), setBeforeId(""), setAfterId(""))}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {pool.length < 2 ? (
            <p className="text-sm text-muted">Adicione mais uma foto nesta posição para comparar.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="foto-antes" className="label">
                    Antes
                  </label>
                  <select id="foto-antes" className="input" value={before?.id} onChange={(e) => setBeforeId(e.target.value)}>
                    {pool.map((p) => (
                      <option key={p.id} value={p.id}>
                        {photoLabel(p)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="foto-depois" className="label">
                    Depois
                  </label>
                  <select id="foto-depois" className="input" value={after?.id} onChange={(e) => setAfterId(e.target.value)}>
                    {pool.map((p) => (
                      <option key={p.id} value={p.id}>
                        {photoLabel(p)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div role="radiogroup" aria-label="Modo de comparação" className="flex gap-1.5">
                {(
                  [
                    ["lado", "Lado a lado"],
                    ["deslizar", "Deslizar"]
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={mode === k}
                    className={clsx("chip", mode === k && "chip-on")}
                    onClick={() => setMode(k)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {before && after && mode === "lado" && (
                <div className="grid grid-cols-2 gap-2">
                  {[before, after].map((p, i) => (
                    <figure key={`${p.id}-${i}`} className="overflow-hidden rounded-xl border border-line">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={urlFor(p)} alt={`Foto de progresso de ${formatDate(p.date)}`} className="aspect-[3/4] w-full object-cover" />
                      <figcaption className="bg-steel px-2 py-1 text-center text-xs text-sand">
                        {i === 0 ? "Antes" : "Depois"} · {formatDate(p.date)}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
              {before && after && mode === "deslizar" && (
                <div className="mx-auto max-w-sm space-y-2">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-line" data-testid="foto-deslizar">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urlFor(after)} alt={`Depois, ${formatDate(after.date)}`} className="absolute inset-0 h-full w-full object-cover" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={urlFor(before)}
                      alt={`Antes, ${formatDate(before.date)}`}
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
                    />
                    <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-parchment shadow" style={{ left: `${split}%` }} aria-hidden />
                    <span className="absolute left-2 top-2 rounded bg-iron/80 px-1.5 py-0.5 text-xs">Antes</span>
                    <span className="absolute right-2 top-2 rounded bg-iron/80 px-1.5 py-0.5 text-xs">Depois</span>
                  </div>
                  <label htmlFor="foto-divisao" className="sr-only">
                    Arraste para comparar antes e depois
                  </label>
                  <input
                    id="foto-divisao"
                    type="range"
                    min={0}
                    max={100}
                    value={split}
                    onChange={(e) => setSplit(Number(e.target.value))}
                    className="w-full accent-[#B07D45]"
                  />
                </div>
              )}
              {diff && (
                <div className="text-sm" data-testid="diferencas-fotos">
                  <p className="text-muted">
                    {diff.days === 0 ? "Mesmo dia." : `${Math.abs(diff.days)} ${Math.abs(diff.days) === 1 ? "dia" : "dias"} entre as fotos.`}
                    {!diff.rows.length && " Registre peso e medidas perto das datas das fotos para ver a diferença aqui."}
                  </p>
                  {diff.rows.length > 0 && (
                    <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-3">
                      {diff.rows.map((r) => {
                        const d = Math.round((r.to - r.from) * 10) / 10;
                        return (
                          <li key={r.label} className="flex justify-between gap-2">
                            <span>{r.label}</span>
                            <span className="tabular-nums text-sand">
                              {d > 0 ? "+" : ""}
                              {fmt(d)} {r.unit}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {photos.map((p) => (
            <li key={p.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urlFor(p)} alt={`Foto de ${photoLabel(p)}`} className="aspect-[3/4] w-full rounded-lg object-cover" />
              <span className="absolute bottom-1 left-1 rounded bg-iron/85 px-1.5 py-0.5 text-[11px]">{photoLabel(p)}</span>
              <button
                type="button"
                className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-iron/85 text-danger"
                aria-label={`Excluir foto de ${formatDate(p.date)}`}
                onClick={() => {
                  void removePhoto(p.id);
                  setPhotos((l) => l.filter((x) => x.id !== p.id));
                }}
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
