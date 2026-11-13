/**
 * Estilo "atlas": corpo cinza com sombreamento e contorno dos músculos, músculo trabalhado em vermelho, fundo claro.
 * Usa o mesmo esqueleto (rig) e o mesmo cenário (props) das animações, só muda o desenho do corpo.
 */
import type { Muscle } from "@/lib/types";
import { drawProp, type AnimSpec, type RenderOpts } from "./render";
import { solve, step, type Joints, type Pose, type Pt } from "./rig";

const f = (n: number) => Math.round(n * 10) / 10;
const ang = (a: Pt, b: Pt) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

const K = {
  bg1: "#F4F3F0",
  bg2: "#DEDDD9",
  skinHi: "#E6E6E3",
  skin: "#BDBDB9",
  skinLo: "#8F8F8B",
  far: "#9E9E9A",
  farLo: "#76766F",
  line: "#6E6E69",
  redHi: "#F0604A",
  red: "#C9301F",
  redLo: "#8E1A10",
  secHi: "#F6A08E",
  sec: "#E06A55",
  floor: "#C9C8C3"
};

/** barriga de um músculo num lado do segmento: lado +1 = frente/direita da direção, -1 = trás */
type Belly = { side: 1 | -1; t0: number; t1: number; amp: number; m?: Muscle };

type Seg = { a: Pt; b: Pt; r1: number; r2: number; bellies: Belly[] };

/** contorno de um membro com músculos estufando, como lista de pontos (fechada) */
function profile(seg: Seg, n = 18): Pt[] {
  const d = ang(seg.a, seg.b);
  const L = dist(seg.a, seg.b);
  const sideR = (t: number, side: 1 | -1) => {
    let r = seg.r1 + (seg.r2 - seg.r1) * t;
    for (const bl of seg.bellies) {
      if (bl.side !== side || t < bl.t0 || t > bl.t1) continue;
      const u = (t - bl.t0) / (bl.t1 - bl.t0);
      r += bl.amp * Math.sin(Math.PI * u) ** 1.4;
    }
    return r;
  };
  const right: Pt[] = [];
  const left: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const c = step(seg.a, d, L * t);
    right.push(step(c, d + 90, sideR(t, 1)));
    left.push(step(c, d - 90, sideR(t, -1)));
  }
  // pontas arredondadas
  const capB: Pt[] = [];
  const capA: Pt[] = [];
  const rb = (sideR(1, 1) + sideR(1, -1)) / 2;
  const ra = (sideR(0, 1) + sideR(0, -1)) / 2;
  for (let k = 1; k < 6; k++) capB.push(step(seg.b, d + 90 - (180 * k) / 6, rb));
  for (let k = 1; k < 6; k++) capA.push(step(seg.a, d - 90 - (180 * k) / 6, ra));
  return [...right, ...capB, ...left.reverse(), ...capA];
}

/** curva suave fechada passando pelos pontos (Catmull-Rom → Bézier) */
function smooth(pts: Pt[]): string {
  const n = pts.length;
  let s = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    s += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return s + "Z";
}

/** região de um músculo: do eixo do membro até o contorno, entre t0 e t1, num lado */
function muscleRegion(seg: Seg, bl: Belly, inset = 0.25): Pt[] {
  const d = ang(seg.a, seg.b);
  const L = dist(seg.a, seg.b);
  const n = 10;
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = bl.t0 + ((bl.t1 - bl.t0) * i) / n;
    const u = i / n;
    const c = step(seg.a, d, L * t);
    const base = seg.r1 + (seg.r2 - seg.r1) * Math.min(Math.max(t, 0), 1);
    const r = base + bl.amp * Math.sin(Math.PI * u) ** 1.4 - 0.6;
    outer.push(step(c, d + 90 * bl.side, r));
    // borda interna: perto do eixo, afinando nas pontas
    inner.push(step(c, d + 90 * bl.side, base * inset + (1 - Math.sin(Math.PI * u)) * base * 0.55));
  }
  return [...outer, ...inner.reverse()];
}

