import type { Muscle } from "@/lib/types";
import { HALF, LEN, RAD, lerpPose, solve, step, type JointName, type Joints, type Pose, type Pt, type View, type Bend } from "./rig";

/** Equipamentos e peças de cenário. Pontos fixos em coordenadas do quadro (320 × 240). */
export type Prop =
  /** anilha da barra vista de lado (presa a uma articulação) */
  | { k: "plate"; at: JointName; r?: number; dx?: number; dy?: number; fixX?: number }
  /** halter visto de lado */
  | { k: "dumbbell"; at: JointName; far?: boolean; angle?: number; align?: "perpN" | "alongN" | "perpF" }
  /** barra longa vista de frente, entre as duas mãos */
  | { k: "bar"; a: JointName; b: JointName; ext?: number }
  /** cabo de polia: roldana fixa até a mão */
  | { k: "cable"; from: Pt; to: JointName; grip?: "bar" | "rope" | "handle" }
  /** barra fixa (barra de cima, presa ao cenário) */
  | { k: "pullbar"; at: Pt }
  /** rolo acolchoado preso a uma articulação (cadeira extensora, mesa flexora) */
  | { k: "roller"; at: JointName; r?: number; dx?: number; dy?: number }
  /** plataforma presa a uma articulação (leg press) */
  | { k: "platform"; at: JointName; angle: number; len?: number }
  /** estofado (banco, assento, encosto): retângulo arredondado entre dois pontos */
  | { k: "pad"; a: Pt; b: Pt; w?: number }
  /** estrutura metálica (linha) */
  | { k: "frame"; pts: Pt[]; w?: number }
  /** trilho do smith */
  | { k: "rail"; x: number; y1: number; y2: number };

export type Key = { pose: Pose; at?: Pt; dur?: number; hold?: number };

export type AnimSpec = {
  anchor: JointName;
  /** posição padrão do ponto de apoio */
  at: Pt;
  keys: Key[];
  back?: Prop[];
  front?: Prop[];
  floor?: number | null;
  /** destaca o membro do lado de lá também (exercícios unilaterais alternados) */
  hideFarArm?: boolean;
  hideFarLeg?: boolean;
  hideLegs?: boolean;
  /** vista lateral (padrão) ou de frente */
  view?: View;
  /** encurta o tronco (vista de frente deitado, visto pelos pés) */
  torsoScale?: number;
  /** encurta a coxa (vista de frente sentado: coxa vem na direção de quem olha) */
  thighScale?: number;
  /** sentido em que cotovelos e joelhos dobram quando a posição usa alvos (ik) */
  bend?: Bend;
};

export const VIEW = { w: 320, h: 240 };

const C = {
  bodyN: "#E9DFCF",
  bodyNEdge: "#BFAE95",
  bodyF: "#7D7265",
  head: "#E9DFCF",
  steel: "#4B463F",
  steelLight: "#8E857A",
  pad: "#2E2924",
  padEdge: "#4A433B",
  floor: "#3A352E",
  prim: "#F09A3E",
  sec: "#C98A4B"
};

const f = (n: number) => Math.round(n * 10) / 10;
const pt = (p: Pt) => `${f(p[0])} ${f(p[1])}`;
const ang = (a: Pt, b: Pt) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** cápsula afinada entre dois pontos */
function capsule(a: Pt, b: Pt, r1: number, r2: number, fill: string, extra = ""): string {
  const d = ang(a, b);
  const a1 = step(a, d - 90, r1);
  const a2 = step(a, d + 90, r1);
  const b1 = step(b, d - 90, r2);
  const b2 = step(b, d + 90, r2);
  return `<path d="M${pt(a1)}L${pt(b1)}A${f(r2)} ${f(r2)} 0 0 1 ${pt(b2)}L${pt(a2)}A${f(r1)} ${f(r1)} 0 0 1 ${pt(a1)}Z" fill="${fill}" ${extra}/>`;
}

function circle(c: Pt, r: number, fill: string, extra = ""): string {
  return `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="${fill}" ${extra}/>`;
}

