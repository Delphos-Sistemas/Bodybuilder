"use client";

import clsx from "clsx";
import { Pause, Play, Images, Film } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { getMedia } from "@/data/media";
import type { Exercise } from "@/lib/types";

const PLAY_EVENT = "bb-media-play";

type Props = {
  exercise: Exercise;
  /** "card": capa leve; "large": ficha e treino ativo */
  variant?: "card" | "large";
  className?: string;
};

/**
 * Demonstração do exercício. Carrega primeiro a capa; o vídeo só é baixado quando o usuário toca em reproduzir.
 * Apenas uma demonstração toca por vez. Oferece sempre a alternativa estática (posições inicial e final).
 */
export function ExerciseMedia({ exercise, variant = "card", className }: Props) {
  const media = getMedia(exercise.id);
  const instanceId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [view, setView] = useState<"video" | "posicoes">("video");
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== instanceId) {
        videoRef.current?.pause();
      }
    };
    window.addEventListener(PLAY_EVENT, onOther);
    return () => window.removeEventListener(PLAY_EVENT, onOther);
  }, [instanceId]);

  // ao trocar de exercício (treino ativo), volta para a capa
  useEffect(() => {
    setLoaded(false);
    setPlaying(false);
    setView("video");
  }, [exercise.id]);

  const toggle = useCallback(() => {
    if (!media?.video) return;
    if (!loaded) {
      setLoaded(true);
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [loaded, media]);

  // quando o <video> é montado após o primeiro toque, inicia a reprodução
  useEffect(() => {
    if (loaded && videoRef.current) {
      window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: instanceId }));
      void videoRef.current.play().catch(() => setPlaying(false));
    }
  }, [loaded, instanceId]);

  if (!media) {
    return (
      <div className={clsx("flex aspect-[4/3] items-center justify-center rounded-xl bg-[#ECEBE7] p-4 text-center text-sm text-neutral-600", className)}>
        {exercise.custom ? "Exercício criado por você: sem demonstração em imagem." : "Demonstração ainda não disponível para este exercício."}
      </div>
    );
  }

  const large = variant === "large";
  const showVideo = !!media.video && view === "video";

  return (
    <div className={clsx("relative", className)}>
      {showVideo ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#ECEBE7]">
          {loaded ? (
            <video
              ref={videoRef}
              className="h-full w-full object-contain"
              poster={large ? media.frames[0] : media.poster}
              muted
              loop
              playsInline
              preload="none"
              aria-label={`Demonstração em vídeo: ${exercise.name}`}
              onPlay={() => {
                setPlaying(true);
                window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: instanceId }));
              }}
              onPause={() => setPlaying(false)}
            >
              <source src={media.video!.webm} type="video/webm" />
              <source src={media.video!.mp4} type="video/mp4" />
            </video>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={large ? media.frames[0] : media.poster}
              alt={`${exercise.name}: posição inicial`}
              className="h-full w-full object-contain"
              loading={large ? "eager" : "lazy"}
              decoding="async"
              width={large ? 800 : 480}
              height={large ? 600 : 360}
            />
          )}
          {!large && (
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? `Pausar demonstração de ${exercise.name}` : `Reproduzir demonstração de ${exercise.name}`}
              className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-iron/85 text-parchment shadow hover:bg-iron"
            >
              {playing ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
            </button>
          )}
        </div>
      ) : (
        <StaticFrames exercise={exercise} frames={media.frames} large={large} />
      )}

      {large && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {showVideo && (
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? `Pausar demonstração de ${exercise.name}` : `Reproduzir demonstração de ${exercise.name}`}
              className="btn-secondary min-h-11 px-3 text-sm"
            >
              {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
              {playing ? "Pausar" : "Reproduzir"}
            </button>
          )}
          {media.video && (
            <div className="inline-flex rounded-lg border border-line p-0.5" role="group" aria-label="Tipo de demonstração">
              <button
                type="button"
                aria-pressed={view === "video"}
                onClick={() => setView("video")}
                className={clsx("flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm", view === "video" ? "bg-steel text-bronze-light" : "text-sand")}
              >
                <Film size={16} aria-hidden /> Vídeo
              </button>
              <button
                type="button"
                aria-pressed={view === "posicoes"}
                onClick={() => {
                  videoRef.current?.pause();
                  setView("posicoes");
                }}
                className={clsx("flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm", view === "posicoes" ? "bg-steel text-bronze-light" : "text-sand")}
              >
                <Images size={16} aria-hidden /> Posições
              </button>
            </div>
          )}
          <p className="text-xs text-muted">
            {media.video
              ? "Vídeo curto que alterna entre a posição inicial e a final."
              : exercise.isometric
                ? "Exercício isométrico: mantenha a posição mostrada."
                : "Imagem estática do movimento."}
          </p>
        </div>
      )}
    </div>
  );
}

function StaticFrames({ exercise, frames, large }: { exercise: Exercise; frames: string[]; large: boolean }) {
  const labels = frames.length > 1 ? ["Posição inicial", "Posição final"] : [exercise.isometric ? "Posição sustentada" : "Posição"];
  return (
    <div className={clsx("grid gap-2", frames.length > 1 && "grid-cols-2")}>
      {frames.map((src, i) => (
        <figure key={src} className="overflow-hidden rounded-xl bg-[#ECEBE7]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${exercise.name}: ${labels[i].toLowerCase()}`}
            className="aspect-[4/3] w-full object-contain"
            loading="lazy"
            decoding="async"
            width={800}
            height={600}
          />
          <figcaption className={clsx("bg-steel px-2 py-1.5 text-center font-medium text-sand", large ? "text-sm" : "text-xs")}>{labels[i]}</figcaption>
        </figure>
      ))}
    </div>
  );
}
