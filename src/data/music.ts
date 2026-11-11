import type { MusicStyle } from "@/lib/musicDb";

export const MUSIC_STYLES: { id: MusicStyle; label: string }[] = [
  { id: "metal", label: "Metal" },
  { id: "rock", label: "Rock" },
  { id: "hiphop", label: "Hip Hop" }
];

export type BundledTrack = { title: string; artist: string; src: string; license: string; sourceUrl: string };

/**
 * Faixas incluídas no app. Vazio de propósito: ainda não há faixas com licença
 * compatível verificada. Para incluir, adicione o arquivo em public/musica/<estilo>/
 * e registre título, artista, licença e fonte aqui (ver README).
 */
export const BUNDLED_TRACKS: Record<MusicStyle, BundledTrack[]> = {
  metal: [],
  rock: [],
  hiphop: []
};
