// Servidor estático mínimo para testar o build (./out) localmente, com as mesmas regras de URL da Cloudflare.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "out");
const args = process.argv.slice(2);
const port = Number(args[args.indexOf("--port") + 1] || process.env.PORT || 4173);
const host = args.includes("--host") ? "0.0.0.0" : "127.0.0.1";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2"
};

function resolve(pathname) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const candidates = [safe, `${safe.replace(/\/$/, "")}.html`, join(safe, "index.html")];
  for (const c of candidates) {
    const p = join(root, c);
    if (p.startsWith(root) && existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
}

createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const file = resolve(url.pathname);
  const target = file ?? join(root, "404.html");
  const type = TYPES[extname(target)] ?? "application/octet-stream";
  const size = statSync(target).size;
  const headers = { "Content-Type": type, "Cache-Control": url.pathname === "/sw.js" ? "no-cache" : "public, max-age=0" };
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (file && range) {
    const start = range[1] ? parseInt(range[1], 10) : 0;
    const end = range[2] ? parseInt(range[2], 10) : size - 1;
    res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 });
    createReadStream(target, { start, end }).pipe(res);
    return;
  }
  res.writeHead(file ? 200 : 404, { ...headers, "Content-Length": size, "Accept-Ranges": "bytes" });
  if (req.method === "HEAD") return res.end();
  createReadStream(target).pipe(res);
}).listen(port, host, () => console.log(`BODYBUILDER em http://localhost:${port}`));
