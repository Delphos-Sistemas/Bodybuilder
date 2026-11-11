"use client";

import { LogOut, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SPOTIFY_CLIENT_ID, SpotifyError, loadToken, logout, next, nowPlaying, pause, play, previous, startLogin, type NowPlaying } from "@/lib/spotifyAuth";
import type { SpotifyRef } from "@/lib/spotify";

/**
 * Controle remoto do Spotify (Premium): mostra a faixa atual e controla o app do Spotify que está tocando,
 * que continua funcionando com a tela bloqueada. Aparece só se o app foi publicado com um Client ID.
 */
export function SpotifyRemote({ context }: { context: SpotifyRef }) {
  const [logged, setLogged] = useState(false);
  const [np, setNp] = useState<NowPlaying>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setLogged(!!loadToken()), []);

  const refresh = useCallback(async () => {
    try {
      setNp(await nowPlaying());
      setError("");
    } catch (e) {
      if (e instanceof SpotifyError && e.code === "sem-login") setLogged(false);
      setError(e instanceof Error ? e.message : "Erro no Spotify.");
    }
  }, []);

  useEffect(() => {
    if (!logged) return;
    void refresh();
    const t = setInterval(() => document.visibilityState === "visible" && void refresh(), 10_000);
    return () => clearInterval(t);
  }, [logged, refresh]);

  if (!SPOTIFY_CLIENT_ID) return null;

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      setTimeout(() => void refresh(), 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no Spotify.");
    } finally {
      setBusy(false);
    }
  };

  if (!logged) {
    return (
      <div className="space-y-2 rounded-xl border border-line bg-iron p-3" data-testid="spotify-login">
        <p className="text-sm text-sand">Tem Spotify Premium? Entre para controlar o app do Spotify daqui: tocar a playlist do estilo, pausar e avançar.</p>
        <button type="button" className="btn-secondary min-h-10" onClick={() => void startLogin()}>
          Entrar com Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-line bg-iron p-3" data-testid="spotify-controle">
      {np ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {np.image && <img src={np.image} alt="" width={48} height={48} className="h-12 w-12 rounded-md" />}
          <p className="min-w-0 flex-1 text-sm">
            <span className="block truncate font-medium" data-testid="spotify-faixa">
              {np.title}
            </span>
            <span className="block truncate text-muted">
              {np.artist}
              {np.device ? ` · ${np.device}` : ""}
            </span>
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">Nada tocando agora.</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-ghost min-h-11 px-3" disabled={busy} onClick={() => void act(previous)} aria-label="Faixa anterior">
          <SkipBack size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="btn-primary min-h-11 px-4"
          disabled={busy}
          onClick={() => void act(() => (np?.playing ? pause() : play()))}
          aria-label={np?.playing ? "Pausar Spotify" : "Tocar Spotify"}
        >
          {np?.playing ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
        </button>
        <button type="button" className="btn-ghost min-h-11 px-3" disabled={busy} onClick={() => void act(next)} aria-label="Próxima faixa">
          <SkipForward size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="btn-secondary min-h-11 px-3 text-sm"
          disabled={busy}
          onClick={() => void act(() => play(`spotify:${context.kind}:${context.id}`))}
        >
          Tocar esta playlist
        </button>
        <button
          type="button"
          className="btn-ghost ml-auto min-h-10 px-2 text-xs"
          onClick={() => {
            logout();
            setLogged(false);
          }}
        >
          <LogOut size={14} aria-hidden /> Sair
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
