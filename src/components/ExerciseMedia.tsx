"use client";

import clsx from "clsx";
import { Pause, Play, Images, Film } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { getAnim } from "@/data/media";
import { ATLAS_BG, ATLAS_COLORS, renderAtlas } from "@/lib/anim/atlas";
import { fitTransform, sample, type AnimSpec } from "@/lib/anim/render";
import { MUSCLES, type Exercise } from "@/lib/types";

type Props = {
  exercise: Exercise;
  /** "card": lista da biblioteca; "large": ficha e treino ativo */
  variant?: "card" | "large";
  className?: string;
};

const FPS = 30;

function prefersReducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Quadro estático da animação em SVG; ids dos gradientes fixos por exercício e posição (iguais no servidor e no aparelho). */
export function stillSvg(spec: AnimSpec, exercise: Pick<Exercise, "id" | "primary" | "secondary">, pose: "inicio" | "fim" = "inicio"): string {
  const suffix = `s${exercise.id.replace(/[^a-z0-9]/gi, "")}${pose}`;
  const fit = fitTransform(spec);
  const key = pose === "fim" && spec.keys.length > 1 ? spec.keys[1] : spec.keys[0];
  const inner = renderAtlas(spec, key.pose, key.at ?? spec.at, { primary: exercise.primary, secondary: exercise.secondary }, suffix);
  return `${ATLAS_BG(suffix)}<g transform="translate(${fit.tx} ${fit.ty}) scale(${fit.s})">${inner}</g>`;
}

/** Quadro estático em SVG (posição inicial, final ou um instante t) */
export function AnimStill({ spec, exercise, pose = "inicio", className }: { spec: AnimSpec; exercise: Exercise; pose?: "inicio" | "fim"; className?: string }) {
  const html = stillSvg(spec, exercise, pose);
  return <svg viewBox="0 0 320 240" className={className} aria-hidden dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Demonstração do exercício: animação própria em SVG (boneco com o músculo trabalhado em destaque).
 * Toca sozinha quando está na tela; pausa fora da tela, com a aba escondida ou com "reduzir movimento" ligado.
 */
export function ExerciseMedia({ exercise, variant = "card", className }: Props) {
  const spec = getAnim(exercise.id);
  const large = variant === "large";
  const moving = !!spec && spec.keys.length > 1 && !exercise.isometric;
  const [view, setView] = useState<"anim" | "posicoes">("anim");
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const boxRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [visible, setVisible] = useState(false);

  const fit = useMemo(() => (spec ? fitTransform(spec) : null), [spec]);
  const suffix = useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    setView("anim");
  }, [exercise.id]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "80px" });
    io.observe(el);
    return () => io.disconnect();
  }, [view]);

  // desenha o quadro; anima só quando faz sentido
  useEffect(() => {
    const g = gRef.current;
    if (!spec || !g || view !== "anim") return;
    const opts = { primary: exercise.primary, secondary: exercise.secondary };
    const draw = (t: number) => {
      const ph = sample(spec, t);
      g.innerHTML = renderAtlas(spec, ph.pose, ph.at, opts, suffix);
    };
    draw(0);
    const run = (moving || exercise.isometric) && playing && visible;
    if (!run) return;
    let raf = 0;
    let last = 0;
    const start = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (document.hidden || now - last < 1000 / FPS) return;
      last = now;
      draw((now - start) / 1000);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spec, exercise, view, playing, visible, moving, suffix]);

  if (!spec || !fit) {
    return (
      <div className={clsx("flex aspect-[4/3] items-center justify-center rounded-xl bg-steel p-4 text-center text-sm text-muted", className)}>
        {exercise.custom ? "Exercício criado por você: sem demonstração animada." : "Demonstração ainda não disponível para este exercício."}
      </div>
    );
  }

  const label = playing ? `Pausar demonstração de ${exercise.name}` : `Reproduzir demonstração de ${exercise.name}`;

  return (
    <div className={clsx("relative", className)}>
      {view === "anim" ? (
        <div ref={boxRef} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#E8E7E3]">
          <svg viewBox="0 0 320 240" className="h-full w-full" role="img" aria-label={`Animação: ${exercise.name}`}>
            <g dangerouslySetInnerHTML={{ __html: ATLAS_BG(suffix) }} />
            <g transform={`translate(${fit.tx} ${fit.ty}) scale(${fit.s})`} ref={gRef} />
          </svg>
          {!moving && <span className="absolute bottom-2 left-2 rounded-md bg-iron/75 px-2 py-1 text-xs font-medium text-sand">Posição sustentada</span>}
          {!large && moving && (
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={label}
              className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-iron/70 text-parchment shadow backdrop-blur hover:bg-iron"
            >
              {playing ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
            </button>
          )}
        </div>
      ) : (
        <StaticFrames exercise={exercise} spec={spec} large={large} moving={moving} />
      )}

      {large && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {moving && view === "anim" && (
            <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={label} className="btn-secondary min-h-11 px-3 text-sm">
              {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
              {playing ? "Pausar" : "Reproduzir"}
            </button>
          )}
          <div className="inline-flex rounded-lg border border-line p-0.5" role="group" aria-label="Tipo de demonstração">
            <button
              type="button"
              aria-pressed={view === "anim"}
              onClick={() => setView("anim")}
              className={clsx("flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm", view === "anim" ? "bg-steel text-bronze-light" : "text-sand")}
            >
              <Film size={16} aria-hidden /> Animação
            </button>
            <button
              type="button"
              aria-pressed={view === "posicoes"}
              onClick={() => setView("posicoes")}
              className={clsx("flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm", view === "posicoes" ? "bg-steel text-bronze-light" : "text-sand")}
            >
              <Images size={16} aria-hidden /> Posições
            </button>
          </div>
          {!moving && <p className="text-xs text-muted">Exercício isométrico: mantenha a posição mostrada.</p>}
        </div>
      )}
      <MuscleLegend exercise={exercise} compact={!large} />
    </div>
  );
}

