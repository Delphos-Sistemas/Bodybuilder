import type { Exercise, MuscleGroup } from "@/types/domain";
import { ptLabel } from "@/lib/format";

type ExerciseVisualProps = {
  exercise: Exercise;
  compact?: boolean;
};

type VisualMode = "chest" | "back" | "shoulders" | "arms" | "legs" | "glutes" | "abs" | "cardio" | "mobility";
type BodyView = "front" | "back" | "side";

const muscleTargets: Record<MuscleGroup, string[]> = {
  Peito: ["pec-left", "pec-right"],
  Costas: ["lat-left", "lat-right", "trap-left", "trap-right"],
  Ombros: ["shoulder-left", "shoulder-right"],
  Biceps: ["biceps-left", "biceps-right"],
  Triceps: ["triceps-left", "triceps-right"],
  Quadriceps: ["quad-left", "quad-right"],
  Posteriores: ["ham-left", "ham-right"],
  Gluteos: ["glute-left", "glute-right"],
  Panturrilhas: ["calf-left", "calf-right"],
  Abdomen: ["abs", "oblique-left", "oblique-right"],
  Antebraco: ["forearm-left", "forearm-right"],
  Trapezio: ["trap-left", "trap-right"],
  Cardio: ["heart", "quad-left", "quad-right", "calf-left", "calf-right"],
  Mobilidade: ["hip-left", "hip-right", "spine"]
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function visualMode(exercise: Exercise): VisualMode {
  const name = normalize(exercise.name);

  if (exercise.exerciseType === "Cardio") return "cardio";
  if (exercise.exerciseType === "Mobilidade") return "mobility";
  if (exercise.primaryMuscle === "Costas" || name.includes("remada") || name.includes("puxada")) return "back";
  if (exercise.primaryMuscle === "Gluteos" || name.includes("pelvica") || name.includes("abducao")) return "glutes";
  if (["Quadriceps", "Posteriores", "Panturrilhas"].includes(exercise.primaryMuscle)) return "legs";
  if (exercise.primaryMuscle === "Abdomen") return "abs";
  if (exercise.primaryMuscle === "Ombros" || exercise.primaryMuscle === "Trapezio") return "shoulders";
  if (["Biceps", "Triceps", "Antebraco"].includes(exercise.primaryMuscle)) return "arms";
  return "chest";
}

function bodyView(mode: VisualMode): BodyView {
  if (mode === "back" || mode === "glutes") return "back";
  if (mode === "cardio" || mode === "mobility") return "side";
  return "front";
}

function movementClass(mode: VisualMode) {
  return `visual-${mode}`;
}

export function ExerciseVisual({ exercise, compact = false }: ExerciseVisualProps) {
  const mode = visualMode(exercise);
  const view = bodyView(mode);
  const active = new Set(muscleTargets[exercise.primaryMuscle]);
  const secondary = new Set(exercise.secondaryMuscles.flatMap((muscle) => muscleTargets[muscle] ?? []));
  const cls = (id: string) =>
    active.has(id) ? "muscle primary" : secondary.has(id) ? "muscle secondary" : "muscle";

  return (
    <figure className={`exercise-visual ${movementClass(mode)} ${compact ? "compact" : ""}`}>
      <div className="stage">
        <svg viewBox="0 0 420 320" role="img" aria-label={`Demonstração anatômica de ${exercise.name}`}>
          <defs>
            <radialGradient id={`paper-${exercise.id}`} cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#fffaf0" />
              <stop offset="62%" stopColor="#eee6d8" />
              <stop offset="100%" stopColor="#d2c6b5" />
            </radialGradient>
            <linearGradient id={`skin-${exercise.id}`} x1="0" x2="1">
              <stop offset="0%" stopColor="#fbf7ef" />
              <stop offset="48%" stopColor="#d6d0c6" />
              <stop offset="100%" stopColor="#918a80" />
            </linearGradient>
            <radialGradient id={`hot-${exercise.id}`} cx="48%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#ffb6a3" />
              <stop offset="42%" stopColor="#e8452f" />
              <stop offset="100%" stopColor="#8f1f18" />
            </radialGradient>
            <linearGradient id={`steel-${exercise.id}`} x1="0" x2="1">
              <stop offset="0%" stopColor="#b7ad9e" />
              <stop offset="100%" stopColor="#6b6257" />
            </linearGradient>
            <filter id={`soft-shadow-${exercise.id}`} x="-20%" y="-20%" width="140%" height="150%">
              <feDropShadow dx="0" dy="18" stdDeviation="12" floodColor="#20160d" floodOpacity="0.22" />
            </filter>
          </defs>

          <rect width="420" height="320" rx="18" fill={`url(#paper-${exercise.id})`} />
          <EquipmentSketch exercise={exercise} mode={mode} steelId={`steel-${exercise.id}`} />
          <AnatomyFigure
            exerciseId={exercise.id}
            view={view}
            mode={mode}
            skinId={`skin-${exercise.id}`}
            hotId={`hot-${exercise.id}`}
            shadowId={`soft-shadow-${exercise.id}`}
            cls={cls}
          />
          <VisualBadge exercise={exercise} />
        </svg>
      </div>
      <figcaption>
        <span>{ptLabel(exercise.primaryMuscle)}</span>
        <strong>{ptLabel(exercise.equipment)}</strong>
      </figcaption>
    </figure>
  );
}

function AnatomyFigure({
  view,
  mode,
  skinId,
  hotId,
  shadowId,
  cls
}: {
  exerciseId: string;
  view: BodyView;
  mode: VisualMode;
  skinId: string;
  hotId: string;
  shadowId: string;
  cls: (id: string) => string;
}) {
  const pose =
    view === "side"
      ? "translate(204 26) scale(.76) rotate(-8)"
      : mode === "legs"
        ? "translate(210 26) scale(.76)"
        : mode === "back"
          ? "translate(210 24) scale(.76) rotate(4)"
          : "translate(210 24) scale(.76)";
  const front = view !== "back";
  const side = view === "side";

  return (
    <g className="anatomy" transform={pose} filter={`url(#${shadowId})`}>
      <g className="body-frame">
        <ellipse cx="0" cy="24" rx={side ? 14 : 18} ry="22" fill={`url(#${skinId})`} stroke="#3c3a37" strokeWidth="1.6" />
        <path d="M-9 46h18l7 18h-32z" fill={`url(#${skinId})`} stroke="#4b4740" strokeWidth="1.2" />

        <path
          d="M-54 76c22-20 86-20 108 0 13 43 10 88-8 122-25 12-67 12-92 0-18-34-21-79-8-122z"
          fill={`url(#${skinId})`}
          opacity="0.74"
          stroke="#4b4740"
          strokeWidth="1.5"
        />
        <path d="M-39 72c19 12 59 12 78 0" fill="none" stroke="#5f5b53" strokeWidth="1" opacity="0.55" />
        <path d="M0 70v128" fill="none" stroke="#5a554e" strokeWidth="1.2" opacity="0.6" />
        <path d="M-30 128c19 9 41 9 60 0M-27 157c17 7 37 7 54 0" fill="none" stroke="#645f57" strokeWidth="1" opacity="0.42" />

        <Muscle id="trap-left" cls={cls} hotId={hotId} d="M-34 68c12-13 23-18 34-18v31c-12-1-24-4-34-13z" />
        <Muscle id="trap-right" cls={cls} hotId={hotId} d="M34 68C22 55 11 50 0 50v31c12-1 24-4 34-13z" />
        <Muscle id="shoulder-left" cls={cls} hotId={hotId} d="M-55 77c-20 4-32 18-30 39 18 3 32-8 40-31z" />
        <Muscle id="shoulder-right" cls={cls} hotId={hotId} d="M55 77c20 4 32 18 30 39-18 3-32-8-40-31z" />

        {front ? (
          <>
            <Muscle id="pec-left" cls={cls} hotId={hotId} d="M-44 79c16-9 31-8 44 3v48c-26-3-43-21-44-51z" />
            <Muscle id="pec-right" cls={cls} hotId={hotId} d="M44 79C28 70 13 71 0 82v48c26-3 43-21 44-51z" />
            <Muscle id="abs" cls={cls} hotId={hotId} d="M-24 130h48l11 62c-19 12-51 12-70 0z" />
            <Muscle id="oblique-left" cls={cls} hotId={hotId} d="M-45 123c5 26 10 50 22 68-17-9-28-29-30-59z" />
            <Muscle id="oblique-right" cls={cls} hotId={hotId} d="M45 123c-5 26-10 50-22 68 17-9 28-29 30-59z" />
          </>
        ) : (
          <>
            <Muscle id="lat-left" cls={cls} hotId={hotId} d="M-51 82c22-12 39-8 51 9l-9 93c-28-10-44-41-42-102z" />
            <Muscle id="lat-right" cls={cls} hotId={hotId} d="M51 82C29 70 12 74 0 91l9 93c28-10 44-41 42-102z" />
            <Muscle id="spine" cls={cls} hotId={hotId} d="M-5 82h10v104H-5z" />
          </>
        )}

        <path d="M-45 196c27 15 63 15 90 0l-14 29h-62z" fill={`url(#${skinId})`} stroke="#4b4740" strokeWidth="1.3" />
        <Muscle id="glute-left" cls={cls} hotId={hotId} d="M-43 196c16 9 31 12 43 10l-16 34c-20-3-31-18-27-44z" />
        <Muscle id="glute-right" cls={cls} hotId={hotId} d="M43 196c-16 9-31 12-43 10l16 34c20-3 31-18 27-44z" />
        <Muscle id="hip-left" cls={cls} hotId={hotId} d="M-48 184h44l-13 33c-17-4-27-15-31-33z" />
        <Muscle id="hip-right" cls={cls} hotId={hotId} d="M48 184H4l13 33c17-4 27-15 31-33z" />
      </g>

      <g className="left-arm limb">
        <path d="M-76 113c-10 27-9 52 4 73" fill="none" stroke={`url(#${skinId})`} strokeWidth="23" strokeLinecap="round" />
        <path d="M-73 184c-8 26-4 48 12 65" fill="none" stroke={`url(#${skinId})`} strokeWidth="18" strokeLinecap="round" />
        <Muscle id="biceps-left" cls={cls} hotId={hotId} d="M-86 112c-11 28-9 54 5 75 15-17 18-43 8-73z" />
        <Muscle id="triceps-left" cls={cls} hotId={hotId} d="M-69 114c9 26 7 50-12 73-7-25-4-51 12-73z" />
        <Muscle id="forearm-left" cls={cls} hotId={hotId} d="M-80 183c-8 28-3 50 13 66 13-18 14-41 1-65z" />
      </g>
      <g className="right-arm limb">
        <path d="M76 113c10 27 9 52-4 73" fill="none" stroke={`url(#${skinId})`} strokeWidth="23" strokeLinecap="round" />
        <path d="M73 184c8 26 4 48-12 65" fill="none" stroke={`url(#${skinId})`} strokeWidth="18" strokeLinecap="round" />
        <Muscle id="biceps-right" cls={cls} hotId={hotId} d="M86 112c11 28 9 54-5 75-15-17-18-43-8-73z" />
        <Muscle id="triceps-right" cls={cls} hotId={hotId} d="M69 114c-9 26-7 50 12 73 7-25 4-51-12-73z" />
        <Muscle id="forearm-right" cls={cls} hotId={hotId} d="M80 183c8 28 3 50-13 66-13-18-14-41-1-65z" />
      </g>

      <g className="left-leg limb">
        <path d="M-32 224c-20 35-23 69-11 104" fill="none" stroke={`url(#${skinId})`} strokeWidth="24" strokeLinecap="round" />
        <path d="M-45 323c-19 11-29 14-45 10" fill="none" stroke={`url(#${skinId})`} strokeWidth="12" strokeLinecap="round" />
        <Muscle id="quad-left" cls={cls} hotId={hotId} d="M-43 224c24 6 39 27 36 66-19 8-38 0-50-22z" />
        <Muscle id="ham-left" cls={cls} hotId={hotId} d="M-59 226c10 26 11 54 0 83-17-15-20-48 0-83z" />
        <Muscle id="calf-left" cls={cls} hotId={hotId} d="M-58 298c21 8 31 30 22 59-24-7-36-28-22-59z" />
      </g>
      <g className="right-leg limb">
        <path d="M32 224c20 35 23 69 11 104" fill="none" stroke={`url(#${skinId})`} strokeWidth="24" strokeLinecap="round" />
        <path d="M45 323c19 11 29 14 45 10" fill="none" stroke={`url(#${skinId})`} strokeWidth="12" strokeLinecap="round" />
        <Muscle id="quad-right" cls={cls} hotId={hotId} d="M43 224c-24 6-39 27-36 66 19 8 38 0 50-22z" />
        <Muscle id="ham-right" cls={cls} hotId={hotId} d="M59 226c-10 26-11 54 0 83 17-15 20-48 0-83z" />
        <Muscle id="calf-right" cls={cls} hotId={hotId} d="M58 298c-21 8-31 30-22 59 24-7 36-28 22-59z" />
      </g>

      <circle id="heart" className={cls("heart")} cx="13" cy="111" r="8" fill={`url(#${hotId})`} />
      {side ? <path d="M-22 68c23 55 18 120-15 177" fill="none" stroke="#2f2c28" strokeWidth="1.4" opacity="0.42" /> : null}
      <g className="fiber-lines" opacity="0.32">
        <path d="M-36 91c11 14 22 22 36 26M36 91c-11 14-22 22-36 26" />
        <path d="M-32 141h64M-26 158h52M-22 175h44" />
        <path d="M-42 232c13 14 22 31 26 52M42 232c-13 14-22 31-26 52" />
      </g>
    </g>
  );
}

function Muscle({ id, d, cls, hotId }: { id: string; d: string; cls: (id: string) => string; hotId: string }) {
  return <path id={id} className={cls(id)} d={d} fill={`url(#${hotId})`} />;
}

function EquipmentSketch({ exercise, mode, steelId }: { exercise: Exercise; mode: VisualMode; steelId: string }) {
  const equipment = normalize(exercise.equipment);
  const name = normalize(exercise.name);

  if (mode === "glutes" || name.includes("supino") || name.includes("crucifixo")) {
    return (
      <g className="equipment" fill="none" stroke={`url(#${steelId})`} strokeLinecap="round" strokeLinejoin="round">
        <path d="M78 263h206l48 26" strokeWidth="10" />
        <path d="M113 246l120-82" strokeWidth="18" opacity="0.8" />
        <path d="M94 263l-28 44M276 263l28 44" strokeWidth="7" />
        {name.includes("supino") ? <Barbell y={78} steelId={steelId} /> : null}
      </g>
    );
  }

  if (equipment.includes("halter")) {
    return (
      <g className="equipment" stroke={`url(#${steelId})`} strokeWidth="7" strokeLinecap="round" opacity="0.86">
        <Dumbbell x={92} y={218} />
        <Dumbbell x={304} y={218} />
      </g>
    );
  }

  if (equipment.includes("barra")) {
    return <Barbell y={70} steelId={steelId} />;
  }

  if (equipment.includes("polia") || equipment.includes("cabo")) {
    return (
      <g className="equipment" fill="none" stroke={`url(#${steelId})`} strokeLinecap="round" strokeLinejoin="round">
        <path d="M62 48h62v224H62zM296 48h62v224h-62z" strokeWidth="6" />
        <path d="M93 58v201M327 58v201M93 66c75 54 137 92 234 144" strokeWidth="2.5" />
        <circle cx="93" cy="68" r="12" strokeWidth="5" />
        <circle cx="327" cy="211" r="12" strokeWidth="5" />
      </g>
    );
  }

  if (equipment.includes("maquina") || equipment.includes("esteira") || equipment.includes("bicicleta") || equipment.includes("eliptico")) {
    return (
      <g className="equipment" fill="none" stroke={`url(#${steelId})`} strokeLinecap="round" strokeLinejoin="round">
        <path d="M67 276h288M106 276l52-110h114l48 110" strokeWidth="8" />
        <path d="M151 166h119l33-70M171 166l-31-71" strokeWidth="7" opacity="0.78" />
        <circle cx="102" cy="278" r="23" strokeWidth="7" />
        <circle cx="326" cy="278" r="23" strokeWidth="7" />
      </g>
    );
  }

  return (
    <g className="equipment" fill="none" stroke={`url(#${steelId})`} strokeLinecap="round" opacity="0.52">
      <path d="M84 279h252" strokeWidth="7" />
      <path d="M123 272c39-26 135-26 174 0" strokeWidth="4" />
    </g>
  );
}

function Dumbbell({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-34 0h68" />
      <path d="M-48-24v48M-35-28v56M35-28v56M48-24v48" />
    </g>
  );
}

function Barbell({ y, steelId }: { y: number; steelId: string }) {
  return (
    <g className="equipment" stroke={`url(#${steelId})`} strokeWidth="7" strokeLinecap="round" opacity="0.82">
      <path d={`M76 ${y}h268`} />
      <path d={`M48 ${y - 27}v54M62 ${y - 31}v62M358 ${y - 31}v62M372 ${y - 27}v54`} />
    </g>
  );
}

function VisualBadge({ exercise }: { exercise: Exercise }) {
  return (
    <g transform="translate(18 18)">
      <rect width="124" height="34" rx="17" fill="#15120f" opacity="0.84" />
      <text x="16" y="22" fill="#f7eee1" fontSize="12" fontWeight="700">
        {ptLabel(exercise.primaryMuscle)}
      </text>
    </g>
  );
}
