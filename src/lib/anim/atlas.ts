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
      if (!far) s += fibers(seg, bl, main);
    }
    if (!far) s += `<path d="${region}" fill="none" stroke="${K.line}" stroke-width=".45" opacity=".55"/>`;
  }
  return s;
}

/** fibras do músculo trabalhado (linhas ao longo do músculo) e um brilho na borda */
function fibers(seg: Seg, bl: Belly, main: boolean): string {
  const d = ang(seg.a, seg.b);
  const L = dist(seg.a, seg.b);
  const line = (frac: number, t0: number, t1: number) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      const t = t0 + (t1 - t0) * u;
      const uu = (t - bl.t0) / (bl.t1 - bl.t0);
      const base = seg.r1 + (seg.r2 - seg.r1) * Math.min(Math.max(t, 0), 1);
      const outer = base + bl.amp * Math.sin(Math.PI * uu) ** 1.4 - 0.6;
      const inner = base * 0.25 + (1 - Math.sin(Math.PI * uu)) * base * 0.55;
      pts.push(step(step(seg.a, d, L * t), d + 90 * bl.side, inner + (outer - inner) * frac));
    }
    return "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L");
  };
  const span = bl.t1 - bl.t0;
  const t0 = bl.t0 + span * 0.14;
  const t1 = bl.t1 - span * 0.14;
  let out = "";
  for (const fr of [0.3, 0.55, 0.78])
    out += `<path d="${line(fr, t0, t1)}" fill="none" stroke="${K.redLo}" stroke-width=".38" opacity="${main ? 0.55 : 0.35}" stroke-linecap="round"/>`;
  out += `<path d="${line(0.92, bl.t0 + span * 0.22, bl.t1 - span * 0.25)}" fill="none" stroke="#fff" stroke-width=".7" opacity=".35" stroke-linecap="round"/>`;
  return out;
}

/** cabeça de perfil (vista lateral) ou de frente, com orelha, olho e queixo */
function headShape(j: Joints, ctx: Ctx, front: boolean): string {
  const up = ang(j.neck, j.head);
  const fw = up + 90;
  const r = 9.4;
  const P = (x: number, y: number): Pt => step(step(j.head, up, y * r), fw, x * r);
  const side: [number, number][] = [
    [-0.95, 0.1],
    [-0.85, 0.62],
    [-0.42, 0.98],
    [0.2, 1.02],
    [0.66, 0.76],
    [0.88, 0.36],
    [0.95, 0.1],
    [1.16, -0.16],
    [0.98, -0.3],
    [1.01, -0.42],
    [0.93, -0.68],
    [0.56, -0.9],
    [0.12, -0.8],
    [-0.5, -0.62]
  ];
  const frontPts: [number, number][] = [
    [0, 1.05],
    [0.62, 0.9],
    [0.88, 0.35],
    [1.02, 0.05],
    [0.98, -0.22],
    [0.8, -0.42],
    [0.52, -0.84],
    [0, -1.02]
  ];
  const pts = front
    ? [
        ...frontPts,
        ...frontPts
          .slice(1, -1)
          .reverse()
          .map(([x, y]) => [-x, y] as [number, number])
      ]
    : side;
  const hg = grad(P(-1, 0), P(1, 0), 1, front ? [K.skinLo, K.skin, K.skinHi] : [K.skinLo, K.skin, K.skinHi]);
  ctx.defs.push(hg.def);
  let s = `<path d="${smooth(pts.map(([x, y]) => P(x, y)))}" fill="${hg.url}" stroke="${K.line}" stroke-width=".7"/>`;
  if (front) {
    for (const sg of [-1, 1]) {
      const e = P(0.38 * sg, 0.12);
      s += `<ellipse cx="${f(e[0])}" cy="${f(e[1])}" rx="1.6" ry=".7" transform="rotate(${f(fw)} ${f(e[0])} ${f(e[1])})" fill="${K.line}" opacity=".55"/>`;
    }
  } else {
    const ear = P(-0.1, -0.05);
    s += `<ellipse cx="${f(ear[0])}" cy="${f(ear[1])}" rx="1.9" ry="2.7" transform="rotate(${f(fw)} ${f(ear[0])} ${f(ear[1])})" fill="${K.skin}" stroke="${K.line}" stroke-width=".5"/>`;
    const e1 = P(0.62, 0.12);
    const e2 = P(0.8, 0.1);
    s += `<line x1="${f(e1[0])}" y1="${f(e1[1])}" x2="${f(e2[0])}" y2="${f(e2[1])}" stroke="${K.line}" stroke-width=".8" stroke-linecap="round" opacity=".7"/>`;
  }
  return s;
}

