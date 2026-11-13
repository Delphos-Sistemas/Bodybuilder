// Mostra as coordenadas das articulações em cada posição-chave. Uso: npx vite-node scripts/anim-debug.ts <id>
import { ANIMS } from "../src/lib/anim/library";
import { solve } from "../src/lib/anim/rig";
const spec = ANIMS[process.argv[2]];
for (const k of spec.keys) {
  const j = solve(k.pose, { joint: spec.anchor, at: k.at ?? spec.at }, spec);
  console.log(
    Object.entries(j)
      .map(([n, p]) => `${n}=${p[0].toFixed(0)},${p[1].toFixed(0)}`)
      .join(" ")
  );
}
