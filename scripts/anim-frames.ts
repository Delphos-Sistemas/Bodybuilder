// Exporta quadros SVG de animações (para prévias em GIF/vídeo).
// Uso: npx vite-node scripts/anim-frames.ts <pasta> <fps> <segundos> <ids...>
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ANIMS } from "../src/lib/anim/library";
import { renderSvg } from "../src/lib/anim/render";
import { getExercise } from "../src/data/exercises";

const [dir, fps, secs, ...ids] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const n = Math.round(Number(fps) * Number(secs));
for (let i = 0; i < n; i++) {
  const t = i / Number(fps);
  const svgs = ids.map((id) => {
    const ex = getExercise(id)!;
    return `<figure>${renderSvg(ANIMS[id], t, { primary: ex.primary, secondary: ex.secondary })}<figcaption>${ex.name}</figcaption></figure>`;
  });
  writeFileSync(join(dir, `f${String(i).padStart(4, "0")}.html`), svgs.join(""));
}
console.log(n);
