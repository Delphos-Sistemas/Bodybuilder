import { sessionRecordHits } from "./records";
import { sessionSetCount, sessionVolume } from "./session";
import type { ChallengeBoard, ChallengeEntry, Session } from "./types";

export const CHALLENGE_KINDS: Record<ChallengeBoard["kind"], string> = {
  treinos: "Mais treinos",
  volume: "Mais volume (kg)",
  series: "Mais séries",
  recordes: "Mais recordes"
};

export const MAX_PARTICIPANTS = 12;

export function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Meus números do mês, para entrar no ranking. */
export function myEntry(id: string, nome: string, sessions: Session[], now: number): ChallengeEntry {
  const mes = monthKey(now);
  const all = sessions.filter((s) => s.endedAt);
  const list = all.filter((s) => monthKey(s.startedAt) === mes);
  return {
    id,
    nome: nome.trim().slice(0, 30) || "Eu",
    mes,
    treinos: list.length,
    volume: Math.round(list.reduce((a, s) => a + sessionVolume(s), 0)),
    series: list.reduce((a, s) => a + sessionSetCount(s), 0),
    recordes: list.reduce((a, s) => a + sessionRecordHits(s, all).length, 0),
    em: now
  };
}

/** Junta dois quadros: para cada pessoa fica a versão mais recente. */
export function mergeEntries(a: ChallengeEntry[], b: ChallengeEntry[]): ChallengeEntry[] {
  const map = new Map<string, ChallengeEntry>();
  for (const e of [...a, ...b]) {
    const cur = map.get(e.id);
    if (!cur || e.em > cur.em) map.set(e.id, e);
  }
  return [...map.values()].sort((x, y) => y.em - x.em).slice(0, MAX_PARTICIPANTS);
}

/** Ranking do mês: quem não atualizou neste mês fica no fim, com zero. */
export function ranking(entries: ChallengeEntry[], kind: ChallengeBoard["kind"], mes: string): (ChallengeEntry & { atual: boolean; valor: number })[] {
  return entries
    .map((e) => ({ ...e, atual: e.mes === mes, valor: e.mes === mes ? e[kind] : 0 }))
    .sort((a, b) => b.valor - a.valor || Number(b.atual) - Number(a.atual) || a.nome.localeCompare(b.nome));
}

type Wire = { k: ChallengeBoard["kind"]; p: [string, string, string, number, number, number, number, number][] };

function b64urlEncode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** Código do link (vai depois do # e não passa pelo servidor). */
export function encodeChallenge(kind: ChallengeBoard["kind"], entries: ChallengeEntry[]): string {
  const w: Wire = { k: kind, p: entries.slice(0, MAX_PARTICIPANTS).map((e) => [e.id, e.nome, e.mes, e.treinos, e.volume, e.series, e.recordes, e.em]) };
  return b64urlEncode(JSON.stringify(w));
}

const num = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max ? Math.round(v) : 0);

/** Lê o código do link. Dados de outra pessoa: valida tudo e descarta o que não fizer sentido. */
export function decodeChallenge(code: string): { kind: ChallengeBoard["kind"]; entries: ChallengeEntry[] } | null {
  try {
    const w = JSON.parse(b64urlDecode(code)) as Partial<Wire>;
    const kind = w.k && w.k in CHALLENGE_KINDS ? w.k : "treinos";
    if (!Array.isArray(w.p)) return null;
    const entries: ChallengeEntry[] = [];
    for (const p of w.p.slice(0, MAX_PARTICIPANTS)) {
      if (!Array.isArray(p) || typeof p[0] !== "string" || typeof p[1] !== "string" || typeof p[2] !== "string") continue;
      if (!/^[a-z0-9_]{4,40}$/i.test(p[0]) || !/^\d{4}-\d{2}$/.test(p[2])) continue;
      entries.push({
        id: p[0],
        nome:
          p[1]
            .replace(/[\u0000-\u001f]/g, "")
            .trim()
            .slice(0, 30) || "Amigo",
        mes: p[2],
        treinos: num(p[3], 100),
        volume: num(p[4], 10_000_000),
        series: num(p[5], 10_000),
        recordes: num(p[6], 10_000),
        em: num(p[7], 9_999_999_999_999)
      });
    }
    return entries.length ? { kind, entries } : null;
  } catch {
    return null;
  }
}
