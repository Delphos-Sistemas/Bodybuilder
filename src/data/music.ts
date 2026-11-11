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

/**
 * Playlists editoriais públicas do Spotify usadas como padrão em cada estilo.
 * O usuário pode trocar por qualquer playlist, álbum ou artista colando o link.
 */
export const SPOTIFY_DEFAULTS: Record<MusicStyle, { title: string; url: string }> = {
  metal: { title: "Kickass Metal", url: "https://open.spotify.com/playlist/37i9dQZF1DWTcqUzwhNmKv" },
  rock: { title: "Rock Classics", url: "https://open.spotify.com/playlist/37i9dQZF1DWXRqgorJj26U" },
  hiphop: { title: "RapCaviar", url: "https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd" }
};
