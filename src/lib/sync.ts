import { datasetSchema } from "./schemas";
import type { Dataset } from "./types";
import { mergeNutrition } from "./nutrition";

/** Código secreto de sincronização: 20 bytes aleatórios em base32 (sem letras ambíguas), em grupos de 4. */
export function newSyncCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return chars.match(/.{4}/g)!.join("-");
}

export function normalizeCode(code: string): string {
  const raw = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return raw.match(/.{1,4}/g)?.join("-") ?? "";
}

export function isValidCode(code: string): boolean {
  return /^([A-Z0-9]{4}-){5}[A-Z0-9]{4}$/.test(normalizeCode(code));
}

type ById = { id: string };

function mergeById<T extends ById>(a: T[] = [], b: T[] = [], dead: Record<string, number>, pick: (x: T, y: T) => T = (x) => x): T[] {
  // mantém a ordem deste aparelho; o que só existe na nuvem vai para o fim
  const remote = new Map(b.filter((x) => !dead[x.id]).map((x) => [x.id, x]));
  const out: T[] = [];
  for (const x of a) {
    if (dead[x.id]) continue;
    const y = remote.get(x.id);
    out.push(y ? pick(x, y) : x);
    remote.delete(x.id);
  }
  return [...out, ...remote.values()];
}

function dedupeByDate<T extends ById & { date: string }>(list: T[], preferIds: Set<string>): T[] {
  const byDate = new Map<string, T>();
  for (const x of list) {
    const cur = byDate.get(x.date);
    if (!cur || (preferIds.has(x.id) && !preferIds.has(cur.id))) byDate.set(x.date, x);
  }
  return [...byDate.values()].sort((x, y) => x.date.localeCompare(y.date));
}

/**
 * Junta os dados deste aparelho (local) com os da nuvem (remote).
 * Itens apagados em qualquer lado somem; em conflito vale a alteração mais recente
 * (ou a deste aparelho, quando não há data). O treino em andamento nunca é sincronizado.
 */
export function mergeDatasets(local: Dataset, remote: Dataset): Dataset {
  const dead = { ...remote.tombstones, ...local.tombstones };
  for (const [k, v] of Object.entries(remote.tombstones ?? {})) dead[k] = Math.max(v, dead[k] ?? 0);
  const localIds = (l: ById[] = []) => new Set(l.map((x) => x.id));
  const profileLocal = (local.profileUpdatedAt ?? 0) >= (remote.profileUpdatedAt ?? 0);
  return {
    profile: profileLocal ? local.profile : remote.profile,
    profileUpdatedAt: Math.max(local.profileUpdatedAt ?? 0, remote.profileUpdatedAt ?? 0) || undefined,
    workouts: mergeById(local.workouts, remote.workouts, dead, (x, y) => (y.updatedAt > x.updatedAt ? y : x)),
    sessions: mergeById(local.sessions, remote.sessions, dead, (x, y) => ((y.updatedAt ?? y.endedAt ?? 0) > (x.updatedAt ?? x.endedAt ?? 0) ? y : x)).sort(
      (x, y) => y.startedAt - x.startedAt
    ),
    activeSession: local.activeSession,
    bodyWeights: dedupeByDate(mergeById(local.bodyWeights, remote.bodyWeights, dead), localIds(local.bodyWeights)),
    measurements: dedupeByDate(mergeById(local.measurements, remote.measurements, dead), localIds(local.measurements)),
    customExercises: mergeById(local.customExercises, remote.customExercises, dead),
    nutrition: mergeNutrition(local.nutrition, remote.nutrition),
    shoppingList: mergeById(local.shoppingList, remote.shoppingList, dead, (x, y) => (y.updatedAt > x.updatedAt ? y : x)),
    tombstones: dead
  };
}

/** Conteúdo comparável (sem o treino em andamento), para saber se algo mudou. */
export function fingerprint(d: Dataset): string {
  return stable({
    ...d,
    activeSession: null,
    tombstones: d.tombstones ?? {},
    customExercises: d.customExercises ?? [],
    measurements: d.measurements ?? [],
    shoppingList: d.shoppingList ?? []
  });
}

/** JSON com as chaves em ordem, para comparar conteúdo independentemente da ordem dos campos. */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v)
      .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

export type SyncStatus = { available: boolean; configured: boolean };

export async function syncStatus(): Promise<SyncStatus> {
  try {
    const r = await fetch("/api/sync/status", { cache: "no-store" });
    if (!r.ok) return { available: false, configured: false };
    const j = (await r.json()) as { configured?: boolean };
    return { available: true, configured: !!j.configured };
  } catch {
    return { available: false, configured: false };
  }
}

const headers = (code: string) => ({ authorization: `Bearer ${normalizeCode(code)}`, "content-type": "application/json" });

export async function pull(code: string): Promise<{ data: Dataset | null; version: number }> {
  const r = await fetch("/api/sync", { headers: headers(code), cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = (await r.json()) as { data: unknown; version: number };
  if (!j.data) return { data: null, version: 0 };
  const parsed = datasetSchema.safeParse(j.data);
  if (!parsed.success) throw new Error("Dados da nuvem em formato inesperado.");
  return { data: parsed.data as Dataset, version: j.version };
}

export async function push(code: string, data: Dataset, baseVersion: number): Promise<{ ok: true; version: number } | { ok: false; conflict: boolean }> {
  const r = await fetch("/api/sync", {
    method: "PUT",
    headers: headers(code),
    body: JSON.stringify({ data: { ...data, activeSession: null }, baseVersion })
  });
  if (r.status === 409) return { ok: false, conflict: true };
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = (await r.json()) as { version: number };
  return { ok: true, version: j.version };
}

/**
 * Sincroniza: baixa, junta, envia se houver diferença. Em conflito (outro aparelho enviou antes), repete.
 * Retorna os dados juntados e a versão, ou null se nada mudou localmente.
 */
export async function syncNow(code: string, local: Dataset): Promise<{ merged: Dataset; version: number; changedLocal: boolean }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const remote = await pull(code);
    const merged = remote.data ? mergeDatasets(local, remote.data) : { ...local };
    const changedLocal = fingerprint(merged) !== fingerprint(local);
    if (remote.data && fingerprint(merged) === fingerprint(remote.data)) return { merged, version: remote.version, changedLocal };
    const res = await push(code, merged, remote.version);
    if (res.ok) return { merged, version: res.version, changedLocal };
  }
  throw new Error("Outro aparelho está sincronizando ao mesmo tempo. Tente de novo.");
}
