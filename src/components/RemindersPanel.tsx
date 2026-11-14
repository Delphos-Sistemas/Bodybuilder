"use client";

import clsx from "clsx";
import { BellRing, Share } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DEFAULT_REMINDERS,
  disableReminders,
  permission,
  pushSupport,
  saveReminders,
  testReminder,
  type PushSupport,
  type ReminderConfig
} from "@/lib/reminders";
import { useData, useStore } from "@/lib/store";
import { WEEKDAYS } from "@/lib/types";
import { Toggle } from "./ui";

const EVERY = [60, 90, 120, 180] as const;

/** Lembretes de treino e de água por notificação no celular. */
export function RemindersPanel() {
  const profile = useData().profile;
  const saved = useStore((s) => s.settings.reminders);
  const on = useStore((s) => s.settings.remindersOn ?? false);
  const update = useStore((s) => s.updateSettings);
  const [cfg, setCfg] = useState<ReminderConfig>(() => saved ?? { ...DEFAULT_REMINDERS, treino: { ...DEFAULT_REMINDERS.treino, days: profile.days } });
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => setSupport(pushSupport()), []);

  const dirty = JSON.stringify(cfg) !== JSON.stringify(saved);
  const nothing = !cfg.treino.enabled && !cfg.agua.enabled;

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (nothing) {
        await disableReminders();
        update({ reminders: cfg, remindersOn: false });
        setMsg({ ok: true, text: "Lembretes desligados." });
      } else {
        await saveReminders(cfg);
        update({ reminders: cfg, remindersOn: true });
        setMsg({ ok: true, text: "Lembretes salvos. Eles chegam mesmo com o app fechado." });
      }
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Não foi possível ligar os lembretes." });
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    await disableReminders();
    update({ remindersOn: false });
    setBusy(false);
    setMsg({ ok: true, text: "Lembretes desligados neste aparelho." });
  };

  const test = async () => {
    setBusy(true);
    const ok = await testReminder();
    setBusy(false);
    setMsg(
      ok ? { ok: true, text: "Notificação de teste enviada. Deve chegar em alguns segundos." } : { ok: false, text: "Não deu para enviar o teste agora." }
    );
  };

  if (support === "instalar") {
    return (
      <div className="space-y-2 text-sm" data-testid="lembretes-instalar">
        <p>
          No iPhone, os lembretes só funcionam com o BODYBUILDER instalado na Tela de Início. É rápido: no Safari, toque em{" "}
          <Share size={14} className="inline" aria-label="Compartilhar" /> <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>
          .
        </p>
        <p className="text-muted">Depois abra o app pelo ícone novo e volte aqui para ligar os lembretes.</p>
      </div>
    );
  }
  if (support === "sem-suporte") {
    return (
      <p className="text-sm text-muted">Este navegador não aceita notificações. No iPhone, use o app instalado na Tela de Início (iOS 16.4 ou mais novo).</p>
    );
  }

  return (
    <div className="space-y-4" data-testid="lembretes">
      <p className="text-sm text-muted">
        O celular avisa na hora certa, mesmo com o app fechado. Se você já treinou no dia, o lembrete de treino não toca; se bater a meta de água, os avisos de
        água param até o dia seguinte.
      </p>

      <fieldset className="space-y-2 rounded-xl border border-line p-3">
        <Toggle
          id="lembrete-treino"
          label="Lembrete de treino"
          checked={cfg.treino.enabled}
          onChange={(v) => setCfg((c) => ({ ...c, treino: { ...c.treino, enabled: v } }))}
        />
        {cfg.treino.enabled && (
          <>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Dias do lembrete de treino">
              {WEEKDAYS.map((w, i) => {
                const sel = cfg.treino.days.includes(i);
                return (
                  <button
                    key={w}
                    type="button"
                    aria-pressed={sel}
                    className={clsx("chip min-w-12 justify-center", sel && "chip-on")}
                    onClick={() =>
                      setCfg((c) => ({
                        ...c,
                        treino: { ...c.treino, days: sel ? c.treino.days.filter((d) => d !== i) : [...c.treino.days, i].sort() }
                      }))
                    }
                  >
                    {w}
                  </button>
                );
              })}
            </div>
            <div className="max-w-[10rem]">
              <label htmlFor="lembrete-treino-hora" className="label">
                Horário
              </label>
              <input
                id="lembrete-treino-hora"
                type="time"
                className="input"
                value={cfg.treino.time}
                onChange={(e) => e.target.value && setCfg((c) => ({ ...c, treino: { ...c.treino, time: e.target.value } }))}
              />
            </div>
          </>
        )}
      </fieldset>

      <fieldset className="space-y-2 rounded-xl border border-line p-3">
        <Toggle
          id="lembrete-agua"
          label="Lembrete de água"
          checked={cfg.agua.enabled}
          onChange={(v) => setCfg((c) => ({ ...c, agua: { ...c.agua, enabled: v } }))}
        />
        {cfg.agua.enabled && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="agua-inicio" className="label">
                Das
              </label>
              <input
                id="agua-inicio"
                type="time"
                className="input"
                value={cfg.agua.start}
                onChange={(e) => e.target.value && setCfg((c) => ({ ...c, agua: { ...c.agua, start: e.target.value } }))}
              />
            </div>
            <div>
              <label htmlFor="agua-fim" className="label">
                Até
              </label>
              <input
                id="agua-fim"
                type="time"
                className="input"
                value={cfg.agua.end}
                onChange={(e) => e.target.value && setCfg((c) => ({ ...c, agua: { ...c.agua, end: e.target.value } }))}
              />
            </div>
            <div>
              <label htmlFor="agua-intervalo" className="label">
                A cada
              </label>
              <select
                id="agua-intervalo"
                className="input"
                value={cfg.agua.everyMin}
                onChange={(e) => setCfg((c) => ({ ...c, agua: { ...c.agua, everyMin: Number(e.target.value) } }))}
              >
                {EVERY.map((m) => (
                  <option key={m} value={m}>
                    {m % 60 ? `${Math.floor(m / 60)}h${m % 60}` : `${m / 60} h`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </fieldset>

      {cfg.treino.enabled && !cfg.treino.days.length && <p className="text-sm text-danger">Escolha pelo menos um dia para o lembrete de treino.</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary min-h-11"
          disabled={busy || (on && !dirty) || (cfg.treino.enabled && !cfg.treino.days.length)}
          onClick={() => void save()}
        >
          <BellRing size={18} aria-hidden /> {on ? "Salvar lembretes" : "Ligar lembretes"}
        </button>
        {on && (
          <>
            <button type="button" className="btn-secondary min-h-11" disabled={busy} onClick={() => void test()}>
              Enviar teste
            </button>
            <button type="button" className="btn-ghost min-h-11" disabled={busy} onClick={() => void turnOff()}>
              Desligar
            </button>
          </>
        )}
      </div>
      {on && permission() === "denied" && (
        <p className="text-sm text-danger">As notificações estão bloqueadas. Libere nos Ajustes do iPhone → Notificações → BODYBUILDER.</p>
      )}
      {msg && (
        <p role="status" className={clsx("text-sm", msg.ok ? "text-ok" : "text-danger")}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
