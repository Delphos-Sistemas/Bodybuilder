import { lastPerformance, platesPerSide, suggestNext } from "@/lib/progression";
import type { Session } from "@/lib/types";

const planned = { sets: 3, repsMin: 8, repsMax: 10, loadKg: 60, rir: 2, restSec: 90 };
const set = (reps: number, loadKg: number, rir: number) => ({ reps, loadKg, rir, completedAt: 0 });

describe("progressão de carga", () => {
  it("sugere subir carga quando bateu o topo com RIR suficiente", () => {
    const s = suggestNext(planned, { date: 0, sets: [set(10, 60, 2), set(10, 60, 2), set(10, 60, 3)] }, "barra");
    expect(s).toMatchObject({ kind: "subir", loadKg: 62.5, repsTarget: 8 });
  });
  it("halteres sobem 2 kg; peso corporal sobe repetições", () => {
    expect(suggestNext(planned, { date: 0, sets: [set(10, 20, 2), set(10, 20, 2), set(10, 20, 2)] }, "halteres")?.loadKg).toBe(22);
    expect(suggestNext(planned, { date: 0, sets: [set(10, 0, 2), set(10, 0, 2), set(10, 0, 2)] }, "peso-corporal")).toMatchObject({
      loadKg: 0,
      repsTarget: 11
    });
  });
  it("mantém a carga quando ainda não completou a faixa", () => {
    expect(suggestNext(planned, { date: 0, sets: [set(10, 60, 2), set(9, 60, 1), set(8, 60, 1)] }, "barra")).toMatchObject({
      kind: "manter",
      loadKg: 60,
      repsTarget: 10
    });
  });
  it("reduz quando ficou abaixo da faixa chegando à falha", () => {
    expect(suggestNext(planned, { date: 0, sets: [set(7, 70, 0), set(6, 70, 0)] }, "barra")).toMatchObject({ kind: "reduzir", loadKg: 67.5 });
  });
  it("sem histórico não sugere", () => {
    expect(suggestNext(planned, null, "barra")).toBeNull();
  });
  it("encontra a última sessão com o exercício", () => {
    const mk = (id: string, ex: string, load: number): Session => ({
      id,
      workoutId: "w",
      workoutName: "w",
      startedAt: 1,
      endedAt: 2,
      currentIndex: 0,
      rest: null,
      items: [{ exerciseId: ex, planned, sets: [set(10, load, 2)], skipped: false }]
    });
    const last = lastPerformance([mk("a", "stiff", 50), mk("b", "supino-reto", 70), mk("c", "supino-reto", 60)], "supino-reto");
    expect(last?.sets[0].loadKg).toBe(70);
  });
});

describe("calculadora de anilhas", () => {
  it("divide a carga por lado", () => {
    expect(platesPerSide(100, 20)).toEqual({ plates: [25, 15], remainder: 0 });
    expect(platesPerSide(62.5, 20)).toEqual({ plates: [20, 1.25], remainder: 0 });
    expect(platesPerSide(21, 20)).toEqual({ plates: [], remainder: 1 });
    expect(platesPerSide(15, 20)).toBeNull();
  });
});

import { embedUrl, parseSpotify } from "@/lib/spotify";

describe("links do Spotify", () => {
  it("entende links e URIs", () => {
    expect(parseSpotify("https://open.spotify.com/playlist/37i9dQZF1DWTcqUzwhNmKv?si=abc")).toEqual({ kind: "playlist", id: "37i9dQZF1DWTcqUzwhNmKv" });
    expect(parseSpotify("https://open.spotify.com/intl-pt/album/4aawyAB9vmqN3uQ7FjRGTy")).toEqual({ kind: "album", id: "4aawyAB9vmqN3uQ7FjRGTy" });
    expect(parseSpotify("spotify:artist:1dfeR4HaWDbWqFHLkxsg1d")).toEqual({ kind: "artist", id: "1dfeR4HaWDbWqFHLkxsg1d" });
    expect(parseSpotify("https://exemplo.com/playlist/abc")).toBeNull();
    expect(parseSpotify("qualquer coisa")).toBeNull();
    expect(embedUrl({ kind: "playlist", id: "x1234567890" })).toContain("open.spotify.com/embed/playlist/x1234567890");
  });
});
