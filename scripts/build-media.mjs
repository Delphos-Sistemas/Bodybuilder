// Gera a mídia das demonstrações a partir das ilustrações Everkinetic (CC BY-SA 4.0)
// Requer ImageMagick (convert/identify) e ffmpeg com libx264 e libvpx-vp9.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const map = JSON.parse(readFileSync(join(root, "scripts/media-map.json"), "utf8"));
const srcDir = join(root, "media-src/everkinetic");
const outRoot = join(root, "public/media/exercicios");
const tmp = join(root, ".media-tmp");
const BG = "#ECEBE7";
const INK = "#2E2E2E";
const W = 800;
const H = 600;
const only = process.argv.slice(2);

function run(cmd, args) {
  return execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
}

function trimBox(file) {
  // devolve x,y,w,h da área com traço
  const out = run("convert", [file, "-fuzz", "8%", "-trim", "-format", "%X %Y %w %h", "info:"]);
  const [x, y, w, h] = out.split(" ").map((v) => parseInt(v, 10));
  return { x, y, w, h };
}

mkdirSync(tmp, { recursive: true });
const manifest = {};

for (const [id, frames] of Object.entries(map)) {
  if (only.length && !only.includes(id)) continue;
  const files = frames.map((f) => join(srcDir, `${f}.png`));
  files.forEach((f) => {
    if (!existsSync(f)) throw new Error(`Arquivo de origem ausente: ${f}`);
  });
  const outDir = join(outRoot, id);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  // caixa que une todos os quadros, para manter o registro entre início e fim
  const boxes = files.map(trimBox);
  const x0 = Math.min(...boxes.map((b) => b.x));
  const y0 = Math.min(...boxes.map((b) => b.y));
  const x1 = Math.max(...boxes.map((b) => b.x + b.w));
  const y1 = Math.max(...boxes.map((b) => b.y + b.h));
  const cw = x1 - x0;
  const ch = y1 - y0;
  const pad = 0.08;
  const scale = Math.min((W * (1 - pad * 2)) / cw, (H * (1 - pad * 2)) / ch);
  const sw = Math.round(cw * scale);
  const sh = Math.round(ch * scale);

  const pngs = files.map((f, i) => {
    const out = join(tmp, `${id}-${i}.png`);
    run("convert", [
      f, "-background", "white", "-flatten",
      "-crop", `${cw}x${ch}+${x0}+${y0}`, "+repage",
      "-resize", `${sw}x${sh}!`,
      "-colorspace", "sRGB", "-level", "0%,82%",
      "+level-colors", `${INK},${BG}`,
      "-gravity", "center", "-background", BG, "-extent", `${W}x${H}`,
      "-colorspace", "sRGB", "-type", "TrueColor", out
    ]);
    return out;
  });

  const names = pngs.length > 1 ? ["inicio", "fim"] : ["posicao"];
  pngs.forEach((p, i) => {
    run("convert", [p, "-quality", "82", join(outDir, `${names[i]}.webp`)]);
  });
  run("convert", [pngs[0], "-resize", "480x360", "-quality", "78", join(outDir, "capa.webp")]);

  const entry = {
    frames: names.map((n) => `/media/exercicios/${id}/${n}.webp`),
    poster: `/media/exercicios/${id}/capa.webp`,
    sources: frames,
    video: null
  };

  if (pngs.length === 2) {
    // Loop curto: início → fim → início, com transição suave de 0,3 s.
    const hold = 1.4;
    const fade = 0.3;
    const args = [
      "-y", "-loglevel", "error",
      "-loop", "1", "-t", String(hold), "-i", pngs[0],
      "-loop", "1", "-t", String(hold), "-i", pngs[1],
      "-loop", "1", "-t", String(hold), "-i", pngs[0],
      "-filter_complex",
      `[0][1]xfade=transition=fade:duration=${fade}:offset=${hold - fade}[a];[a][2]xfade=transition=fade:duration=${fade}:offset=${2 * hold - 2 * fade},scale=640:480,format=yuv420p[v]`,
      "-map", "[v]", "-r", "24", "-an"
    ];
    run("ffmpeg", [...args, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "40", "-row-mt", "1", join(outDir, "loop.webm")]);
    run("ffmpeg", [...args, "-c:v", "libx264", "-profile:v", "main", "-crf", "30", "-preset", "slow", "-movflags", "+faststart", join(outDir, "loop.mp4")]);
    entry.video = {
      webm: `/media/exercicios/${id}/loop.webm`,
      mp4: `/media/exercicios/${id}/loop.mp4`,
      kind: "alternancia"
    };
  }
  manifest[id] = entry;
  console.log(`ok ${id}`);
}

const manifestPath = join(root, "src/data/media.generated.json");
const previous = existsSync(manifestPath) && only.length ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
writeFileSync(manifestPath, JSON.stringify({ ...previous, ...manifest }, null, 2) + "\n");
rmSync(tmp, { recursive: true, force: true });