/** mão fechada a partir do punho */
function handShape(j: Joints, side: "N" | "F", ctx: Ctx, far: boolean): string {
  const w = j[`wrist${side}`];
  const d = ang(j[`elbow${side}`], w);
  return drawSeg({ a: step(w, d, 0.5), b: step(w, d, 5.5), r1: 2.9, r2: 3.3, bellies: [{ side: -1, t0: 0.1, t1: 0.7, amp: 0.8 }] }, ctx, far);
}

/** pé com calcanhar */
function footSeg(j: Joints, side: "N" | "F"): Seg {
  const an = j[`ankle${side}`];
  const toe = j[`toe${side}`];
  const d = ang(an, toe);
  return {
    a: step(an, d + 180, 3),
    b: toe,
    r1: 3.4,
    r2: 2.0,
    bellies: [
      { side: 1, t0: -0.05, t1: 0.35, amp: 1.0 },
      { side: -1, t0: 0.15, t1: 0.75, amp: 0.9 }
    ]
  };
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
    foot: footSeg(j, side)
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

/** cores da legenda: músculo principal e auxiliares */
export const ATLAS_COLORS = { primary: K.red, secondary: K.sec };

export const ATLAS_BG = (id = "") =>
  `<defs><radialGradient id="abg${id}" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="${K.bg1}"/><stop offset="1" stop-color="${K.bg2}"/></radialGradient></defs><rect width="320" height="240" fill="url(#abg${id})"/>`;

/** membros na vista de frente: N = lado direito da tela; "fora" = longe do corpo */
function frontSegs(j: Joints, side: "N" | "F") {
  const out: 1 | -1 = side === "N" ? -1 : 1;
  const inn = (out * -1) as 1 | -1;
  return {
    upper: {
      a: j[`shoulder${side}`],
      b: j[`elbow${side}`],
      r1: 5.6,
      r2: 4.0,
      bellies: [
        { side: out, t0: -0.15, t1: 0.42, amp: 3.0, m: "ombros" },
        { side: inn, t0: -0.1, t1: 0.3, amp: 1.2, m: "ombros" },
        { side: out, t0: 0.38, t1: 0.9, amp: 1.2, m: "biceps" },
        { side: inn, t0: 0.3, t1: 0.9, amp: 1.6, m: "biceps" }
      ]
    } as Seg,
    fore: {
      a: j[`elbow${side}`],
      b: j[`wrist${side}`],
      r1: 4.4,
      r2: 2.6,
      bellies: [
        { side: out, t0: 0, t1: 0.6, amp: 1.6, m: "antebraco" },
        { side: inn, t0: 0, t1: 0.5, amp: 0.8, m: "antebraco" }
      ]
    } as Seg,
    thigh: {
      a: j[`hip${side}`],
      b: j[`knee${side}`],
      r1: 8.0,
      r2: 5.0,
      bellies: [
        { side: out, t0: 0.05, t1: 0.85, amp: 2.4, m: "quadriceps" },
        { side: inn, t0: -0.1, t1: 0.85, amp: 2.6, m: "adutores" },
        { side: out, t0: -0.55, t1: 0.45, amp: 3.6, m: "gluteos" },
        { side: inn, t0: 0.55, t1: 0.95, amp: 1.4, m: "quadriceps" }
      ]
    } as Seg,
    shin: {
      a: j[`knee${side}`],
      b: j[`ankle${side}`],
      r1: 4.8,
      r2: 2.8,
      bellies: [
        { side: inn, t0: 0.05, t1: 0.5, amp: 1.8, m: "panturrilhas" },
        { side: out, t0: 0.05, t1: 0.55, amp: 1.4, m: "panturrilhas" }
      ]
    } as Seg,
    foot: { a: j[`ankle${side}`], b: j[`toe${side}`], r1: 3.0, r2: 2.4, bellies: [] } as Seg
  };
}

function frontTorso(j: Joints, ctx: Ctx): string {
  const tA = ang(j.hip, j.shoulder);
  const L = dist(j.hip, j.shoulder);
  const at = (t: number, off: number): Pt => step(step(j.hip, tA, L * t), tA + 90, off);
  // contorno: quadril → cintura → dorsal → axila → ombro → pescoço (dos dois lados)
  const half = [
    [-0.06, 11],
    [0.3, 10.5],
    [0.62, 14],
    [0.86, 16.5],
    [1.0, 15],
    [1.06, 7]
  ] as const;
  const right = half.map(([t, w]) => at(t, w));
  const left = half.map(([t, w]) => at(t, -w)).reverse();
  const g = grad(at(0.5, -16), at(0.5, 16), 1, [K.skinLo, K.skin, K.skinHi]);
  ctx.defs.push(g.def);
  let s = `<path d="${smooth([...right, ...left])}" fill="${g.url}" stroke="${K.line}" stroke-width=".7"/>`;
  const ell = (c: Pt, rx: number, ry: number, m: Muscle) => {
    const worked = ctx.worked.includes(m);
    let fill = "none";
    if (worked) {
      const main = m === ctx.primary;
      const rg = grad(step(c, tA, ry), step(c, tA + 180, ry), 1, main ? [K.redHi, K.red, K.redLo] : [K.secHi, K.sec, K.sec]);
      ctx.defs.push(rg.def);
      fill = rg.url;
    }
    return `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(tA + 90)} ${f(c[0])} ${f(c[1])})" fill="${fill}" stroke="${K.line}" stroke-width=".5" stroke-opacity=".6"/>`;
  };
  if (L > 20) {
    s += ell(at(0.8, 7.2), 7, 6.2, "peito") + ell(at(0.8, -7.2), 7, 6.2, "peito");
    s += ell(at(0.4, 0), 6, 12, "abdomen");
    s += ell(at(0.62, 13), 2.6, 9, "costas") + ell(at(0.62, -13), 2.6, 9, "costas");
    if (!ctx.worked.includes("abdomen"))
      for (const t of [0.3, 0.42, 0.53])
        s += `<line x1="${f(at(t, -5)[0])}" y1="${f(at(t, -5)[1])}" x2="${f(at(t, 5)[0])}" y2="${f(at(t, 5)[1])}" stroke="${K.line}" stroke-width=".4" opacity=".5"/>`;
  } else {
    // deitado visto pelos pés: só a faixa do peito
    s += ell(at(0.6, 7), 7, 4, "peito") + ell(at(0.6, -7), 7, 4, "peito");
  }
  // trapézio entre pescoço e ombros
  s += ell(at(1.04, 9), 5.5, 2.6, "trapezio") + ell(at(1.04, -9), 5.5, 2.6, "trapezio");
  return s;
}

function renderAtlasFront(spec: AnimSpec, j: Joints, ctx: Ctx): string {
  const floor = spec.floor === undefined ? 222 : spec.floor;
  let s = "";
  if (floor !== null) {
    s += `<ellipse cx="${f(j.hip[0])}" cy="${floor + 1}" rx="48" ry="5" fill="#000" opacity=".12"/>`;
    s += `<line x1="-200" y1="${floor}" x2="520" y2="${floor}" stroke="${K.floor}" stroke-width="1.2"/>`;
  }
  s += (spec.back ?? []).map((p) => drawProp(p, j)).join("");
  const N = frontSegs(j, "N");
  const F = frontSegs(j, "F");
  if (!spec.hideLegs) s += [N.thigh, F.thigh, N.shin, F.shin, N.foot, F.foot].map((x) => drawSeg(x, ctx, false)).join("");
  s += drawSeg({ a: j.shoulder, b: j.neck, r1: 6, r2: 5, bellies: [] }, ctx, false);
  s += headShape(j, ctx, true);
  s += frontTorso(j, ctx);
  s += [N.upper, F.upper, N.fore, F.fore].map((x) => drawSeg(x, ctx, false)).join("");
  s += handShape(j, "N", ctx, false) + handShape(j, "F", ctx, false);
  s += (spec.front ?? []).map((p) => drawProp(p, j)).join("");
  return `<defs>${ctx.defs.join("")}</defs>${s}`;
}

/** Desenha um quadro no estilo atlas. */
export function renderAtlas(spec: AnimSpec, pose: Pose, at: Pt, opts: RenderOpts, idPrefix = ""): string {
  gid = 0;
  gpre = idPrefix;
  const j = solve(pose, { joint: spec.anchor, at }, spec);
  const ctx: Ctx = { defs: [], worked: [opts.primary, ...opts.secondary], primary: opts.primary };
  if (spec.view === "front") return renderAtlasFront(spec, j, ctx);
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
  if (!spec.hideFarArm) s += [F.upper, F.fore].map((x) => drawSeg(x, ctx, true)).join("") + handShape(j, "F", ctx, true);
  // pescoço, tronco e cabeça
  s += drawSeg({ a: j.shoulder, b: j.neck, r1: 5.2, r2: 4.6, bellies: [] }, ctx, false);
  s += drawSeg(torsoSeg(j), ctx, false);
  s += headShape(j, ctx, false);
  if (!spec.hideLegs) s += [N.thigh, N.shin, N.foot].map((x) => drawSeg(x, ctx, false)).join("");
  s += [N.upper, N.fore].map((x) => drawSeg(x, ctx, false)).join("");
  s += handShape(j, "N", ctx, false);
  s += (spec.front ?? []).map((p) => drawProp(p, j)).join("");
  return `<defs>${ctx.defs.join("")}</defs>${s}`;
}
