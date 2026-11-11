"use client";

import clsx from "clsx";
import { Pause, Play, SkipForward, Trash2, Upload, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BUNDLED_TRACKS, MUSIC_STYLES } from "@/data/music";
import { addTrack, listTracks, removeTrack, type LocalTrack, type MusicStyle } from "@/lib/musicDb";
import { uid } from "@/lib/id";
import { AudioControls } from "./AudioControls";

type Playable = { key: string; title: string; src: string; local: boolean; id?: string };

/**
 * Player de música por estilo. Sem faixas licenciadas incluídas: o usuário escolhe arquivos do próprio aparelho,
 * que ficam salvos apenas neste navegador.
 */
export function MusicPlayer({ compact = false }: { compact?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const urls = useRef<Map<string, string>>(new Map());
  const [style, setStyle] = useState<MusicStyle>("metal");
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
    ...BUNDLED_TRACKS[style].map((t) => ({ key: t.src, title: `${t.title} — ${t.artist}`, src: t.src, local: false })),
    ...local.filter((t) => t.style === style).map((t) => ({ key: t.id, id: t.id, title: t.name, src: urlFor(t), local: true }))
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
        .catch(() => setError("O navegador bloqueou a reprodução. Toque em tocar novamente."));
    } else a.pause();
  };

  const next = () => tracks.length && setIndex((i) => (i + 1) % tracks.length);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const added: LocalTrack[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("audio/")) continue;
      const t: LocalTrack = { id: uid("m_"), style, name: f.name.replace(/\.[^.]+$/, ""), blob: f, addedAt: Date.now() };
      try {
        await addTrack(t);
      } catch {
        /* sem IndexedDB: a faixa fica só nesta sessão */
      }
      added.push(t);
    }
    if (!added.length) setError("Escolha arquivos de áudio (MP3, M4A, OGG, WAV…).");
    setLocal((l) => [...l, ...added]);
  };

  const label = MUSIC_STYLES.find((s) => s.id === style)?.label;

  return (
    <div className="space-y-4">
      <audio ref={audioRef} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={next} preload="none" />
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Estilo musical">
        {MUSIC_STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={style === s.id}
            className={clsx("chip", style === s.id && "chip-on")}
            onClick={() => {
              setStyle(s.id);
              setIndex(0);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {tracks.length === 0 ? (
        <p className="rounded-xl border border-line bg-iron p-3 text-sm text-sand" data-testid="musica-indisponivel">
          Nenhuma faixa de {label} incluída no app: ainda não há músicas com licença verificada para distribuição. Você pode tocar arquivos do seu aparelho.
        </p>
      ) : (
        <p className="text-sm">
          <span className="text-muted">Tocando agora:</span> <span className="font-medium">{current?.title}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary min-h-11" onClick={toggle} disabled={!current}>
          {playing ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
          {playing ? "Pausar" : "Tocar"}
        </button>
        <button type="button" className="btn-secondary min-h-11" onClick={next} disabled={tracks.length < 2}>
          <SkipForward size={18} aria-hidden /> Próxima
        </button>
        <button type="button" className="btn-secondary min-h-11" onClick={() => fileRef.current?.click()}>
          <Upload size={18} aria-hidden /> Adicionar arquivo
        </button>
        <input ref={fileRef} type="file" accept="audio/*" multiple className="sr-only" aria-label={`Adicionar arquivos de música ao estilo ${label}`} onChange={(e) => void onFiles(e.target.files).then(() => (e.target.value = ""))} />
      </div>

      <div className="flex items-center gap-3">
        <Volume2 size={18} className="text-muted" aria-hidden />
        <label htmlFor="volume-musica" className="sr-only">
          Volume da música
        </label>
        <input id="volume-musica" type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full accent-[#B07D45]" />
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
              <li key={t.key} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
                <button type="button" className={clsx("min-h-10 flex-1 truncate text-left", i === index && "text-bronze-light")} onClick={() => setIndex(i)}>
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
      <p className="text-xs text-muted">Arquivos adicionados ficam salvos só neste navegador e não são enviados para nenhum servidor.</p>

      {compact && (
        <div className="border-t border-line pt-3">
          <AudioControls />
        </div>
      )}
    </div>
  );
}