let gid = 0;
let gpre = "";
function grad(a: Pt, b: Pt, side: 1 | -1, stops: [string, string, string]): { def: string; url: string } {
  const id = `ag${gpre}_${gid++}`;
  const d = ang(a, b);
  const c: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const p1 = step(c, d - 90 * side, 14);
  const p2 = step(c, d + 90 * side, 14);
  return {
    def: `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(p1[0])}" y1="${f(p1[1])}" x2="${f(p2[0])}" y2="${f(p2[1])}"><stop offset="0" stop-color="${stops[0]}"/><stop offset=".55" stop-color="${stops[1]}"/><stop offset="1" stop-color="${stops[2]}"/></linearGradient>`,
    url: `url(#${id})`
  };
}

type Ctx = { defs: string[]; worked: Muscle[]; primary: Muscle };

/** desenha um segmento: corpo cinza sombreado, linhas de definição e músculos trabalhados */
function drawSeg(seg: Seg, ctx: Ctx, far: boolean): string {
  const g = grad(seg.a, seg.b, 1, far ? [K.far, K.far, K.farLo] : [K.skinHi, K.skin, K.skinLo]);
  ctx.defs.push(g.def);
  let s = `<path d="${smooth(profile(seg))}" fill="${g.url}" stroke="${K.line}" stroke-width=".7"/>`;
  for (const bl of seg.bellies) {
    if (!bl.m) continue;
    const region = smooth(muscleRegion(seg, bl));
    if (ctx.worked.includes(bl.m)) {
      const main = bl.m === ctx.primary;
      const rg = grad(seg.a, seg.b, bl.side, main ? [K.redLo, K.red, K.redHi] : [K.sec, K.sec, K.secHi]);
      ctx.defs.push(rg.def);
      s += `<path d="${region}" fill="${rg.url}" opacity="${far ? 0.7 : main ? 1 : 0.85}"/>`;
    }
    if (!far) s += `<path d="${region}" fill="none" stroke="${K.line}" stroke-width=".45" opacity=".55"/>`;
  }
  return s;
}

/** músculos de cada segmento na vista lateral (boneco olhando para a direita) */
function sideSegs(j: Joints, side: "N" | "F") {
  const sh = j.shoulder;
  const e = j[`elbow${side}`];
  const w = j[`wrist${side}`];
  const k = j[`knee${side}`];
  const an = j[`ankle${side}`];
  // lado +1/-1 depende da direção do segmento; para braço/perna pendurados, -1 = frente
  return {
    upper: {
      a: sh,
      b: e,
      r1: 5.4,
      r2: 3.9,
      bellies: [
        { side: -1, t0: 0.15, t1: 0.9, amp: 2.2, m: "biceps" },
        { side: 1, t0: 0.08, t1: 0.85, amp: 2.4, m: "triceps" },
        { side: -1, t0: -0.12, t1: 0.32, amp: 2.6, m: "ombros" },
        { side: 1, t0: -0.12, t1: 0.3, amp: 2.4, m: "ombros" }
      ]
    } as Seg,
    fore: {
      a: e,
      b: w,
      r1: 4.4,
      r2: 2.6,
      bellies: [
        { side: 1, t0: 0.0, t1: 0.6, amp: 1.6, m: "antebraco" },
        { side: -1, t0: 0.0, t1: 0.55, amp: 1.0, m: "antebraco" }
      ]
    } as Seg,
    thigh: {
      a: j.hip,
      b: k,
      r1: 8.4,
      r2: 5.2,
      bellies: [
        { side: -1, t0: 0.1, t1: 0.95, amp: 2.8, m: "quadriceps" },
        { side: 1, t0: 0.2, t1: 0.92, amp: 2.0, m: "posteriores" },
        { side: 1, t0: -0.18, t1: 0.3, amp: 3.6, m: "gluteos" }
      ]
    } as Seg,
    shin: {
      a: k,
      b: an,
      r1: 4.8,
      r2: 2.8,
      bellies: [
        { side: 1, t0: 0.06, t1: 0.6, amp: 2.8, m: "panturrilhas" },
        { side: -1, t0: 0.05, t1: 0.7, amp: 0.6 }
      ]
    } as Seg,
    foot: { a: an, b: j[`toe${side}`], r1: 3.0, r2: 2.2, bellies: [] } as Seg
  };
}