/** Legenda das cores: cada músculo trabalhado tem a sua */
export function MuscleLegend({ exercise, compact = false }: { exercise: Exercise; compact?: boolean }) {
  const list = [exercise.primary, ...exercise.secondary];
  return (
    <ul className={clsx("flex flex-wrap gap-x-3 gap-y-1", compact ? "mt-2 text-xs" : "mt-3 text-sm")} aria-label="Cores dos músculos na animação">
      {list.map((m, i) => (
        <li key={m} className={clsx("flex items-center gap-1.5", i === 0 ? "font-semibold text-parchment" : "text-sand")}>
          <span
            aria-hidden
            className={clsx("inline-block rounded-full", i === 0 ? "h-3 w-3" : "h-2.5 w-2.5 opacity-80")}
            style={{ background: i === 0 ? ATLAS_COLORS.primary : ATLAS_COLORS.secondary }}
          />
          {MUSCLES[m]}
          {i === 0 && !compact && <span className="font-normal text-muted">(principal)</span>}
        </li>
      ))}
    </ul>
  );
}

function StaticFrames({ exercise, spec, large, moving }: { exercise: Exercise; spec: AnimSpec; large: boolean; moving: boolean }) {
  const frames: ("inicio" | "fim")[] = moving ? ["inicio", "fim"] : ["inicio"];
  const labels = moving ? ["Posição inicial", "Posição final"] : [exercise.isometric ? "Posição sustentada" : "Posição"];
  return (
    <div className={clsx("grid gap-2", frames.length > 1 && "grid-cols-2")}>
      {frames.map((f, i) => (
        <figure key={f} className="overflow-hidden rounded-xl bg-[#E8E7E3]">
          <AnimStill spec={spec} exercise={exercise} pose={f} className="aspect-[4/3] w-full" />
          <figcaption className={clsx("bg-steel px-2 py-1.5 text-center font-medium text-sand", large ? "text-sm" : "text-xs")}>{labels[i]}</figcaption>
        </figure>
      ))}
    </div>
  );
}
