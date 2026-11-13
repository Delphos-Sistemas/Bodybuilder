import { Lembretes, remindersApi, type ReminderEnv } from "./reminders";

export { Lembretes };

/**
 * Worker da Cloudflare: serve o app estático (./out) e a API de sincronização em /api/*.
 * A sincronização só funciona quando o banco D1 está ligado ao binding DB (ver README).
 * Os dados ficam guardados sob o hash SHA-256 do código secreto; o código em si nunca é salvo.
 */

type D1Result<T> = { results: T[] };
type D1Prepared = {
  bind: (...v: unknown[]) => D1Prepared;
  first: <T>() => Promise<T | null>;
  run: () => Promise<{ meta: { changes: number } }>;
  all: <T>() => Promise<D1Result<T>>;
};
type D1Database = { prepare: (sql: string) => D1Prepared };
type Env = { ASSETS: { fetch: (r: Request) => Promise<Response> }; DB?: D1Database } & ReminderEnv;

const MAX_BYTES = 4 * 1024 * 1024;
const CODE = /^([A-Z0-9]{4}-){5}[A-Z0-9]{4}$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function keyFrom(req: Request): Promise<string | null> {
  const code = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  return CODE.test(code) ? sha256(`bodybuilder-sync:${code}`) : null;
}

async function api(req: Request, env: Env, path: string): Promise<Response> {
  if (path === "/api/lembretes" || path.startsWith("/api/lembretes/")) return remindersApi(req, env, path);
  if (path === "/api/sync/status") return json({ ok: true, configured: !!env.DB });
  if (path !== "/api/sync") return json({ error: "não encontrado" }, 404);
  if (!env.DB) return json({ error: "Sincronização não configurada neste servidor." }, 503);
  const key = await keyFrom(req);
  if (!key) return json({ error: "Código de sincronização inválido." }, 401);

  if (req.method === "GET") {
    const row = await env.DB.prepare("SELECT version, data FROM sync_data WHERE key_hash = ?").bind(key).first<{ version: number; data: string }>();
    return json(row ? { version: row.version, data: JSON.parse(row.data) } : { version: 0, data: null });
  }

  if (req.method === "PUT") {
    const text = await req.text();
    if (text.length > MAX_BYTES) return json({ error: "Dados grandes demais para sincronizar." }, 413);
    let body: { data?: unknown; baseVersion?: unknown };
    try {
      body = JSON.parse(text);
    } catch {
      return json({ error: "JSON inválido." }, 400);
    }
    const base = typeof body.baseVersion === "number" ? body.baseVersion : -1;
    if (!body.data || typeof body.data !== "object" || base < 0) return json({ error: "Corpo inválido." }, 400);
    const data = JSON.stringify(body.data);
    const now = Date.now();
    const next = base + 1;
    // grava só se ninguém mudou desde a versão que o aparelho leu (controle otimista)
    const res =
      base === 0
        ? await env.DB.prepare("INSERT OR IGNORE INTO sync_data (key_hash, version, data, updated_at) VALUES (?, ?, ?, ?)").bind(key, next, data, now).run()
        : await env.DB.prepare("UPDATE sync_data SET version = ?, data = ?, updated_at = ? WHERE key_hash = ? AND version = ?")
            .bind(next, data, now, key, base)
            .run();
    if (!res.meta.changes) return json({ error: "Versão desatualizada." }, 409);
    return json({ version: next });
  }

  if (req.method === "DELETE") {
    await env.DB.prepare("DELETE FROM sync_data WHERE key_hash = ?").bind(key).run();
    return json({ ok: true });
  }

  return json({ error: "Método não permitido." }, 405);
}

const worker = {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await api(req, env, url.pathname.replace(/\/+$/, ""));
      } catch {
        return json({ error: "Erro interno." }, 500);
      }
    }
    return env.ASSETS.fetch(req);
  }
};

export default worker;
