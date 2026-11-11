import clsx from "clsx";
import { Dumbbell } from "lucide-react";
import { getMedia } from "@/data/media";

/** Miniatura do exercício; exercícios sem mídia (criados pelo usuário) mostram um ícone. */
export function ExerciseThumb({ id, className, width, height }: { id: string; className?: string; width: number; height: number }) {
  const poster = getMedia(id)?.poster;
  if (!poster) {
    return (
      <span className={clsx("flex shrink-0 items-center justify-center rounded-lg bg-steel text-muted", className)} style={{ width, height }} aria-hidden>
        <Dumbbell size={22} />
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img src={poster} alt="" className={clsx("shrink-0 rounded-lg bg-[#ECEBE7] object-contain", className)} loading="lazy" width={width} height={height} />
  );
}
