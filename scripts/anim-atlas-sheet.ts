// Folha de conferência do estilo atlas. Uso: npx vite-node scripts/anim-atlas-sheet.ts saida.html ids...
import { writeFileSync } from "node:fs";
import { ANIMS } from "../src/lib/anim/library";
import { fitTransform } from "../src/lib/anim/render";
import { ATLAS_BG, renderAtlas } from "../src/lib/anim/atlas";
import { lerpPose } from "../src/lib/anim/rig";
import { getExercise } from "../src/data/exercises";

const [out, ...ids] = process.argv.slice(2);
let n = 0;
let html = `<!doctype html><meta charset="utf-8"><style>body{background:#fff;margin:8px;font:12px system-ui}.r{display:flex;gap:6px;margin-bottom:6px}.r svg{width:300px;height:225px;border-radius:10px}</style>`;
for (const id of ids) {
  const spec = ANIMS[id];
  const ex = getExercise(id)!;
  const o = { primary: ex.primary, secondary: ex.secondary };
  const fit = fitTransform(spec);
  const fr = (p: (typeof spec.keys)[0]["pose"], at: [number, number]) =>
    `<svg viewBox="0 0 320 240">${ATLAS_BG()}<g transform="translate(${fit.tx} ${fit.ty}) scale(${fit.s})">${renderAtlas(spec, p, at, o, String(n++))}</g></svg>`;
  const k = spec.keys;
  html += `<div class="r">${fr(k[0].pose, k[0].at ?? spec.at)}${fr(lerpPose(k[0].pose, k[1].pose, 0.5), k[0].at ?? spec.at)}${fr(k[1].pose, k[1].at ?? spec.at)}</div>`;
}
writeFileSync(out, html);