/** "barriga" do músculo: elipse ao longo de um segmento, deslocada para um dos lados */
function belly(a: Pt, b: Pt, t0: number, t1: number, side: number, off: number, thick: number, color: string, opacity: number): string {
  const d = ang(a, b);
  const L = dist(a, b);
  const mid = step(step(a, d, L * ((t0 + t1) / 2)), d + 90 * side, off);
  const rx = (L * (t1 - t0)) / 2;
  return `<ellipse cx="${f(mid[0])}" cy="${f(mid[1])}" rx="${f(rx)}" ry="${f(thick)}" transform="rotate(${f(d)} ${f(mid[0])} ${f(mid[1])})" fill="${color}" opacity="${opacity}"/>`;
}

type Side = "N" | "F";

function muscleShapes(m: Muscle, j: Joints, color: string, op: number, side: Side): string {
  const sh = j.shoulder;
  const hip = j.hip;
  const e = j[`elbow${side}`];
  const w = j[`wrist${side}`];
  const k = j[`knee${side}`];
  const an = j[`ankle${side}`];
  const tr = RAD.torso[1];
  switch (m) {
    case "peito":
      return side === "N" ? belly(hip, sh, 0.62, 0.93, 1, tr * 0.42, tr * 0.55, color, op) : "";
    case "abdomen":
      return side === "N" ? belly(hip, sh, 0.12, 0.6, 1, tr * 0.5, tr * 0.45, color, op) : "";
    case "costas":
      return side === "N" ? belly(hip, sh, 0.42, 0.9, -1, tr * 0.42, tr * 0.58, color, op) : "";
    case "lombar":
      return side === "N" ? belly(hip, sh, 0.05, 0.45, -1, tr * 0.45, tr * 0.45, color, op) : "";
    case "trapezio":
      return side === "N" ? belly(hip, j.neck, 0.84, 1.0, -1, tr * 0.35, tr * 0.5, color, op) : "";
    case "ombros":
      return circle(sh, RAD.ua[0] * 1.35, color, `opacity="${op}"`);
    case "biceps":
      return belly(sh, e, 0.18, 0.88, -1, RAD.ua[0] * 0.38, RAD.ua[0] * 0.62, color, op);
    case "triceps":
      return belly(sh, e, 0.12, 0.85, 1, RAD.ua[0] * 0.38, RAD.ua[0] * 0.62, color, op);
    case "antebraco":
      return belly(e, w, 0.05, 0.75, 0, 0, RAD.fa[0] * 0.85, color, op);
    case "gluteos":
      return side === "N" ? belly(hip, k, -0.12, 0.3, 1, RAD.th[0] * 0.45, RAD.th[0] * 0.75, color, op) : "";
    case "quadriceps":
      return belly(hip, k, 0.12, 0.92, -1, RAD.th[0] * 0.35, RAD.th[0] * 0.62, color, op);
    case "posteriores":
      return belly(hip, k, 0.15, 0.9, 1, RAD.th[0] * 0.35, RAD.th[0] * 0.6, color, op);
    case "adutores":
      return belly(hip, k, 0.08, 0.7, 0, 0, RAD.th[0] * 0.55, color, op);
    case "panturrilhas":
      return belly(k, an, 0.08, 0.6, 1, RAD.sh[0] * 0.35, RAD.sh[0] * 0.7, color, op);
  }
}