function torsoSeg(j: Joints): Seg {
  return {
    a: j.hip,
    b: j.shoulder,
    r1: 10,
    r2: 11.5,
    bellies: [
      { side: 1, t0: 0.6, t1: 1.02, amp: 3.6, m: "peito" },
      { side: 1, t0: 0.08, t1: 0.58, amp: 1.0, m: "abdomen" },
      { side: -1, t0: 0.42, t1: 0.95, amp: 3.2, m: "costas" },
      { side: -1, t0: 0.02, t1: 0.42, amp: 1.0, m: "lombar" },
      { side: -1, t0: 0.9, t1: 1.12, amp: 2.0, m: "trapezio" }
    ]
  };
}

export const ATLAS_BG = (id = "") =>
  `<defs><radialGradient id="abg${id}" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="${K.bg1}"/><stop offset="1" stop-color="${K.bg2}"/></radialGradient></defs><rect width="320" height="240" fill="url(#abg${id})"/>`;

/** Desenha um quadro no estilo atlas (somente vista lateral por enquanto). */
export function renderAtlas(spec: AnimSpec, pose: Pose, at: Pt, opts: RenderOpts, idPrefix = ""): string {
  gid = 0;
  gpre = idPrefix;
  const j = solve(pose, { joint: spec.anchor, at }, spec);
  const ctx: Ctx = { defs: [], worked: [opts.primary, ...opts.secondary], primary: opts.primary };
  const floor = spec.floor === undefined ? 222 : spec.floor;
  let s = "";
  if (floor !== null) {
    s += `<ellipse cx="${f((j.ankleN[0] + j.hip[0]) / 2 + 6)}" cy="${floor + 1}" rx="64" ry="5" fill="#000" opacity=".12"/>`;
    s += `<line x1="-200" y1="${floor}" x2="520" y2="${floor}" stroke="${K.floor}" stroke-width="1.2"/>`;
  }
  s += (spec.back ?? []).map((p) => drawProp(p, j)).join("");
  const F = sideSegs(j, "F");
  const N = sideSegs(j, "N");
  if (!spec.hideLegs && !spec.hideFarLeg) s += [F.thigh, F.shin, F.foot].map((x) => drawSeg(x, ctx, true)).join("");
  if (!spec.hideFarArm) s += [F.upper, F.fore].map((x) => drawSeg(x, ctx, true)).join("");
  // pescoço, tronco e cabeça
  s += drawSeg({ a: j.shoulder, b: j.neck, r1: 5.2, r2: 4.6, bellies: [] }, ctx, false);
  s += drawSeg(torsoSeg(j), ctx, false);
  const hg = grad(step(j.head, 180, 6), step(j.head, 0, 6), 1, [K.skinHi, K.skin, K.skinLo]);
  ctx.defs.push(hg.def);
  s += `<circle cx="${f(j.head[0])}" cy="${f(j.head[1])}" r="9.6" fill="${hg.url}" stroke="${K.line}" stroke-width=".7"/>`;
  if (!spec.hideLegs) s += [N.thigh, N.shin, N.foot].map((x) => drawSeg(x, ctx, false)).join("");
  s += [N.upper, N.fore].map((x) => drawSeg(x, ctx, false)).join("");
  s += `<circle cx="${f(j.handN[0])}" cy="${f(j.handN[1])}" r="3.4" fill="${K.skin}" stroke="${K.line}" stroke-width=".7"/>`;
  s += (spec.front ?? []).map((p) => drawProp(p, j)).join("");
  return `<defs>${ctx.defs.join("")}</defs>${s}`;
}
