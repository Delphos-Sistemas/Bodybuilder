/**
 * Boneco articulado desenhado em SVG (vista lateral ou de frente).
 * Ângulos absolutos em graus, no sistema da tela: 0 = para a direita, 90 = para baixo, -90 = para cima.
 * Na vista lateral o boneco olha para a direita. "N" = membro do lado de cá (perto), "F" = do lado de lá.
 * Mãos e pés podem ser posicionados por alvo (cinemática inversa) em vez de ângulos: campo `ik`.
 */

export type Pt = [number, number];

export type Pose = {
  torso: number;
  head?: number;
  uaN?: number;
  faN?: number;
  uaF?: number;
  faF?: number;
  thN?: number;
  shN?: number;
  ftN?: number;
  thF?: number;
  shF?: number;
  ftF?: number;
  /** giro do braço para frente (vista de frente): encurta o braço visto de frente. 0 = aberto para o lado */
  yawN?: number;
  yawF?: number;
  /** elevação dos ombros (encolhimento), em unidades do quadro */
  shrug?: number;
  /** alvos (coordenadas do quadro) para punho (h) e tornozelo (f); têm prioridade sobre os ângulos */
  ik?: { hN?: Pt; hF?: Pt; fN?: Pt; fF?: Pt };
};

export type JointName =
  | "hip"
  | "shoulder"
  | "neck"
  | "head"
  | "elbowN"
  | "wristN"
  | "handN"
  | "elbowF"
  | "wristF"
  | "handF"
  | "kneeN"
  | "ankleN"
  | "toeN"
  | "kneeF"
  | "ankleF"
  | "toeF"
  | "upperBack"
  | "chest"
  | "shoulderN"
  | "shoulderF"
  | "hipN"
  | "hipF";

export type Joints = Record<JointName, Pt>;

export const LEN = {
  torso: 50,
  neck: 9,
  headR: 10.5,
  ua: 29,
  fa: 26,
  hand: 6,
  th: 43,
  sh: 41,
  foot: 15
};

/** raios (espessura) de cada parte, na base e na ponta */
export const RAD = {
  torso: [13, 16.5] as const,
  ua: [7.8, 5.6] as const,
  fa: [6.0, 3.8] as const,
  th: [11.2, 7.0] as const,
  sh: [7.0, 4.0] as const,
  foot: [3.8, 2.9] as const
};

/** meia largura dos ombros e do quadril na vista de frente */
export const HALF = { shoulder: 20, hip: 9.5 };

export type View = "side" | "front";

/** lado para onde dobra cada articulação na cinemática inversa: 1 = sentido horário na tela */
export type Bend = { armN?: 1 | -1; armF?: 1 | -1; legN?: 1 | -1; legF?: 1 | -1 };

export type SolveOpts = { view?: View; torsoScale?: number; thighScale?: number; bend?: Bend };

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
export const step = (p: Pt, a: number, len: number): Pt => [p[0] + Math.cos(rad(a)) * len, p[1] + Math.sin(rad(a)) * len];
const angTo = (a: Pt, b: Pt) => deg(Math.atan2(b[1] - a[1], b[0] - a[0]));

type Full = Required<Omit<Pose, "ik">> & { ik: NonNullable<Pose["ik"]> };

export function fullPose(p: Pose): Full {
  return {
    torso: p.torso,
    head: p.head ?? p.torso,
    uaN: p.uaN ?? 90,
    faN: p.faN ?? 90,
    uaF: p.uaF ?? p.uaN ?? 90,
    faF: p.faF ?? p.faN ?? 90,
    thN: p.thN ?? 90,
    shN: p.shN ?? 90,
    ftN: p.ftN ?? 0,
    thF: p.thF ?? p.thN ?? 90,
    shF: p.shF ?? p.shN ?? 90,
    ftF: p.ftF ?? p.ftN ?? 0,
    shrug: p.shrug ?? 0,
    yawN: p.yawN ?? 0,
    yawF: p.yawF ?? p.yawN ?? 0,
    ik: p.ik ?? {}
  };
}

