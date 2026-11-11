"use client";

import clsx from "clsx";
import {
  ExternalLink,
  Music2,
  Pause,
  Play,
  SkipForward,
  Trash2,
  Upload,
  Volume2
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BUNDLED_TRACKS, MUSIC_STYLES, SPOTIFY_DEFAULTS } from "@/data/music";
import {
  addTrack,
  listTracks,
  removeTrack,
  type LocalTrack,
  type MusicStyle
} from "@/lib/musicDb";
import { uid } from "@/lib/id";
import { embedUrl, openUrl, parseSpotify } from "@/lib/spotify";
import { useStore } from "@/lib/store";
import { AudioControls } from "./AudioControls";

type Playable = {
  key: string;
  title: string;
  src: string;
  local: boolean;
  id?: string;
};

/**
 * Player de música por estilo, com duas fontes: Spotify (player oficial incorporado, playlist escolhível)
 * ou arquivos do próprio aparelho, salvos apenas neste navegador.
 */
export function MusicPlayer({ compact = false }: { compact?: boolean }) {
  const source = useStore((s) => s.settings.musicSource ?? "spotify");
  const updateSettings = useStore((s) => s.updateSettings);
  const [style, setStyle] = useState<MusicStyle>("metal");

  return (
    <div className="space-y-4">
      <div
        className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-iron p-1"
        role="tablist"
        aria-label="Fonte da música"
      >
        {(
          [
            ["spotify", "Spotify"],
            ["local", "Arquivos do aparelho"]
          ] as const
        ).map(([id, text]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={source === id}
            className={clsx(
              "min-h-10 rounded-lg px-2 text-sm font-medium transition",
              source === id
                ? "bg-graphite text-bronze-light"
                : "text-muted hover:text-parchment"
            )}
            onClick={() => updateSettings({ musicSource: id })}
          >
            {text}
          </button>
        ))}
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Estilo musical"
      >
        {MUSIC_STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={style === s.id}
            className={clsx("chip", style === s.id && "chip-on")}
            onClick={() => setStyle(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {source === "spotify" ? (
        <SpotifyPlayer style={style} compact={compact} />
      ) : (
        <LocalPlayer key={style} style={style} />
      )}

      {compact && (
        <div className="border-t border-line pt-3">
          <AudioControls />
        </div>
      )}
    </div>
  );
}

const NO_LINKS: Partial<Record<MusicStyle, string>> = {};

function SpotifyPlayer({
  style,
  compact
}: {
  style: MusicStyle;
  compact: boolean;
}) {
  const enabled = useStore((s) => s.settings.spotifyEnabled ?? false);
  const custom = useStore((s) => s.settings.spotify) ?? NO_LINKS;
  const updateSettings = useStore((s) => s.updateSettings);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const label = MUSIC_STYLES.find((s) => s.id === style)?.label;
  const chosen = custom[style];
  const ref =
    parseSpotify(chosen ?? "") ?? parseSpotify(SPOTIFY_DEFAULTS[style].url)!;

  const saveLink = () => {
    if (!draft.trim()) {
      const next = { ...custom };
      delete next[style];
      updateSettings({ spotify: next });
      setEditing(false);
      return;
    }
    if (!parseSpotify(draft)) {
      setError(
        "Link não reconhecido. Use “Compartilhar → Copiar link” de uma playlist, álbum ou artista no Spotify."
      );
      return;
    }
    updateSettings({ spotify: { ...custom, [style]: draft.trim() } });
    setEditing(false);
    setError("");
  };

  if (!enabled) {
    return (
      <div
        className="space-y-3 rounded-xl border border-line bg-iron p-4"
        data-testid="spotify-consentimento"
      >
        <p className="flex items-center gap-2 font-semibold">
          <Music2 size={18} className="text-bronze-light" aria-hidden /> Ouça
          pelo Spotify
        </p>
        <p className="text-sm text-sand">
          O player oficial do Spotify é carregado dos servidores do Spotify, que
          podem usar cookies. Só carregamos depois que você permitir. Com login
          no Spotify Premium, as faixas tocam inteiras; sem login, o Spotify
          toca prévias de 30 segundos.
        </p>
        <button
          type="button"
          className="btn-primary min-h-11"
          onClick={() => updateSettings({ spotifyEnabled: true })}
        >
          Carregar player do Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <iframe
        key={embedUrl(ref)}
        title={`Spotify: ${label}`}
        src={embedUrl(ref)}
        width="100%"
        height={compact ? 152 : 352}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="w-full rounded-xl border-0"
        data-testid="spotify-player"
      />
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">
          {chosen
            ? "Sua escolha para " + label
            : `Padrão: ${SPOTIFY_DEFAULTS[style].title}`}
        </span>
        <a
          className="btn-ghost min-h-10 px-2"
          href={openUrl(ref)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={16} aria-hidden /> Abrir no Spotify
        </a>
        <button
          type="button"
          className="btn-ghost min-h-10 px-2"
          onClick={() => {
            setDraft(chosen ?? "");
            setError("");
            setEditing((e) => !e);
          }}
          aria-expanded={editing}
        >
          Trocar playlist
        </button>
      </div>
      {editing && (
        <div className="space-y-2 rounded-xl border border-line bg-iron p-3">
          <label htmlFor={`spotify-link-${style}`} className="label">
            Link do Spotify para {label}
          </label>
          <input
            id={`spotify-link-${style}`}
            className="input"
            inputMode="url"
            placeholder="https://open.spotify.com/playlist/…"
            value={draft}
            onChange={(e) => (setDraft(e.target.value), setError(""))}
            aria-invalid={!!error}
            aria-describedby={
              error ? `spotify-erro-${style}` : `spotify-dica-${style}`
            }
          />
          {error ? (
            <p
              id={`spotify-erro-${style}`}
              role="alert"
              className="text-sm text-danger"
            >
              {error}
            </p>
          ) : (
            <p id={`spotify-dica-${style}`} className="text-xs text-muted">
              Aceita playlist, álbum, artista ou faixa. Deixe vazio para voltar
              à playlist padrão.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary min-h-10"
              onClick={saveLink}
            >
              Salvar
            </button>
            <button
              type="button"
              className="btn-ghost min-h-10"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        className="text-xs text-muted underline"
        onClick={() => updateSettings({ spotifyEnabled: false })}
      >
        Desligar o player do Spotify
      </button>
    </div>
  );
}

function LocalPlayer({ style }: { style: MusicStyle }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const urls = useRef<Map<string, string>>(new Map());
  const [local, setLocal] = useState<LocalTrack[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void listTracks().then(setLocal);
    const map = urls.current;
    return () => map.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const urlFor = useCallback((t: LocalTrack) => {
    let u = urls.current.get(t.id);
    if (!u) {
      u = URL.createObjectURL(t.blob);
      urls.current.set(t.id, u);
    }
    return u;
  }, []);

  const tracks: Playable[] = [
    ...BUNDLED_TRACKS[style].map((t) => ({
      key: t.src,
      title: `${t.title} — ${t.artist}`,
      src: t.src,
      local: false
    })),
    ...local
      .filter((t) => t.style === style)
      .map((t) => ({
        key: t.id,
        id: t.id,
        title: t.name,
        src: urlFor(t),
        local: true
      }))
  ];
  const current = tracks[index] ?? tracks[0];

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // troca de estilo/faixa: se estava tocando, continua tocando a nova faixa
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!current) {
      a.pause();
      a.removeAttribute("src");
      a.load();
      setPlaying(false);
      return;
    }
    if (a.getAttribute("src") !== current.src) {
      const wasPlaying = playing;
      a.src = current.src;
      if (wasPlaying) void a.play().catch(() => setPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) {
      a.play()
        .then(() => setError(""))
        .catch(() =>
          setError(
            "O navegador bloqueou a reprodução. Toque em tocar novamente."
          )
        );
    } else a.pause();
  };

  const next = () => tracks.length && setIndex((i) => (i + 1) % tracks.length);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const added: LocalTrack[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("audio/")) continue;
      const t: LocalTrack = {
        id: uid("m_"),
        style,
        name: f.name.replace(/\.[^.]+$/, ""),
        blob: f,
        addedAt: Date.now()
      };
      try {
        await addTrack(t);
      } catch {
        /* sem IndexedDB: a faixa fica só nesta sessão */
      }
      added.push(t);
    }
    if (!added.length)
      setError("Escolha arquivos de áudio (MP3, M4A, OGG, WAV…).");
    setLocal((l) => [...l, ...added]);
  };

  const label = MUSIC_STYLES.find((s) => s.id === style)?.label;

  return (
    <div className="space-y-4">
      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={next}
        preload="none"
      />

      {tracks.length === 0 ? (
        <p
          className="rounded-xl border border-line bg-iron p-3 text-sm text-sand"
          data-testid="musica-indisponivel"
        >
          Nenhuma faixa de {label} incluída no app: ainda não há músicas com
          licença verificada para distribuição. Você pode tocar arquivos do seu
          aparelho.
        </p>
      ) : (
        <p className="text-sm">
          <span className="text-muted">Tocando agora:</span>{" "}
          <span className="font-medium">{current?.title}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn-primary min-h-11"
          onClick={toggle}
          disabled={!current}
        >
          {playing ? (
            <Pause size={18} aria-hidden />
          ) : (
            <Play size={18} aria-hidden />
          )}
          {playing ? "Pausar" : "Tocar"}
        </button>
        <button
          type="button"
          className="btn-secondary min-h-11"
          onClick={next}
          disabled={tracks.length < 2}
        >
          <SkipForward size={18} aria-hidden /> Próxima
        </button>
        <button
          type="button"
          className="btn-secondary min-h-11"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={18} aria-hidden /> Adicionar arquivo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          multiple
          className="sr-only"
          aria-label={`Adicionar arquivos de música ao estilo ${label}`}
          onChange={(e) =>
            void onFiles(e.target.files).then(() => (e.target.value = ""))
          }
        />
      </div>

      <div className="flex items-center gap-3">
        <Volume2 size={18} className="text-muted" aria-hidden />
        <label htmlFor="volume-musica" className="sr-only">
          Volume da música
        </label>
        <input
          id="volume-musica"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full accent-[#B07D45]"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {tracks.some((t) => t.local) && (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {tracks.map((t, i) =>
            t.local ? (
              <li
                key={t.key}
                className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm"
              >
                <button
                  type="button"
                  className={clsx(
                    "min-h-10 flex-1 truncate text-left",
                    i === index && "text-bronze-light"
                  )}
                  onClick={() => setIndex(i)}
                >
                  {t.title}
                </button>
                <button
                  type="button"
                  className="btn-ghost min-h-10 px-2"
                  aria-label={`Remover ${t.title}`}
                  onClick={() => {
                    void removeTrack(t.id!);
                    setLocal((l) => l.filter((x) => x.id !== t.id));
                    setIndex(0);
                  }}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </li>
            ) : null
          )}
        </ul>
      )}
      <p className="text-xs text-muted">
        Arquivos adicionados ficam salvos só neste navegador e não são enviados
        para nenhum servidor.
      </p>
    </div>
  );
}
