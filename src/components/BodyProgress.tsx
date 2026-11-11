"use client";

import { Camera, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { uid } from "@/lib/id";
import { addPhoto, listPhotos, removePhoto, shrinkImage, type ProgressPhoto } from "@/lib/photoDb";
import { fmt } from "@/lib/progression";
import { useData, useStore } from "@/lib/store";
import { formatDate, todayISO } from "@/lib/time";
import { MEASUREMENTS, type MeasurementKey } from "@/lib/types";

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

function ProgressPhotos() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [date, setDate] = useState(todayISO());
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
  };

  const first = photos[0];
  const last = photos[photos.length - 1];

  return (
    <section className="space-y-3" aria-labelledby="fotos-titulo">
      <h2 id="fotos-titulo" className="font-display text-xl font-bold">
        Fotos de progresso
      </h2>
      <p className="text-sm text-muted">As fotos ficam só neste aparelho. Elas não são enviadas a nenhum servidor e não entram no arquivo de backup.</p>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="foto-data" className="label">
            Data da foto
          </label>
          <input id="foto-data" type="date" className="input" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
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

      {photos.length >= 2 && first && last && (
        <div className="grid grid-cols-2 gap-2" data-testid="comparar-fotos">
          {[first, last].map((p, i) => (
            <figure key={p.id} className="overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urlFor(p)} alt={`Foto de progresso de ${formatDate(p.date)}`} className="aspect-[3/4] w-full object-cover" />
              <figcaption className="bg-steel px-2 py-1 text-center text-xs text-sand">
                {i === 0 ? "Antes" : "Agora"} · {formatDate(p.date)}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {photos.map((p) => (
            <li key={p.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urlFor(p)} alt={`Foto de ${formatDate(p.date)}`} className="aspect-[3/4] w-full rounded-lg object-cover" />
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
