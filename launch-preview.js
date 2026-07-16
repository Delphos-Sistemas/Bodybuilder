import type { Exercise, MuscleGroup } from "@/types/domain";
import { ptLabel } from "@/lib/format";

type ExerciseVisualProps = {
  exercise: Exercise;
  compact?: boolean;
};

const muscleTargets: Record<MuscleGroup, string[]> = {
  Peito: ["pec-left", "pec-right"],
  Costas: ["lat-left", "lat-right"],
  Ombros: ["shoulder-left", "shoulder-right"],
  Biceps: ["biceps-left", "biceps-right"],
  Triceps: ["triceps-left", "triceps-right"],
  Quadriceps: ["quad-left", "quad-right"],
  Posteriores: ["ham-left", "ham-right"],
  Gluteos: ["glute-left", "glute-right"],
  Panturrilhas: ["calf-left", "calf-right"],
  Abdomen: ["abs"],
  Antebraco: ["forearm-left", "forearm-right"],
  Trapezio: ["trap-left", "trap-right"],
  Cardio: ["heart", "quad-left", "quad-right", "calf-left", "calf-right"],
  Mobilidade: ["hip-left", "hip-right", "spine"]
};

function movementClass(exercise: Exercise) {
  const name = exercise.name.toLowerCase();
  if (exercise.exerciseType === "Cardio") return "visual-cardio";
  if (exercise.exerciseType === "Mobilidade") return "visual-mobility";
  if (["Quadriceps", "Posteriores", "Gluteos", "Panturrilhas"].includes(exercise.primaryMuscle)) return "visual-legs";
  if (name.includes("rosca") || exercise.primaryMuscle === "Biceps" || exercise.primaryMuscle === "Antebraco") return "visual-curl";
  if (name.includes("puxada") || name.includes("remada") || exercise.primaryMuscle === "Costas") return "visual-pull";
  if (exercise.primaryMuscle === "Triceps") return "visual-extend";
  return "visual-press";
}

