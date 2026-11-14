/**
 * Lembretes por notificação (treino e água) com Durable Objects da Cloudflare.
 * - Um objeto "vapid" guarda o par de chaves VAPID, gerado sozinho no primeiro uso (nada para configurar na conta).
 * - Cada aparelho inscrito tem o próprio objeto, nomeado pelo hash do endereço de push, com um alarme marcado
 *   para o próximo lembrete. Quando o alarme dispara, envia a notificação e marca o seguinte.
 */
import { nextReminder, reminderMessage, validConfig, validTimeZone, type DoneDays, type ReminderConfig, type ReminderKind } from "./schedule";
import { generateVapidKeys, isSubscription, sendPush, type PushSubscriptionJSON, type VapidKeys } from "./webpush";

type Storage = {
  get: <T>(key: string) => Promise<T | undefined>;
  put: (key: string, value: unknown) => Promise<void>;
  deleteAll: () => Promise<void>;
  setAlarm: (t: number) => Promise<void>;
  deleteAlarm: () => Promise<void>;
};
export type DOState = { storage: Storage; blockConcurrencyWhile: <T>(fn: () => Promise<T>) => Promise<T> };
type DOStub = { fetch: (url: string, init?: RequestInit) => Promise<Response> };
export type DONamespace = { idFromName: (name: string) => unknown; get: (id: unknown) => DOStub };
export type ReminderEnv = { LEMBRETES?: DONamespace };

const SUBJECT = "https://bodybuilder.delphoserp.workers.dev";

type Saved = { sub: PushSubscriptionJSON; config: ReminderConfig; tz: string; done: DoneDays; next?: { at: number; kind: ReminderKind } };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class Lembretes {
  constructor(
    private state: DOState,
    private env: ReminderEnv
  ) {}

  private async vapid(): Promise<VapidKeys> {
    if (!this.env.LEMBRETES) throw new Error("sem binding");
    const res = await this.env.LEMBRETES.get(this.env.LEMBRETES.idFromName("vapid")).fetch("https://lembretes/vapid/privada");
    return (await res.json()) as VapidKeys;
  }

  private async schedule(s: Saved, now = Date.now()) {
    s.next = nextReminder(s.config, s.tz, now, s.done) ?? undefined;
    await this.state.storage.put("dados", s);
    if (s.next) await this.state.storage.setAlarm(s.next.at);
    else await this.state.storage.deleteAlarm();
  }

  /** Envia; se o serviço de push disser que a inscrição não existe mais, apaga tudo deste aparelho. */
  private async send(s: Saved, kind: ReminderKind | "teste", at: number): Promise<number> {
    const msg =
      kind === "teste"
        ? { title: "Lembretes ligados", body: "É assim que os lembretes do BODYBUILDER vão aparecer.", url: "/configuracoes", tag: "lembrete-teste" }
        : reminderMessage(kind, at);
    // falha de rede: devolve 0 e o próximo lembrete é marcado normalmente
    const status = await sendPush(s.sub, msg, await this.vapid(), SUBJECT).catch(() => 0);
    if (status === 404 || status === 410) {
      await this.state.storage.deleteAlarm();
      await this.state.storage.deleteAll();
    }
    return status;
  }

  async fetch(req: Request): Promise<Response> {
    const path = new URL(req.url).pathname;

    // objeto "vapid": guarda as chaves
    if (path.startsWith("/vapid/")) {
      const keys = await this.state.blockConcurrencyWhile(async () => {
        let k = await this.state.storage.get<VapidKeys>("vapid");
        if (!k) {
          k = await generateVapidKeys();
          await this.state.storage.put("vapid", k);
        }
        return k;
      });
      return json(path === "/vapid/publica" ? { publicKey: keys.publicKey } : keys);
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (path === "/salvar") {
      const s: Saved = { sub: body.sub as PushSubscriptionJSON, config: body.config as ReminderConfig, tz: body.tz as string, done: {} };
      const old = await this.state.storage.get<Saved>("dados");
      if (old) s.done = old.done;
      await this.schedule(s);
      return json({ ok: true, next: s.next?.at ?? null });
    }
    const s = await this.state.storage.get<Saved>("dados");
    if (!s) return json({ error: "Este aparelho não está inscrito nos lembretes." }, 404);
    if (path === "/apagar") {
      await this.state.storage.deleteAlarm();
      await this.state.storage.deleteAll();
      return json({ ok: true });
    }
    if (path === "/feito") {
      const kind = body.kind === "agua" ? "agua" : "treino";
      if (typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) s.done = { ...s.done, [kind]: body.date };
      await this.schedule(s);
      return json({ ok: true, next: s.next?.at ?? null });
    }
    if (path === "/teste") {
      const status = await this.send(s, "teste", Date.now());
      return json({ ok: status >= 200 && status < 300, status });
    }
    return json({ error: "não encontrado" }, 404);
  }

  async alarm(): Promise<void> {
    const s = await this.state.storage.get<Saved>("dados");
    if (!s?.next) return;
    const now = Date.now();
    // se o alarme atrasou muito (mais de 1 hora), não manda um lembrete fora de hora
    if (now - s.next.at < 3_600_000) {
      const status = await this.send(s, s.next.kind, s.next.at);
      if (status === 404 || status === 410) return;
    }
    await this.schedule(s, Math.max(now, s.next.at));
  }
}

/** Rotas públicas /api/lembretes/* do Worker. */
export async function remindersApi(req: Request, env: ReminderEnv, path: string): Promise<Response> {
  const ns = env.LEMBRETES;
  if (!ns) return json({ error: "Lembretes não configurados neste servidor." }, 503);
  if (path === "/api/lembretes/chave" && req.method === "GET") return ns.get(ns.idFromName("vapid")).fetch("https://lembretes/vapid/publica");
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const text = await req.text();
  if (text.length > 8192) return json({ error: "Pedido grande demais." }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "JSON inválido." }, 400);
  }
  const endpoint = isSubscription(body.sub) ? body.sub.endpoint : typeof body.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) return json({ error: "Inscrição de notificação inválida." }, 400);
  const stub = ns.get(ns.idFromName(await sha256(`bodybuilder-lembrete:${endpoint}`)));
  const forward = (p: string, b: unknown) => stub.fetch(`https://lembretes${p}`, { method: "POST", body: JSON.stringify(b) });

  if (path === "/api/lembretes") {
    if (!isSubscription(body.sub) || !validConfig(body.config) || !validTimeZone(body.tz)) return json({ error: "Dados do lembrete inválidos." }, 400);
    return forward("/salvar", { sub: body.sub, config: body.config, tz: body.tz });
  }
  if (path === "/api/lembretes/apagar") return forward("/apagar", {});
  if (path === "/api/lembretes/feito") return forward("/feito", { kind: body.kind, date: body.date });
  if (path === "/api/lembretes/teste") return forward("/teste", {});
  return json({ error: "não encontrado" }, 404);
}
