"use client";

import type { ReminderConfig } from "../../worker/schedule";

export type { ReminderConfig };

export const DEFAULT_REMINDERS: ReminderConfig = {
  treino: { enabled: true, time: "18:00", days: [1, 3, 5] },
  agua: { enabled: false, start: "08:00", end: "22:00", everyMin: 120 }
};

export type PushSupport = "ok" | "instalar" | "sem-suporte";

/** iPhone só recebe notificações com o app instalado na Tela de Início (iOS 16.4 ou mais novo). */
export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "sem-suporte";
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (ios && !standalone) return "instalar";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return ios ? "instalar" : "sem-suporte";
  return "ok";
}

export function permission(): NotificationPermission | "indisponivel" {
  return typeof Notification === "undefined" ? "indisponivel" : Notification.permission;
}

function keyBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = b64.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64.length + 3) % 4);
  const bin = atob(pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function post(path: string, body: unknown): Promise<Response> {
  return fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  return reg;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";

/**
 * Pede permissão (precisa vir de um toque do usuário), inscreve o aparelho no push e envia os horários ao servidor.
 * Lança um Error com mensagem em português se não der certo.
 */
export async function saveReminders(config: ReminderConfig): Promise<void> {
  if (Notification.permission !== "granted") {
    const p = await Notification.requestPermission();
    if (p !== "granted") throw new Error("Você não permitiu as notificações. Para ligar depois, libere o BODYBUILDER nos Ajustes do iPhone, em Notificações.");
  }
  const reg = await registration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const res = await fetch("/api/lembretes/chave");
    if (!res.ok) throw new Error("O servidor de lembretes não respondeu. Tente de novo em instantes.");
    const { publicKey } = (await res.json()) as { publicKey: string };
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
  }
  const res = await post("/api/lembretes", { sub: sub.toJSON(), config, tz: tz() });
  if (!res.ok) throw new Error("Não foi possível salvar os lembretes. Confira a internet e tente de novo.");
}

export async function disableReminders(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  await post("/api/lembretes/apagar", { endpoint: sub.endpoint }).catch(() => undefined);
  await sub.unsubscribe().catch(() => undefined);
}

export async function testReminder(): Promise<boolean> {
  const sub = await currentSubscription();
  if (!sub) return false;
  const res = await post("/api/lembretes/teste", { endpoint: sub.endpoint }).catch(() => null);
  return !!res?.ok && ((await res.json()) as { ok: boolean }).ok;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Avisa o servidor que hoje já treinou (ou já bateu a meta de água), para não lembrar à toa. Silencioso se falhar. */
export async function markReminderDone(kind: "treino" | "agua"): Promise<void> {
  try {
    const sub = await currentSubscription();
    if (sub) await post("/api/lembretes/feito", { endpoint: sub.endpoint, kind, date: today() });
  } catch {
    /* sem internet: o lembrete toca normalmente */
  }
}