export function ExerciseVisual({ exercise, compact = false }: ExerciseVisualProps) {
  const active = new Set(muscleTargets[exercise.primaryMuscle]);
  const secondary = new Set(exercise.secondaryMuscles.flatMap((muscle) => muscleTargets[muscle] ?? []));
  const cls = (id: string) => (active.has(id) ? "muscle primary" : secondary.has(id) ? "muscle secondary" : "muscle");

  return (
    <figure className={`exercise-visual ${movementClass(exercise)} ${compact ? "compact" : ""}`}>
      <div className="stage">
        <svg viewBox="0 0 260 300" role="img" aria-label={`Demonstração anatômica de ${exercise.name}`}>
          <defs>
            <linearGradient id={`skin-${exercise.id}`} x1="0" x2="1">
              <stop offset="0%" stopColor="#f8f4ec" />
              <stop offset="100%" stopColor="#cfc7ba" />
            </linearGradient>
            <radialGradient id={`muscle-${exercise.id}`} cx="50%" cy="45%" r="65%">
              <stop offset="0%" stopColor="#ffb199" />
              <stop offset="55%" stopColor="#d6472f" />
              <stop offset="100%" stopColor="#741b16" />
            </radialGradient>
          </defs>

          <g className="machine">
            <EquipmentSketch equipment={exercise.equipment} />
          </g>

          <g className="body" transform="translate(0 2)">
            <ellipse cx="130" cy="28" rx="18" ry="22" fill={`url(#skin-${exercise.id})`} stroke="#2e3032" strokeWidth="1.5" />
            <path d="M124 50h12l6 16h-24z" fill={`url(#skin-${exercise.id})`} stroke="#2e3032" strokeWidth="1" />

            <path id="trap-left" className={cls("trap-left")} d="M102 67c10-10 18-12 28-12v22c-11 0-20-2-28-10z" />
            <path id="trap-right" className={cls("trap-right")} d="M158 67c-10-10-18-12-28-12v22c11 0 20-2 28-10z" />
            <path id="lat-left" className={cls("lat-left")} d="M92 90c8-15 18-18 31-15l-5 60c-15-6-25-20-26-45z" />
            <path id="lat-right" className={cls("lat-right")} d="M168 90c-8-15-18-18-31-15l5 60c15-6 25-20 26-45z" />
            <path id="pec-left" className={cls("pec-left")} d="M102 76c11-6 20-6 28 1v38c-16-2-27-13-28-39z" />
            <path id="pec-right" className={cls("pec-right")} d="M158 76c-11-6-20-6-28 1v38c16-2 27-13 28-39z" />
            <path id="abs" className={cls("abs")} d="M112 115h36l8 55c-15 9-37 9-52 0z" />
            <path id="spine" className={cls("spine")} d="M127 78h6v96h-6z" />
            <path d="M101 170c17 10 41 10 58 0l-10 22h-38z" fill={`url(#skin-${exercise.id})`} stroke="#2e3032" strokeWidth="1" />
            <path id="glute-left" className={cls("glute-left")} d="M105 171c10 6 18 8 25 8l-9 24c-11-1-18-11-16-32z" />
            <path id="glute-right" className={cls("glute-right")} d="M155 171c-10 6-18 8-25 8l9 24c11-1 18-11 16-32z" />
            <path id="hip-left" className={cls("hip-left")} d="M104 164h25l-7 24c-9-2-16-9-18-24z" />
            <path id="hip-right" className={cls("hip-right")} d="M156 164h-25l7 24c9-2 16-9 18-24z" />

            <g className="left-arm arm">
              <path id="shoulder-left" className={cls("shoulder-left")} d="M98 72c-16 3-25 13-24 28 11 2 21-4 29-21z" />
              <path id="biceps-left" className={cls("biceps-left")} d="M74 98c-8 20-7 37 3 49 12-12 15-27 10-47z" />
              <path id="triceps-left" className={cls("triceps-left")} d="M87 99c6 17 5 32-10 48-5-16-3-33 10-48z" />
              <path id="forearm-left" className={cls("forearm-left")} d="M77 145c-5 17-2 31 8 43 9-11 10-25 2-42z" />
            </g>
            <g className="right-arm arm">
              <path id="shoulder-right" className={cls("shoulder-right")} d="M162 72c16 3 25 13 24 28-11 2-21-4-29-21z" />
              <path id="biceps-right" className={cls("biceps-right")} d="M186 98c8 20 7 37-3 49-12-12-15-27-10-47z" />
              <path id="triceps-right" className={cls("triceps-right")} d="M173 99c-6 17-5 32 10 48 5-16 3-33-10-48z" />
              <path id="forearm-right" className={cls("forearm-right")} d="M183 145c5 17 2 31-8 43-9-11-10-25-2-42z" />
            </g>

            <g className="left-leg leg">
              <path id="quad-left" className={cls("quad-left")} d="M108 194c15 3 25 14 25 41-12 4-23 0-31-12z" />
              <path id="ham-left" className={cls("ham-left")} d="M102 195c6 16 8 31 2 49-10-8-13-25-2-49z" />
              <path id="calf-left" className={cls("calf-left")} d="M104 239c13 5 20 20 15 39-15-4-23-17-15-39z" />
            </g>
            <g className="right-leg leg">
              <path id="quad-right" className={cls("quad-right")} d="M152 194c-15 3-25 14-25 41 12 4 23 0 31-12z" />
              <path id="ham-right" className={cls("ham-right")} d="M158 195c-6 16-8 31-2 49 10-8 13-25 2-49z" />
              <path id="calf-right" className={cls("calf-right")} d="M156 239c-13 5-20 20-15 39 15-4 23-17 15-39z" />
            </g>
            <circle id="heart" className={cls("heart")} cx="139" cy="95" r="6" />
          </g>
        </svg>
      </div>
      <figcaption>
        <span>{ptLabel(exercise.primaryMuscle)}</span>
        <strong>{ptLabel(exercise.equipment)}</strong>
      </figcaption>
    </figure>
  );
}

function EquipmentSketch({ equipment }: { equipment: string }) {
  const value = equipment.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  if (value.includes("halter")) {
    return (
      <g stroke="#8c7b65" strokeWidth="5" strokeLinecap="round" opacity="0.8">
        <path d="M48 198h45" />
        <path d="M41 184v28M52 184v28M89 184v28M100 184v28" />
        <path d="M167 198h45" />
        <path d="M160 184v28M171 184v28M208 184v28M219 184v28" />
      </g>
    );
  }

  if (value.includes("barra")) {
    return (
      <g stroke="#8c7b65" strokeWidth="5" strokeLinecap="round" opacity="0.75">
        <path d="M46 64h168" />
        <path d="M31 48v32M42 48v32M218 48v32M229 48v32" />
      </g>
    );
  }

  if (value.includes("polia") || value.includes("cabo")) {
    return (
      <g fill="none" stroke="#8c7b65" strokeWidth="4" opacity="0.65">
        <path d="M42 45h42v210H42zM176 45h42v210h-42z" />
        <path d="M63 45v210M197 45v210M63 60c50 50 84 80 134 122" strokeWidth="2" />
        <circle cx="63" cy="62" r="9" />
        <circle cx="197" cy="182" r="9" />
      </g>
    );
  }

  if (value.includes("maquina") || value.includes("esteira") || value.includes("bicicleta") || value.includes("eliptico")) {
    return (
      <g fill="none" stroke="#8c7b65" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.58">
        <path d="M54 242h152M70 242l30-70h62l28 70" />
        <path d="M98 172h65l20-45M109 172l-18-45" />
        <circle cx="86" cy="246" r="16" />
        <circle cx="190" cy="246" r="16" />
      </g>
    );
  }

  return (
    <g fill="none" stroke="#8c7b65" strokeWidth="4" opacity="0.55">
      <path d="M57 255h146" />
      <path d="M82 250c22-18 74-18 96 0" />
    </g>
  );
}