/** cinemática inversa de dois segmentos: devolve os ângulos do 1º e do 2º segmento */
function twoBone(root: Pt, target: Pt, l1: number, l2: number, bend: number): [number, number] {
  const d = Math.min(Math.max(Math.hypot(target[0] - root[0], target[1] - root[1]), Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const base = angTo(root, target);
  const a = deg(Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const a1 = base + bend * a;
  const mid = step(root, a1, l1);
  return [a1, angTo(mid, target)];
}

/** cinemática direta a partir do quadril; depois desloca tudo para o ponto de apoio */
export function solve(pose: Pose, anchor: { joint: JointName; at: Pt }, opts: SolveOpts = {}): Joints {
  const p = fullPose(pose);
  const front = opts.view === "front";
  const bend = opts.bend ?? {};
  const hip0: Pt = [0, 0];
  const shoulder0 = step(hip0, p.torso, LEN.torso * (opts.torsoScale ?? 1));
  const mir = (a: number) => (front ? 2 * p.torso - a : a);

  const build = (hip: Pt, shoulder: Pt, ang: Full): Joints => {
    const perp = ang.torso + 90;
    const neck = step(shoulder, ang.head, LEN.neck);
    const head = step(neck, ang.head, LEN.headR * 0.9);
    const sh = step(shoulder, ang.torso, ang.shrug);
    const shoulderN = front ? step(sh, perp, HALF.shoulder) : sh;
    const shoulderF = front ? step(sh, perp + 180, HALF.shoulder) : sh;
    const hipN = front ? step(hip, perp, HALF.hip) : hip;
    const hipF = front ? step(hip, perp + 180, HALF.hip) : hip;
    // giro: a componente do braço perpendicular ao tronco encolhe com cos(giro)
    const yawArm = (root: Pt, a: number, yaw: number): Pt => {
      if (!yaw) return step(root, a, LEN.ua);
      const rel = rad(a - ang.torso);
      const along = Math.cos(rel) * LEN.ua;
      const across = Math.sin(rel) * LEN.ua * Math.cos(rad(yaw));
      const t = rad(ang.torso);
      return [root[0] + along * Math.cos(t) - across * Math.sin(t), root[1] + along * Math.sin(t) + across * Math.cos(t)];
    };
    const elbowN = yawArm(shoulderN, ang.uaN, ang.yawN);
    const wristN = step(elbowN, ang.faN, LEN.fa);
    const elbowF = yawArm(shoulderF, ang.uaF, ang.yawF);
    const wristF = step(elbowF, ang.faF, LEN.fa);
    const th = LEN.th * (opts.thighScale ?? 1);
    const kneeN = step(hipN, ang.thN, th);
    const ankleN = step(kneeN, ang.shN, LEN.sh);
    const kneeF = step(hipF, ang.thF, th);
    const ankleF = step(kneeF, ang.shF, LEN.sh);
    return {
      hip,
      shoulder,
      neck,
      head,
      elbowN,
      wristN,
      handN: step(wristN, ang.faN, LEN.hand * 0.6),
      elbowF,
      wristF,
      handF: step(wristF, ang.faF, LEN.hand * 0.6),
      kneeN,
      ankleN,
      toeN: step(ankleN, front ? ang.shN - 60 : ang.ftN, front ? LEN.foot * 0.45 : LEN.foot),
      kneeF,
      ankleF,
      toeF: step(ankleF, front ? ang.shF + 60 : ang.ftF, front ? LEN.foot * 0.45 : LEN.foot),
      upperBack: step(step(hip, ang.torso, LEN.torso * 0.86), ang.torso - 90, RAD.torso[1] * 0.95),
      chest: step(step(hip, ang.torso, LEN.torso * 0.72), ang.torso + 90, RAD.torso[1] * 1.05),
      shoulderN,
      shoulderF,
      hipN,
      hipF
    };
  };

  // ângulos efetivos (lado F espelhado na vista de frente)
  const ang: Full = { ...p, uaF: mir(p.uaF), faF: mir(p.faF), thF: mir(p.thF), shF: mir(p.shF) };
  const first = build(hip0, shoulder0, ang);
  const a = first[anchor.joint];
  const dx = anchor.at[0] - a[0];
  const dy = anchor.at[1] - a[1];
  const hip: Pt = [hip0[0] + dx, hip0[1] + dy];
  const shoulder: Pt = [shoulder0[0] + dx, shoulder0[1] + dy];
  const moved = build(hip, shoulder, ang);
  if (!p.ik.hN && !p.ik.hF && !p.ik.fN && !p.ik.fF) return moved;

  if (p.ik.hN) [ang.uaN, ang.faN] = twoBone(moved.shoulderN, p.ik.hN, LEN.ua, LEN.fa, bend.armN ?? 1);
  // sem alvo nem ângulos próprios, o lado F acompanha o lado N
  if (p.ik.hN && !p.ik.hF && pose.uaF === undefined) [ang.uaF, ang.faF] = [mir(ang.uaN), mir(ang.faN)];
  if (p.ik.hF) [ang.uaF, ang.faF] = twoBone(moved.shoulderF, p.ik.hF, LEN.ua, LEN.fa, bend.armF ?? (front ? -(bend.armN ?? 1) : (bend.armN ?? 1)));
  const th = LEN.th * (opts.thighScale ?? 1);
  if (p.ik.fN) [ang.thN, ang.shN] = twoBone(moved.hipN, p.ik.fN, th, LEN.sh, bend.legN ?? -1);
  if (p.ik.fN && !p.ik.fF && pose.thF === undefined) [ang.thF, ang.shF] = [mir(ang.thN) + (front ? 0 : 2), mir(ang.shN)];
  if (p.ik.fF) [ang.thF, ang.shF] = twoBone(moved.hipF, p.ik.fF, th, LEN.sh, bend.legF ?? (front ? -(bend.legN ?? -1) : (bend.legN ?? -1)));
  return build(hip, shoulder, ang);
}

const lerpPt = (a: Pt | undefined, b: Pt | undefined, t: number): Pt | undefined => (a && b ? [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] : (a ?? b));

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const fa = fullPose(a);
  const fb = fullPose(b);
  const keys = ["torso", "head", "uaN", "faN", "uaF", "faF", "thN", "shN", "ftN", "thF", "shF", "ftF", "shrug", "yawN", "yawF"] as const;
  const out: Pose = { torso: 0 };
  for (const k of keys) if (a[k] !== undefined || b[k] !== undefined) out[k] = fa[k] + (fb[k] - fa[k]) * t;
  out.torso = fa.torso + (fb.torso - fa.torso) * t;
  const ik: NonNullable<Pose["ik"]> = {};
  for (const k of ["hN", "hF", "fN", "fF"] as const) {
    const v = lerpPt(fa.ik[k], fb.ik[k], t);
    if (v) ik[k] = v;
  }
  out.ik = ik;
  return out;
}
