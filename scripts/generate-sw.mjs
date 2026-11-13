// Gera out/sw.js com a lista de arquivos a guardar para uso offline e uma versão baseada no conteúdo.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "out");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const EXCLUDE = [/^\/_headers$/, /\.(webm|mp4)$/, /^\/sw\.js$/, /\.map$/, /^\/media\/exercicios\/[^/]+\/(inicio|fim)\.webp$/, /^\/voz\//];
const files = walk(out)
  .map((p) => "/" + relative(out, p).split("\\").join("/"))
  .filter((p) => !EXCLUDE.some((re) => re.test(p)))
  .sort();

// Páginas são guardadas pela URL limpa (/treinos, não /treinos.html), igual à Cloudflare e ao servidor local.
const urls = files.map((f) => (f === "/index.html" ? "/" : f.endsWith(".html") ? f.slice(0, -5) : f));

const hash = createHash("sha256");
for (const f of files) hash.update(f).update(readFileSync(join(out, f)));
const version = hash.digest("hex").slice(0, 12);

const template = readFileSync(join(root, "scripts/sw-template.js"), "utf8");
writeFileSync(join(out, "sw.js"), template.replace("__VERSION__", version).replace("__PRECACHE__", JSON.stringify(urls, null, 0)));
console.log(`sw.js gerado: versão ${version}, ${files.length} arquivos no pré-cache`);
