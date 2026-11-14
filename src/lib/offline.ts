import { exercisedbGif } from "@/data/exercisedb";
import { coachPrefs } from "./coachVoice";
import { exerciseClipUrl, voiceUrls } from "./voiceLines";
import type { Settings, Workout } from "./types";

export const OFFLINE_CACHE = "bb-offline-v1";
/** GIFs dos exercícios. O service worker só passa a servir os GIFs depois que este cache existe. */
export const GIF_CACHE = "bb-gifs-v1";

/** Arquivos que o treino usa e que não vêm no app instalado: falas gravadas da voz escolhida e GIFs dos exercícios das fichas. */
export function offlineFiles(settings: Settings, workouts: Workout[]): { voice: string[]; gifs: string[] } {
  const ids = [...new Set(workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId)))];
  const { style, pack } = coachPrefs(settings);
  const voice =
    pack === "aparelho" || settings.voiceCues === false
      ? []
      : [...voiceUrls(style, pack), ...ids.filter((id) => !id.startsWith("cx_")).map((id) => exerciseClipUrl(pack, id))];
  const gifs = ids.map((id) => exercisedbGif(id)).filter((u): u is string => !!u);
  return { voice, gifs };
}

/** Baixa e guarda tudo, avisando o progresso. Devolve quantos falharam. */
export async function downloadOffline(
  files: { voice: string[]; gifs: string[] },
  onProgress: (done: number, total: number) => void
): Promise<{ failed: number }> {
  if (!("caches" in window)) return { failed: files.voice.length + files.gifs.length };
  const voiceCache = await caches.open(OFFLINE_CACHE);
  const media = await caches.open(GIF_CACHE);
  const jobs: (() => Promise<boolean>)[] = [
    ...files.voice.map((u) => async () => {
      if (await voiceCache.match(u)) return true;
      const r = await fetch(u);
      if (!r.ok) return false;
      await voiceCache.put(u, r);
      return true;
    }),
    // sem enviar o endereço do app ao site dos GIFs (igual ao <img>)
    ...files.gifs.map((u) => async () => {
      if (await media.match(u)) return true;
      const r = await fetch(u, { mode: "no-cors", referrerPolicy: "no-referrer" });
      if (r.type !== "opaque" && !r.ok) return false;
      await media.put(u, r);
      return true;
    })
  ];
  let done = 0;
  let failed = 0;
  const total = jobs.length;
  onProgress(0, total);
  // 4 de cada vez
  const queue = jobs.slice();
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const job = queue.shift()!;
        const ok = await job().catch(() => false);
        if (!ok) failed++;
        onProgress(++done, total);
      }
    })
  );
  if (files.gifs.length) navigator.serviceWorker?.controller?.postMessage({ type: "GIFS_OFFLINE" });
  return { failed };
}

/** Quantos dos arquivos já estão guardados no aparelho. */
export async function offlineReady(files: { voice: string[]; gifs: string[] }): Promise<{ have: number; total: number }> {
  const total = files.voice.length + files.gifs.length;
  if (!("caches" in window)) return { have: 0, total };
  let have = 0;
  for (const u of [...files.voice, ...files.gifs]) if (await caches.match(u)) have++;
  return { have, total };
}
