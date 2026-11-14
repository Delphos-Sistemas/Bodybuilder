"use client";

/**
 * Login no Spotify (OAuth com PKCE, sem servidor e sem segredo) e controle do player pela Web API.
 * Só aparece quando o app é publicado com NEXT_PUBLIC_SPOTIFY_CLIENT_ID (ver README).
 * O controle (tocar, pausar, avançar) exige Spotify Premium e um aparelho com o Spotify aberto.
 */

export const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
const SCOPES = "user-read-playback-state user-modify-playback-state user-read-currently-playing";
const TOKEN_KEY = "bodybuilder:spotify-token";
const VERIFIER_KEY = "bodybuilder:spotify-verifier";
const API = "https://api.spotify.com/v1";

export type SpotifyToken = { access: string; refresh: string; expiresAt: number };

export function redirectUri(): string {
  return `${location.origin}/spotify-callback/`;
}

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function newVerifier(): string {
  return b64url(crypto.getRandomValues(new Uint8Array(48)));
}

export async function challengeFor(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return b64url(new Uint8Array(hash));
}

export async function startLogin(): Promise<void> {
  const verifier = newVerifier();
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  const q = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri(),
    code_challenge_method: "S256",
    code_challenge: await challengeFor(verifier),
    scope: SCOPES
  });
  location.assign(`https://accounts.spotify.com/authorize?${q}`);
}

function save(t: SpotifyToken | null) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* armazenamento indisponível */
  }
}

export function loadToken(): SpotifyToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as SpotifyToken) : null;
  } catch {
    return null;
  }
}

export function logout(): void {
  save(null);
}

async function tokenRequest(body: Record<string, string>, previousRefresh?: string): Promise<SpotifyToken> {
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: SPOTIFY_CLIENT_ID, ...body })
  });
  if (!r.ok) throw new Error("Falha no login do Spotify.");
  const j = (await r.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  const t = { access: j.access_token, refresh: j.refresh_token ?? previousRefresh ?? "", expiresAt: Date.now() + (j.expires_in - 60) * 1000 };
  save(t);
  return t;
}

/** Troca o código recebido na volta do login por um token. */
export async function finishLogin(code: string): Promise<void> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("Login expirado. Tente de novo.");
  sessionStorage.removeItem(VERIFIER_KEY);
  await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri(), code_verifier: verifier });
}

async function validToken(): Promise<SpotifyToken | null> {
  const t = loadToken();
  if (!t) return null;
  if (Date.now() < t.expiresAt) return t;
  if (!t.refresh) return null;
  try {
    return await tokenRequest({ grant_type: "refresh_token", refresh_token: t.refresh }, t.refresh);
  } catch {
    save(null);
    return null;
  }
}

export type NowPlaying = { playing: boolean; title: string; artist: string; image?: string; device?: string } | null;

export class SpotifyError extends Error {
  constructor(
    message: string,
    public code: "sem-login" | "sem-aparelho" | "premium" | "rede"
  ) {
    super(message);
  }
}

async function call(path: string, init: RequestInit = {}): Promise<Response> {
  const t = await validToken();
  if (!t) throw new SpotifyError("Entre no Spotify para controlar a música.", "sem-login");
  let r: Response;
  try {
    r = await fetch(`${API}${path}`, { ...init, headers: { ...init.headers, authorization: `Bearer ${t.access}` } });
  } catch {
    throw new SpotifyError("Sem conexão com o Spotify.", "rede");
  }
  if (r.status === 401) {
    save(null);
    throw new SpotifyError("O login do Spotify expirou. Entre de novo.", "sem-login");
  }
  if (r.status === 404)
    throw new SpotifyError("Abra o Spotify no celular ou no computador e toque uma música para o app encontrar o aparelho.", "sem-aparelho");
  if (r.status === 403) throw new SpotifyError("O controle do player exige Spotify Premium.", "premium");
  return r;
}

export async function nowPlaying(): Promise<NowPlaying> {
  const r = await call("/me/player");
  if (r.status === 204) return null;
  const j = (await r.json()) as {
    is_playing: boolean;
    device?: { name: string };
    item?: { name: string; artists?: { name: string }[]; album?: { images?: { url: string }[] }; show?: { name: string } };
  };
  if (!j.item) return null;
  return {
    playing: j.is_playing,
    title: j.item.name,
    artist: j.item.artists?.map((a) => a.name).join(", ") ?? j.item.show?.name ?? "",
    image: j.item.album?.images?.at(-1)?.url,
    device: j.device?.name
  };
}

export const play = (contextUri?: string) =>
  call("/me/player/play", {
    method: "PUT",
    ...(contextUri ? { headers: { "content-type": "application/json" }, body: JSON.stringify({ context_uri: contextUri }) } : {})
  });
export const pause = () => call("/me/player/pause", { method: "PUT" });
export const next = () => call("/me/player/next", { method: "POST" });
export const previous = () => call("/me/player/previous", { method: "POST" });
