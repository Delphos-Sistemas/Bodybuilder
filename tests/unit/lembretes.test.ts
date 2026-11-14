// @vitest-environment node
import { describe, expect, it } from "vitest";
import { localDay, localToUtc, nextReminder, validConfig, waterTimes, type ReminderConfig } from "../../worker/schedule";
import { b64url, encryptPayload, fromB64url, generateVapidKeys, isPushEndpoint, isSubscription, vapidAuthorization } from "../../worker/webpush";

const TZ = "America/Cuiaba"; // UTC-4, sem horário de verão
const cfg = (patch: Partial<ReminderConfig> = {}): ReminderConfig => ({
  treino: { enabled: true, time: "18:30", days: [1, 3, 5] },
  agua: { enabled: false, start: "08:00", end: "22:00", everyMin: 120 },
  ...patch
});

describe("agenda dos lembretes", () => {
  it("converte hora local para UTC", () => {
    expect(new Date(localToUtc(TZ, 2026, 11, 16, 18 * 60 + 30)).toISOString()).toBe("2026-11-16T22:30:00.000Z");
    expect(new Date(localToUtc("America/Sao_Paulo", 2026, 11, 16, 7 * 60)).toISOString()).toBe("2026-11-16T10:00:00.000Z");
  });

  it("acha o próximo dia de treino", () => {
    // sexta, 13/11/2026, 20:00 em Cuiabá: já passou das 18:30 → próxima é segunda 16/11
    const after = Date.parse("2026-11-14T00:00:00Z");
    const n = nextReminder(cfg(), TZ, after)!;
    expect(n.kind).toBe("treino");
    expect(new Date(n.at).toISOString()).toBe("2026-11-16T22:30:00.000Z");
  });

  it("pula o dia em que já treinou", () => {
    const after = Date.parse("2026-11-16T12:00:00Z"); // segunda 08:00 local
    expect(new Date(nextReminder(cfg(), TZ, after)!.at).toISOString()).toBe("2026-11-16T22:30:00.000Z");
    const n = nextReminder(cfg(), TZ, after, { treino: "2026-11-16" })!;
    expect(new Date(n.at).toISOString()).toBe("2026-11-18T22:30:00.000Z");
  });

  it("água a cada 2 horas dentro do horário e para depois de bater a meta", () => {
    expect(waterTimes({ enabled: true, start: "08:00", end: "12:00", everyMin: 120 })).toEqual([480, 600, 720]);
    const c = cfg({ treino: { enabled: false, time: "18:00", days: [] }, agua: { enabled: true, start: "08:00", end: "22:00", everyMin: 120 } });
    const after = Date.parse("2026-11-16T13:05:00Z"); // 09:05 local
    expect(new Date(nextReminder(c, TZ, after)!.at).toISOString()).toBe("2026-11-16T14:00:00.000Z");
    const n = nextReminder(c, TZ, after, { agua: "2026-11-16" })!;
    expect(new Date(n.at).toISOString()).toBe("2026-11-17T12:00:00.000Z");
    expect(localDay(TZ, n.at)).toBe("2026-11-17");
  });

  it("sem nada ligado não agenda", () => {
    expect(nextReminder(cfg({ treino: { enabled: false, time: "18:00", days: [1] } }), TZ, Date.now())).toBeNull();
    expect(nextReminder(cfg({ treino: { enabled: true, time: "18:00", days: [] } }), TZ, Date.now())).toBeNull();
  });

  it("valida a configuração", () => {
    expect(validConfig(cfg())).toBe(true);
    expect(validConfig({ ...cfg(), treino: { enabled: true, time: "25:00", days: [1] } })).toBe(false);
    expect(validConfig({ ...cfg(), agua: { enabled: true, start: "08:00", end: "20:00", everyMin: 5 } })).toBe(false);
  });
});

/** Faz o papel do navegador: decifra a mensagem com a chave privada da inscrição (RFC 8291). */
async function decrypt(body: Uint8Array, ua: CryptoKeyPair, auth: Uint8Array<ArrayBuffer>): Promise<string> {
  const enc = new TextEncoder();
  const salt = body.slice(0, 16);
  const idlen = body[20];
  const asPublic = body.slice(21, 21 + idlen);
  const cipher = body.slice(21 + idlen);
  const uaPublic = new Uint8Array(await crypto.subtle.exportKey("raw", ua.publicKey));
  const asKey = await crypto.subtle.importKey("raw", asPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: asKey }, ua.privateKey, 256));
  const hk = async (salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, n: number) =>
    new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: info as BufferSource },
        await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, ["deriveBits"]),
        n * 8
      )
    );
  const info = new Uint8Array([...enc.encode("WebPush: info\0"), ...uaPublic, ...asPublic]);
  const ikm = await hk(auth, shared, info, 32);
  const cek = await hk(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hk(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]);
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, key, cipher));
  expect(plain[plain.length - 1]).toBe(2);
  return new TextDecoder().decode(plain.slice(0, -1));
}

describe("web push", () => {
  it("criptografa a mensagem de um jeito que o navegador consegue abrir", async () => {
    const ua = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
    const auth = crypto.getRandomValues(new Uint8Array(16));
    const sub = {
      endpoint: "https://web.push.apple.com/abc",
      keys: { p256dh: b64url(await crypto.subtle.exportKey("raw", ua.publicKey)), auth: b64url(auth) }
    };
    const body = await encryptPayload(JSON.stringify({ title: "Hora do treino" }), sub);
    expect(new DataView(body.buffer).getUint32(16)).toBe(4096);
    expect(JSON.parse(await decrypt(body, ua, auth))).toEqual({ title: "Hora do treino" });
  });

  it("assina o VAPID em ES256 com a chave pública correta", async () => {
    const keys = await generateVapidKeys();
    expect(fromB64url(keys.publicKey)).toHaveLength(65);
    const h = await vapidAuthorization("https://web.push.apple.com/xyz", keys, "https://exemplo.dev", Date.parse("2026-11-13T00:00:00Z"));
    const m = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(h)!;
    expect(m[4]).toBe(keys.publicKey);
    const claims = JSON.parse(new TextDecoder().decode(fromB64url(m[2])));
    expect(claims.aud).toBe("https://web.push.apple.com");
    const pub = await crypto.subtle.importKey("raw", fromB64url(keys.publicKey), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pub, fromB64url(m[3]), new TextEncoder().encode(`${m[1]}.${m[2]}`));
    expect(ok).toBe(true);
  });

  it("só aceita serviços de push conhecidos", () => {
    expect(isPushEndpoint("https://web.push.apple.com/QW")).toBe(true);
    expect(isPushEndpoint("https://fcm.googleapis.com/fcm/send/x")).toBe(true);
    expect(isPushEndpoint("https://exemplo.com/push")).toBe(false);
    expect(isPushEndpoint("http://web.push.apple.com/x")).toBe(false);
    expect(isSubscription({ endpoint: "https://web.push.apple.com/x", keys: { p256dh: "a", auth: "b" } })).toBe(true);
    expect(isSubscription({ endpoint: "https://web.push.apple.com/x" })).toBe(false);
  });
});
