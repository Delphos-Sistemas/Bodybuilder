import { describe, expect, it } from "vitest";
import { emptyDataset } from "@/lib/store";
import { fingerprint, isValidCode, mergeDatasets, newSyncCode, normalizeCode } from "@/lib/sync";
import type { Dataset, Session, Workout } from "@/lib/types";

const w = (id: string, updatedAt: number, name = id): Workout => ({ id, name, notes: "", exercises: [], createdAt: 1, updatedAt });
const s = (id: string, startedAt: number, extra: Partial<Session> = {}): Session => ({
  id,
  workoutId: "w",
  workoutName: "T",
  startedAt,
  endedAt: startedAt + 10,
  items: [],
  currentIndex: 0,
  rest: null,
  ...extra
});
const ds = (p: Partial<Dataset>): Dataset => ({ ...emptyDataset(), ...p });

describe("código de sincronização", () => {
  it("gera códigos válidos e diferentes", () => {
    const a = newSyncCode();
    expect(isValidCode(a)).toBe(true);
    expect(newSyncCode()).not.toBe(a);
  });
  it("aceita o código digitado sem hífens e em minúsculas", () => {
    expect(normalizeCode("abcd efgh-jkmn pqrs tuvw xyz2")).toBe("ABCD-EFGH-JKMN-PQRS-TUVW-XYZ2");
    expect(isValidCode("abcdefghjkmnpqrstuvwxyz2")).toBe(true);
    expect(isValidCode("abc")).toBe(false);
  });
});

describe("junção dos dados", () => {
  it("une treinos e sessões dos dois aparelhos, e vale a edição mais recente", () => {
    const local = ds({ workouts: [w("a", 5, "A local"), w("b", 1)], sessions: [s("s1", 100)] });
    const remote = ds({ workouts: [w("a", 9, "A remoto"), w("c", 1)], sessions: [s("s2", 200)] });
    const m = mergeDatasets(local, remote);
    expect(m.workouts.map((x) => x.id).sort()).toEqual(["a", "b", "c"]);
    expect(m.workouts.find((x) => x.id === "a")?.name).toBe("A remoto");
    expect(m.sessions.map((x) => x.id)).toEqual(["s2", "s1"]);
  });
  it("itens apagados em um aparelho não voltam", () => {
    const local = ds({ workouts: [], tombstones: { b: 10 } });
    const remote = ds({ workouts: [w("b", 1)] });
    expect(mergeDatasets(local, remote).workouts).toEqual([]);
    expect(mergeDatasets(remote, local).workouts).toEqual([]);
  });
  it("anotação mais recente vence e o treino em andamento fica local", () => {
    const active = s("ativo", 500, { endedAt: undefined });
    const local = ds({ sessions: [s("s1", 100, { notes: "velha", updatedAt: 200 })], activeSession: active });
    const remote = ds({ sessions: [s("s1", 100, { notes: "nova", updatedAt: 300 })] });
    const m = mergeDatasets(local, remote);
    expect(m.sessions[0].notes).toBe("nova");
    expect(m.activeSession?.id).toBe("ativo");
  });
  it("peso do mesmo dia não duplica e perfil mais recente vence", () => {
    const local = ds({ bodyWeights: [{ id: "l", date: "2026-11-10", kg: 80 }], profile: { ...emptyDataset().profile, name: "Local" }, profileUpdatedAt: 5 });
    const remote = ds({ bodyWeights: [{ id: "r", date: "2026-11-10", kg: 81 }], profile: { ...emptyDataset().profile, name: "Remoto" }, profileUpdatedAt: 9 });
    const m = mergeDatasets(local, remote);
    expect(m.bodyWeights).toEqual([{ id: "l", date: "2026-11-10", kg: 80 }]);
    expect(m.profile.name).toBe("Remoto");
  });
  it("juntar duas vezes não muda nada (sem laço de sincronização)", () => {
    const local = ds({ workouts: [w("a", 1)] });
    const remote = ds({ workouts: [w("b", 1)] });
    const once = mergeDatasets(local, remote);
    expect(fingerprint(mergeDatasets(once, once))).toBe(fingerprint(once));
  });
});

describe("comparação estável", () => {
  it("ignora a ordem dos campos e campos vazios", () => {
    const a = ds({ workouts: [w("a", 1)] });
    const b = JSON.parse(JSON.stringify({ tombstones: {}, bodyWeights: [], sessions: [], activeSession: null, workouts: a.workouts, profile: a.profile }));
    expect(fingerprint(b as Dataset)).toBe(fingerprint(a));
  });
});

describe("login do Spotify (PKCE)", () => {
  it("gera o desafio S256 conforme a RFC 7636", async () => {
    const { challengeFor, newVerifier } = await import("@/lib/spotifyAuth");
    const { createHash } = await import("node:crypto");
    const v = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    expect(await challengeFor(v)).toBe(createHash("sha256").update(v).digest("base64url"));
    expect(await challengeFor(v)).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
    expect(newVerifier()).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
  });
});
