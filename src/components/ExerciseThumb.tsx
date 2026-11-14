import clsx from "clsx";
import { Dumbbell } from "lucide-react";
import { getAnim } from "@/data/media";
import { getExercise } from "@/data/exercises";
import { stillSvg } from "./ExerciseMedia";

/** Miniatura do exercício (quadro da animação); exercícios criados pelo usuário mostram um ícone. */
export function ExerciseThumb({ id, className, width, height }: { id: string; className?: string; width: number; height: number }) {
  const spec = getAnim(id);
  const ex = getExercise(id);
  if (!spec || !ex) {
    return (
      <span className={clsx("flex shrink-0 items-center justify-center rounded-lg bg-steel text-muted", className)} style={{ width, height }} aria-hidden>
        <Dumbbell size={22} />
      </span>
    );
  }
  return (
    <svg
      viewBox="0 0 320 240"
      width={width}
      height={height}
      className={clsx("shrink-0 rounded-lg", className)}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: stillSvg(spec, ex, spec.keys.length > 1 && !ex.isometric ? "fim" : "inicio") }}
    />
  );
}
