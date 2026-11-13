// Gera uma folha de conferência (HTML) com as posições-chave de cada animação.
// Uso: npx vite-node scripts/anim-sheet.ts [saida.html] [ids...]
import { writeFileSync } from "node:fs";
import { ANIMS } from "../src/lib/anim/library";
import { SVG_DEFS, fitTransform, renderFrame } from "../src/lib/anim/render";
import { lerpPose } from "../src/lib/anim/rig";
import { getExercise } from "../src/data/exercises";

const [out = "anim-sheet.html", ...ids] = process.argv.slice(2);
const list = ids.length ? ids : Object.keys(ANIMS);
let html = `<!doctype html><meta charset="utf-8"><style>body{background:#0b0a09;color:#cdbfa9;font:12px system-ui;margin:8px}.r{display:flex;gap:6px;margin-bottom:6px;align-items:center}.r svg{width:200px;height:150px;border-radius:10px}.n{width:110px}</style>`;
for (const id of list) {
  const spec = ANIMS[id];
  const ex = getExercise(id)!;
  const o = { primary: ex.primary, secondary: ex.secondary };
  const fit = fitTransform(spec);
  const frame = (pose: (typeof spec.keys)[0]["pose"], at: [number, number]) =>
    `<svg viewBox="0 0 320 240">${SVG_DEFS}<g transform="translate(${fit.tx} ${fit.ty}) scale(${fit.s})">${renderFrame(spec, pose, at, o)}</g></svg>`;
  const k = spec.keys;
  const frames = k.map((key) => frame(key.pose, key.at ?? spec.at));
  if (k.length > 1) {
    const a0 = k[0].at ?? spec.at;
    const a1 = k[1].at ?? spec.at;
    frames.splice(1, 0, frame(lerpPose(k[0].pose, k[1].pose, 0.5), [(a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2]));
  }
  html += `<div class="r"><div class="n">${id}</div>${frames.join("")}</div>`;
}
writeFileSync(out, html);