function drawProp(p: Prop, j: Joints): string {
  switch (p.k) {
    case "plate": {
      const r = p.r ?? 21;
      const c: Pt = [p.fixX ?? j[p.at][0] + (p.dx ?? 0), j[p.at][1] + (p.dy ?? 0)];
      return (
        circle(c, r, C.steel, `stroke="${C.steelLight}" stroke-width="1.4"`) +
        circle(c, r * 0.62, "none", `stroke="${C.steelLight}" stroke-width="1" opacity=".55"`) +
        circle(c, 3.2, C.steelLight)
      );
    }
    case "dumbbell": {
      const c = j[p.at];
      if (p.align) {
        const side = p.align === "perpF" ? "F" : "N";
        const fa = ang(j[`elbow${side}`], j[`wrist${side}`]);
        return drawProp({ ...p, align: undefined, angle: p.align === "alongN" ? fa : fa + 90 }, j);
      }
      if (p.angle === undefined) {
        // visto de ponta
        const col = p.far ? "#3A3631" : C.steel;
        return circle(c, 8.5, col, `stroke="${C.steelLight}" stroke-width="1.2"`) + circle(c, 2.4, C.steelLight);
      }
      const a = p.angle;
      const e1 = step(c, a, 7);
      const e2 = step(c, a + 180, 7);
      const col = p.far ? "#3A3631" : C.steel;
      return (
        capsule(e1, e2, 2, 2, C.steelLight) +
        capsule(step(e1, a, 1), step(e1, a, 5), 6.5, 6.5, col, `stroke="${C.steelLight}" stroke-width="1"`) +
        capsule(step(e2, a + 180, 1), step(e2, a + 180, 5), 6.5, 6.5, col, `stroke="${C.steelLight}" stroke-width="1"`)
      );
    }
    case "cable": {
      const h = j[p.to];
      let grip = "";
      if (p.grip === "bar") grip = capsule(step(h, 180, 9), step(h, 0, 9), 2, 2, C.steelLight);
      if (p.grip === "rope") grip = capsule(h, step(h, ang(p.from, h), 8), 2.4, 2.4, "#6B5B47");
      if (p.grip === "handle") grip = circle(h, 4, "none", `stroke="${C.steelLight}" stroke-width="2"`);
      return (
        `<line x1="${f(p.from[0])}" y1="${f(p.from[1])}" x2="${f(h[0])}" y2="${f(h[1])}" stroke="${C.steelLight}" stroke-width="1.2" opacity=".8"/>` +
        circle(p.from, 5, C.steel, `stroke="${C.steelLight}" stroke-width="1.2"`) +
        grip
      );
    }
    case "bar": {
      const a = j[p.a];
      const b = j[p.b];
      const d = ang(a, b);
      const ext = p.ext ?? 34;
      const e1 = step(a, d + 180, ext);
      const e2 = step(b, d, ext);
      const plate = (c: Pt, dir: number) =>
        capsule(step(c, dir - 90, 11), step(c, dir + 90, 11), 4.5, 4.5, C.steel, `stroke="${C.steelLight}" stroke-width="1.2"`);
      return capsule(e1, e2, 1.8, 1.8, C.steelLight) + plate(step(e1, d, 6), d) + plate(step(e2, d + 180, 6), d);
    }
    case "pullbar":
      return `<line x1="${f(p.at[0] - 60)}" y1="${f(p.at[1])}" x2="${f(p.at[0] + 60)}" y2="${f(p.at[1])}" stroke="${C.steelLight}" stroke-width="3" stroke-linecap="round"/>`;
    case "roller": {
      const c: Pt = [j[p.at][0] + (p.dx ?? 0), j[p.at][1] + (p.dy ?? 0)];
      return circle(c, p.r ?? 6.5, C.pad, `stroke="${C.padEdge}" stroke-width="1.5"`);
    }
    case "platform": {
      const c = j[p.at];
      const L = p.len ?? 26;
      return capsule(step(c, p.angle, L / 2), step(c, p.angle + 180, L / 2), 3, 3, C.steel, `stroke="${C.steelLight}" stroke-width="1"`);
    }
    case "pad":
      return capsule(p.a, p.b, (p.w ?? 7) / 2, (p.w ?? 7) / 2, C.pad, `stroke="${C.padEdge}" stroke-width="1.2"`);
    case "frame":
      return `<polyline points="${p.pts.map(pt).join(" ")}" fill="none" stroke="${C.steel}" stroke-width="${p.w ?? 3}" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "rail":
      return `<line x1="${p.x}" y1="${p.y1}" x2="${p.x}" y2="${p.y2}" stroke="${C.steel}" stroke-width="3" stroke-linecap="round"/>`;
  }
}

const EDGE = `stroke="#1B1815" stroke-width="1.1" stroke-linejoin="round"`;

function limb(a: Pt, b: Pt, r: readonly [number, number], fill: string): string {
  return capsule(a, b, r[0], r[1], fill, EDGE);
}

function body(j: Joints, side: Side, fill: string, hideArm: boolean, hideLeg: boolean): string {
  let s = "";
  if (!hideLeg) {
    s += limb(j.hip, j[`knee${side}`], RAD.th, fill);
    s += limb(j[`knee${side}`], j[`ankle${side}`], RAD.sh, fill);
    s += limb(j[`ankle${side}`], j[`toe${side}`], RAD.foot, fill);
  }
  if (!hideArm) {
    s += limb(j.shoulder, j[`elbow${side}`], RAD.ua, fill);
    s += limb(j[`elbow${side}`], j[`wrist${side}`], RAD.fa, fill);
    s += circle(j[`hand${side}`], 3.8, fill, EDGE);
  }
  return s;
}

export type Phase = { pose: Pose; at: Pt; t: number };

/** posição no ciclo; t em segundos */
export function sample(spec: AnimSpec, t: number): Phase {
  const keys = spec.keys;
  if (keys.length === 1) return { pose: keys[0].pose, at: keys[0].at ?? spec.at, t: 0 };
  const segs = keys.map((k) => ({ dur: k.dur ?? 1.1, hold: k.hold ?? 0.35 }));
  const total = segs.reduce((a, s) => a + s.dur + s.hold, 0);
  let x = ((t % total) + total) % total;
  for (let i = 0; i < keys.length; i++) {
    const to = keys[(i + 1) % keys.length];
    const from = keys[i];
    const { dur, hold } = segs[(i + 1) % keys.length];
    if (x < dur) {
      const u = x / dur;
      const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      const a0 = from.at ?? spec.at;
      const a1 = to.at ?? spec.at;
      return { pose: lerpPose(from.pose, to.pose, e), at: [a0[0] + (a1[0] - a0[0]) * e, a0[1] + (a1[1] - a0[1]) * e], t: x };
    }
    x -= dur;
    if (x < hold) return { pose: to.pose, at: to.at ?? spec.at, t: x };
    x -= hold;
  }
  return { pose: keys[0].pose, at: keys[0].at ?? spec.at, t: 0 };
}

export function cycleLength(spec: AnimSpec): number {
  if (spec.keys.length === 1) return 0;
  return spec.keys.reduce((a, k) => a + (k.dur ?? 1.1) + (k.hold ?? 0.35), 0);
}

export type RenderOpts = { primary: Muscle; secondary: Muscle[] };

/** Enquadramento: amplia para o boneco e o aparelho ocuparem o quadro. */
export function fitTransform(spec: AnimSpec): { s: number; tx: number; ty: number } {
  const pts: Pt[] = [];
  const L = Math.max(cycleLength(spec), 0.01);
  for (let i = 0; i < 16; i++) {
    const ph = sample(spec, (L * i) / 16);
    const j = solve(ph.pose, { joint: spec.anchor, at: ph.at }, spec);
    for (const p of Object.values(j)) pts.push(p);
    for (const p of [...(spec.back ?? []), ...(spec.front ?? [])]) {
      if (p.k === "plate" || p.k === "roller") {
        const c = j[p.at];
        const r = (p.k === "plate" ? (p.r ?? 21) : (p.r ?? 6.5)) + 2;
        pts.push([c[0] + (p.dx ?? 0) - r, c[1] + (p.dy ?? 0) - r], [c[0] + (p.dx ?? 0) + r, c[1] + (p.dy ?? 0) + r]);
      }
      if (p.k === "dumbbell") pts.push([j[p.at][0] - 12, j[p.at][1] - 8], [j[p.at][0] + 12, j[p.at][1] + 8]);
    }
    pts.push([j.head[0] - LEN.headR, j.head[1] - LEN.headR], [j.head[0] + LEN.headR, j.head[1] + LEN.headR]);
  }
  for (const p of [...(spec.back ?? []), ...(spec.front ?? [])]) {
    if (p.k === "pad") pts.push(p.a, p.b);
    if (p.k === "frame") pts.push(...p.pts);
    if (p.k === "cable") pts.push(p.from);
  }
  const floor = spec.floor === undefined ? 222 : spec.floor;
  if (floor !== null) pts.push([pts[0][0], floor]);
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  const pad = 16;
  const sc = Math.min(2.2, (VIEW.w - pad * 2) / (x1 - x0), (VIEW.h - pad * 2) / (y1 - y0));
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return { s: sc, tx: VIEW.w / 2 - cx * sc, ty: VIEW.h / 2 - cy * sc + 4 };
}

/** Desenha um quadro. Devolve o conteúdo interno do <svg viewBox="0 0 320 240">. */
export function renderFrame(spec: AnimSpec, pose: Pose, at: Pt, opts: RenderOpts): string {
  const j = solve(pose, { joint: spec.anchor, at }, spec);
  if (spec.view === "front") return renderFront(spec, j, opts);
  const floor = spec.floor === undefined ? 222 : spec.floor;
  let s = "";
  if (floor !== null) {
    s += `<ellipse cx="${f((j.ankleN[0] + j.hip[0]) / 2 + 6)}" cy="${floor + 1}" rx="62" ry="5" fill="#000" opacity=".28"/>`;
    s += `<line x1="-200" y1="${floor}" x2="520" y2="${floor}" stroke="${C.floor}" stroke-width="1.5"/>`;
  }
  const muscles = (side: Side) =>
    opts.secondary.map((m) => muscleShapes(m, j, C.sec, side === "N" ? 0.7 : 0.45, side)).join("") +
    `<g filter="url(#bbglow)">${muscleShapes(opts.primary, j, C.prim, side === "N" ? 0.95 : 0.6, side)}</g>`;

  s += (spec.back ?? []).map((p) => drawProp(p, j)).join("");
  // lado de lá
  s += body(j, "F", C.bodyF, !!spec.hideFarArm, !!spec.hideFarLeg || !!spec.hideLegs);
  s += `<g>${muscles("F")}</g>`;
  // tronco e cabeça
  s += capsule(j.shoulder, j.neck, 4.6, 4.6, C.bodyN, EDGE);
  s += capsule(j.hip, j.shoulder, RAD.torso[0], RAD.torso[1], C.bodyN, EDGE);
  s += circle(j.head, LEN.headR, C.head, EDGE);
  // lado de cá
  s += body(j, "N", C.bodyN, false, !!spec.hideLegs);
  s += muscles("N");
  s += (spec.front ?? []).map((p) => drawProp(p, j)).join("");
  return s;
}

/** "barriga" do músculo na vista de frente, espelhada nos dois lados */
function frontMuscle(m: Muscle, j: Joints, color: string, op: number): string {
  const both = (fn: (s: "N" | "F", sg: number) => string) => fn("N", 1) + fn("F", -1);
  const torsoAng = ang(j.hip, j.shoulder);
  const L = dist(j.hip, j.shoulder);
  const onTorso = (t: number, side: number, rx: number, ry: number) => {
    const c = step(step(j.hip, torsoAng, L * t), torsoAng + 90, side);
    return `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(torsoAng + 90)} ${f(c[0])} ${f(c[1])})" fill="${color}" opacity="${op}"/>`;
  };
  switch (m) {
    case "peito":
      return both((_, sg) => onTorso(0.78, sg * 7.5, 7, 6));
    case "abdomen":
      return onTorso(0.4, 0, 6.5, 13);
    case "costas":
      return both((_, sg) => onTorso(0.62, sg * 12, 4, 10));
    case "lombar":
      return onTorso(0.15, 0, 6, 5);
    case "trapezio":
      return both((s, sg) => belly(j.neck, j[`shoulder${s}`], 0.2, 0.75, sg, 0, 3.6, color, op));
    case "ombros":
      return both((s) => circle(j[`shoulder${s}`], RAD.ua[0] * 1.3, color, `opacity="${op}"`));
    case "biceps":
    case "triceps":
      return both((s) => belly(j[`shoulder${s}`], j[`elbow${s}`], 0.15, 0.88, 0, 0, RAD.ua[0] * 0.6, color, op));
    case "antebraco":
      return both((s) => belly(j[`elbow${s}`], j[`wrist${s}`], 0.05, 0.75, 0, 0, RAD.fa[0] * 0.8, color, op));
    case "gluteos":
      return both((s, sg) => belly(j[`hip${s}`], j[`knee${s}`], -0.1, 0.35, -sg, RAD.th[0] * 0.55, RAD.th[0] * 0.5, color, op));
    case "quadriceps":
      return both((s) => belly(j[`hip${s}`], j[`knee${s}`], 0.12, 0.9, 0, 0, RAD.th[0] * 0.6, color, op));
    case "adutores":
      return both((s, sg) => belly(j[`hip${s}`], j[`knee${s}`], 0.05, 0.75, sg, RAD.th[0] * 0.45, RAD.th[0] * 0.5, color, op));
    case "posteriores":
      return "";
    case "panturrilhas":
      return both((s) => belly(j[`knee${s}`], j[`ankle${s}`], 0.08, 0.55, 0, 0, RAD.sh[0] * 0.75, color, op));
  }
}

