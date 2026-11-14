import type { Muscle } from "@/lib/types";
import { MUSCLES } from "@/lib/types";

export type Shape = {
  m: Muscle | null;
  d?: string;
  ellipse?: [number, number, number, number];
  key: string;
};

const BODY = "#BDB9B2";
const PRIMARY = "#C0392B";
const SECONDARY = "#E59A8C";

// Figura simplificada (vista frontal e posterior). Coordenadas em viewBox 0 0 120 250.
export const SILHOUETTE =
  "M48 44 L72 44 L96 50 L102 124 L90 124 L84 76 L76 116 L78 176 L72 240 L62 240 L60 150 L58 240 L48 240 L42 176 L44 116 L36 76 L30 124 L18 124 L24 50 Z";

export const FRONT: Shape[] = [
  { key: "cabeca", m: null, ellipse: [60, 20, 12, 15] },
  { key: "pescoco", m: "trapezio", d: "M52 33 L68 33 L72 44 L48 44 Z" },
  { key: "delt-e", m: "ombros", ellipse: [36, 52, 10, 9] },
  { key: "delt-d", m: "ombros", ellipse: [84, 52, 10, 9] },
  {
    key: "peito-e",
    m: "peito",
    d: "M46 46 Q59 44 59 50 L59 68 Q50 72 42 66 Q39 55 46 46 Z"
  },
  {
    key: "peito-d",
    m: "peito",
    d: "M74 46 Q61 44 61 50 L61 68 Q70 72 78 66 Q81 55 74 46 Z"
  },
  { key: "biceps-e", m: "biceps", ellipse: [29, 76, 6, 14] },
  { key: "biceps-d", m: "biceps", ellipse: [91, 76, 6, 14] },
  { key: "antebraco-e", m: "antebraco", d: "M22 92 L32 92 L29 122 L21 122 Z" },
  { key: "antebraco-d", m: "antebraco", d: "M88 92 L98 92 L99 122 L91 122 Z" },
  { key: "abdomen", m: "abdomen", d: "M48 72 L72 72 L70 112 L50 112 Z" },
  {
    key: "quad-e",
    m: "quadriceps",
    d: "M44 118 L58 120 L56 172 L45 172 Q38 145 44 118 Z"
  },
  {
    key: "quad-d",
    m: "quadriceps",
    d: "M76 118 L62 120 L64 172 L75 172 Q82 145 76 118 Z"
  },
  { key: "adut-e", m: "adutores", d: "M58 120 L60 124 L58 150 L55 150 Z" },
  { key: "adut-d", m: "adutores", d: "M62 120 L60 124 L62 150 L65 150 Z" },
  { key: "canela-e", m: null, d: "M46 178 L56 178 L54 230 L48 230 Z" },
  { key: "canela-d", m: null, d: "M74 178 L64 178 L66 230 L72 230 Z" }
];

export const BACK: Shape[] = [
  { key: "cabeca", m: null, ellipse: [60, 20, 12, 15] },
  { key: "trap", m: "trapezio", d: "M60 32 L76 46 L60 70 L44 46 Z" },
  { key: "delt-e", m: "ombros", ellipse: [36, 52, 10, 9] },
  { key: "delt-d", m: "ombros", ellipse: [84, 52, 10, 9] },
  { key: "lat-e", m: "costas", d: "M44 50 L58 70 L56 96 Q46 90 42 74 Z" },
  { key: "lat-d", m: "costas", d: "M76 50 L62 70 L64 96 Q74 90 78 74 Z" },
  { key: "triceps-e", m: "triceps", ellipse: [29, 76, 6, 14] },
  { key: "triceps-d", m: "triceps", ellipse: [91, 76, 6, 14] },
  { key: "antebraco-e", m: "antebraco", d: "M22 92 L32 92 L29 122 L21 122 Z" },
  { key: "antebraco-d", m: "antebraco", d: "M88 92 L98 92 L99 122 L91 122 Z" },
  { key: "lombar", m: "lombar", d: "M54 96 L66 96 L68 112 L52 112 Z" },
  {
    key: "glut-e",
    m: "gluteos",
    d: "M46 112 L59 114 L59 134 Q48 136 44 126 Z"
  },
  {
    key: "glut-d",
    m: "gluteos",
    d: "M74 112 L61 114 L61 134 Q72 136 76 126 Z"
  },
  { key: "post-e", m: "posteriores", d: "M45 138 L58 138 L56 174 L46 174 Z" },
  { key: "post-d", m: "posteriores", d: "M75 138 L62 138 L64 174 L74 174 Z" },
  { key: "pant-e", m: "panturrilhas", ellipse: [51, 196, 6, 18] },
  { key: "pant-d", m: "panturrilhas", ellipse: [69, 196, 6, 18] }
];

function fill(m: Muscle | null, primary: Muscle, secondary: Muscle[]) {
  if (!m) return BODY;
  if (m === primary) return PRIMARY;
  if (secondary.includes(m)) return SECONDARY;
  return BODY;
}

function Figure({ shapes, primary, secondary, title }: { shapes: Shape[]; primary: Muscle; secondary: Muscle[]; title: string }) {
  return (
    <figure className="flex flex-col items-center">
      <svg viewBox="0 0 120 250" className="h-48 w-auto" aria-hidden="true">
        {/* silhueta base */}
        <path d={SILHOUETTE} fill="#D4D1CB" />
        {shapes.map((s) =>
          s.ellipse ? (
            <ellipse
              key={s.key}
              cx={s.ellipse[0]}
              cy={s.ellipse[1]}
              rx={s.ellipse[2]}
              ry={s.ellipse[3]}
              fill={fill(s.m, primary, secondary)}
              stroke="#8E8A84"
              strokeWidth="0.6"
            />
          ) : (
            <path key={s.key} d={s.d} fill={fill(s.m, primary, secondary)} stroke="#8E8A84" strokeWidth="0.6" />
          )
        )}
      </svg>
      <figcaption className="mt-1 text-xs text-neutral-600">{title}</figcaption>
    </figure>
  );
}

export function MuscleMap({ primary, secondary }: { primary: Muscle; secondary: Muscle[] }) {
  const label = `Músculo principal: ${MUSCLES[primary]}${secondary.length ? `. Secundários: ${secondary.map((m) => MUSCLES[m]).join(", ")}` : ""}.`;
  return (
    <div role="img" aria-label={label} className="rounded-xl bg-[#ECEBE7] p-3">
      <div className="flex justify-center gap-6">
        <Figure shapes={FRONT} primary={primary} secondary={secondary} title="Frente" />
        <Figure shapes={BACK} primary={primary} secondary={secondary} title="Costas" />
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-neutral-700">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: PRIMARY }} /> Principal
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: SECONDARY }} /> Secundário
        </span>
      </div>
    </div>
  );
}
