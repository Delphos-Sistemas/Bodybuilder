export type SpotifyKind = "playlist" | "album" | "artist" | "track" | "show" | "episode";
export type SpotifyRef = { kind: SpotifyKind; id: string };

/** Aceita links do open.spotify.com (com ou sem /intl-xx/) e URIs spotify:playlist:ID. */
export function parseSpotify(input: string): SpotifyRef | null {
  const text = input.trim();
  const uri = /^spotify:(playlist|album|artist|track|show|episode):([A-Za-z0-9]{10,40})$/.exec(text);
  if (uri) return { kind: uri[1] as SpotifyKind, id: uri[2] };
  try {
    const url = new URL(text);
    if (url.hostname !== "open.spotify.com") return null;
    const m = /^\/(?:intl-[a-z-]+\/)?(?:embed\/)?(playlist|album|artist|track|show|episode)\/([A-Za-z0-9]{10,40})/.exec(url.pathname);
    return m ? { kind: m[1] as SpotifyKind, id: m[2] } : null;
  } catch {
    return null;
  }
}

export function embedUrl(ref: SpotifyRef): string {
  return `https://open.spotify.com/embed/${ref.kind}/${ref.id}?utm_source=generator&theme=0`;
}

export function openUrl(ref: SpotifyRef): string {
  return `https://open.spotify.com/${ref.kind}/${ref.id}`;
}