function renderFront(spec: AnimSpec, j: Joints, opts: RenderOpts): string {
  const floor = spec.floor === undefined ? 222 : spec.floor;
  let s = "";
  if (floor !== null) {
    s += `<ellipse cx="${f(j.hip[0])}" cy="${floor + 1}" rx="46" ry="5" fill="#000" opacity=".28"/>`;
    s += `<line x1="-200" y1="${floor}" x2="520" y2="${floor}" stroke="${C.floor}" stroke-width="1.5"/>`;
  }
  s += (spec.back ?? []).map((p) => drawProp(p, j)).join("");
  const fill = C.bodyN;
  // pernas
  if (!spec.hideLegs) {
    for (const side of ["N", "F"] as const) {
      s += limb(j[`hip${side}`], j[`knee${side}`], RAD.th, fill);
      s += limb(j[`knee${side}`], j[`ankle${side}`], RAD.sh, fill);
      s += limb(j[`ankle${side}`], j[`toe${side}`], RAD.foot, fill);
    }
  }
  // tronco: trapézio arredondado entre ombros e quadril
  const tA = ang(j.hip, j.shoulder);
  const sN = step(j.shoulderN, tA + 180, 3);
  const sF = step(j.shoulderF, tA + 180, 3);
  const hN = step(j.hipN, tA + 90, 3);
  const hF = step(j.hipF, tA - 90, 3);
  const waistN = step(step(j.hip, tA, dist(j.hip, j.shoulder) * 0.45), tA + 90, HALF.hip + 2);
  const waistF = step(step(j.hip, tA, dist(j.hip, j.shoulder) * 0.45), tA - 90, HALF.hip + 2);
  const poly = `M${pt(sN)}L${pt(waistN)}L${pt(hN)}L${pt(hF)}L${pt(waistF)}L${pt(sF)}Z`;
  s += capsule(j.shoulder, j.neck, 4.6, 4.6, fill, EDGE);
  s += circle(j.head, LEN.headR, C.head, EDGE);
  s += `<path d="${poly}" fill="#1B1815" stroke="#1B1815" stroke-width="13.2" stroke-linejoin="round"/>`;
  s += `<path d="${poly}" fill="${fill}" stroke="${fill}" stroke-width="11" stroke-linejoin="round"/>`;
  // braços
  for (const side of ["N", "F"] as const) {
    s += limb(j[`shoulder${side}`], j[`elbow${side}`], RAD.ua, fill);
    s += limb(j[`elbow${side}`], j[`wrist${side}`], RAD.fa, fill);
    s += circle(j[`hand${side}`], 3.8, fill, EDGE);
  }
  s += opts.secondary.map((m) => frontMuscle(m, j, C.sec, 0.7)).join("");
  s += `<g filter="url(#bbglow)">${frontMuscle(opts.primary, j, C.prim, 0.95)}</g>`;
  s += (spec.front ?? []).map((p) => drawProp(p, j)).join("");
  return s;
}

export const SVG_DEFS = `<defs><filter id="bbglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="bbbg" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#26221D"/><stop offset="1" stop-color="#121010"/></radialGradient></defs><rect width="320" height="240" fill="url(#bbbg)"/>`;

export function renderSvg(spec: AnimSpec, t: number, opts: RenderOpts): string {
  const ph = sample(spec, t);
  const fit = fitTransform(spec);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW.w} ${VIEW.h}">${SVG_DEFS}<g transform="translate(${f(fit.tx)} ${f(fit.ty)}) scale(${f(fit.s * 100) / 100})">${renderFrame(spec, ph.pose, ph.at, opts)}</g></svg>`;
}
