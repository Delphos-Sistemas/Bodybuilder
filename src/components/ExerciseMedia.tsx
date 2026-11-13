"use client";

import clsx from "clsx";
import { Pause, Play, Images, Film } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { getAnim } from "@/data/media";
import { SVG_DEFS, fitTransform, renderFrame, sample, type AnimSpec } from "@/lib/anim/render";
import type { Exercise } from "@/lib/types";

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

let stillCount = 0;

/** dá ids próprios aos filtros/gradientes de cada SVG (vários na mesma página) */
function scopeIds(html: string, suffix: string): string {
  return html.replace(/bbglow|bbbg/g, (m) => m + suffix);
}

export function stillSvg(spec: AnimSpec, exercise: Pick<Exercise, "primary" | "secondary">, pose: "inicio" | "fim" = "inicio"): string {
  const suffix = `s${++stillCount}`;
  const fit = fitTransform(spec);
  const key = pose === "fim" && spec.keys.length > 1 ? spec.keys[1] : spec.keys[0];
  const inner = renderFrame(spec, key.pose, key.at ?? spec.at, { primary: exercise.primary, secondary: exercise.secondary });
  return scopeIds(`${SVG_DEFS}<g transform="translate(${fit.tx} ${fit.ty}) scale(${fit.s})">${inner}</g>`, suffix);
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
      g.innerHTML = scopeIds(renderFrame(spec, ph.pose, ph.at, opts), suffix);
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
        <div ref={boxRef} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#121010]">
          <svg viewBox="0 0 320 240" className="h-full w-full" role="img" aria-label={`Animação: ${exercise.name}`}>
            <g dangerouslySetInnerHTML={{ __html: scopeIds(SVG_DEFS, suffix) }} />
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
          <p className="text-xs text-muted">
            {moving ? "Em laranja forte o músculo principal; em laranja claro, os que ajudam." : "Exercício isométrico: mantenha a posição mostrada."}
          </p>
        </div>
      )}
    </div>
  );
}

function StaticFrames({ exercise, spec, large, moving }: { exercise: Exercise; spec: AnimSpec; large: boolean; moving: boolean }) {
  const frames: ("inicio" | "fim")[] = moving ? ["inicio", "fim"] : ["inicio"];
  const labels = moving ? ["Posição inicial", "Posição final"] : [exercise.isometric ? "Posição sustentada" : "Posição"];
  return (
    <div className={clsx("grid gap-2", frames.length > 1 && "grid-cols-2")}>
      {frames.map((f, i) => (
        <figure key={f} className="overflow-hidden rounded-xl bg-[#121010]">
          <AnimStill spec={spec} exercise={exercise} pose={f} className="aspect-[4/3] w-full" />
          <figcaption className={clsx("bg-steel px-2 py-1.5 text-center font-medium text-sand", large ? "text-sm" : "text-xs")}>{labels[i]}</figcaption>
        </figure>
      ))}
    </div>
  );
}
