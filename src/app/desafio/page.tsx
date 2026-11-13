"use client";

import clsx from "clsx";
import { Copy, Crown, Link as LinkIcon, Share2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ShareCanvas } from "@/components/ShareCanvas";
import { Card, PageHeader } from "@/components/ui";
import { CHALLENGE_KINDS, decodeChallenge, encodeChallenge, mergeEntries, monthKey, myEntry, ranking } from "@/lib/challenge";
import { uid } from "@/lib/id";
import { drawChallengeCard } from "@/lib/shareCard";
import { useData, useStore } from "@/lib/store";
import type { ChallengeBoard } from "@/lib/types";

const fmtValue = (kind: ChallengeBoard["kind"], v: number) =>
  kind === "volume" ? `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} t` : String(v);

export default function DesafioPage() {
  const data = useData();
  const mode = useStore((s) => s.mode);
  const board = useStore((s) => s.settings.challenge);
  const updateSettings = useStore((s) => s.updateSettings);
  const saveProfile = useStore((s) => s.saveProfile);
  const [name, setName] = useState(data.profile.name);
  const [msg, setMsg] = useState("");
  const [received, setReceived] = useState(0);
  const now = Date.now();
  const mes = monthKey(now);
  const monthLabel = new Date(now).toLocaleDateString("pt-BR", { month: "long" });

  // meu id e minha linha, sempre com os números atuais
  const meId = board?.me ?? "";
  const me = useMemo(() => (meId ? myEntry(meId, name || data.profile.name, data.sessions, now) : null), [meId, name, data.sessions, data.profile.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // primeira visita: cria meu id; link recebido: junta os participantes
  useEffect(() => {
    const st = useStore.getState().settings.challenge;
    let next: ChallengeBoard = st ?? { me: uid("d_").replace(/[^a-z0-9_]/gi, ""), kind: "treinos", entries: [] };
    const code = new URLSearchParams(window.location.hash.slice(1)).get("d");
    if (code) {
      const got = decodeChallenge(code);
      if (got) {
        const others = got.entries.filter((e) => e.id !== next.me);
        next = { ...next, kind: st ? next.kind : got.kind, entries: mergeEntries(next.entries, others) };
        setReceived(others.length);
      }
      history.replaceState(null, "", window.location.pathname);
    }
    if (next !== st) updateSettings({ challenge: next });
  }, [updateSettings]);

  if (!board || !me) return <p className="text-muted">Carregando…</p>;

  const entries = mergeEntries(
    board.entries.filter((e) => e.id !== board.me),
    [me]
  );
  const rows = ranking(entries, board.kind, mes);
  const link = () => `${window.location.origin}/desafio#d=${encodeChallenge(board.kind, entries)}`;

  const share = async () => {
    if (!name.trim()) {
      setMsg("Coloque seu nome antes de enviar.");
      document.getElementById("desafio-nome")?.focus();
      return;
    }
    if (name.trim() !== data.profile.name && mode === "usuario") saveProfile({ ...data.profile, name: name.trim() });
    const url = link();
    const text = `Desafio de ${monthLabel} no BODYBUILDER: ${CHALLENGE_KINDS[board.kind].toLowerCase()}. Abra, entre e me mande de volta!`;
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: "Desafio BODYBUILDER", text, url });
        setMsg("Enviado. Quando a pessoa abrir e mandar de volta, o ranking atualiza aqui.");
        return;
      } catch {
        /* cancelou: tenta copiar */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setMsg("Link copiado. Cole no WhatsApp do seu amigo.");
    } catch {
      setMsg(url);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={`Desafio de ${monthLabel}`} title="Treino com amigos" />

      {received > 0 && (
        <p role="status" className="rounded-xl border border-ok/40 bg-ok/10 px-4 py-3 text-sm">
          Ranking atualizado com {received} {received === 1 ? "pessoa" : "pessoas"} do link. Mande de volta para eles verem seus números.
        </p>
      )}

      <Card className="space-y-3">
        <p className="flex items-start gap-2 text-sm text-sand">
          <Users size={18} className="mt-0.5 shrink-0 text-bronze-light" aria-hidden />
          Funciona por link, sem cadastro: você manda, o amigo abre no app dele, os números dele entram e ele manda de volta. Cada um vê o ranking com os
          últimos números que recebeu.
        </p>
        <div>
          <label htmlFor="desafio-nome" className="label">
            Seu nome no ranking
          </label>
          <input id="desafio-nome" className="input" maxLength={30} value={name} placeholder="Ex.: Barretão" onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <p className="label">Quem ganha</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Critério do desafio">
            {(Object.keys(CHALLENGE_KINDS) as ChallengeBoard["kind"][]).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={board.kind === k}
                className={clsx("chip", board.kind === k && "chip-on")}
                onClick={() => updateSettings({ challenge: { ...board, kind: k } })}
              >
                {CHALLENGE_KINDS[k]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="space-y-3" data-testid="ranking">
        <h2 className="font-display text-xl font-bold">Ranking · {CHALLENGE_KINDS[board.kind]}</h2>
        <ol className="space-y-2">
          {rows.map((r, i) => {
            const eu = r.id === board.me;
            return (
              <li
                key={r.id}
                className={clsx(
                  "flex items-center gap-3 rounded-xl border px-3 py-2",
                  eu ? "border-bronze bg-bronze/10" : "border-line bg-iron",
                  !r.atual && "opacity-60"
                )}
              >
                <span className="w-8 font-display text-xl font-bold text-bronze-light">
                  {i === 0 && r.valor > 0 ? <Crown size={22} aria-label="1º" /> : `${i + 1}º`}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{eu ? `${name.trim() || "Você"} (você)` : r.nome}</span>
                  <span className="text-xs text-muted">
                    {r.atual
                      ? `${r.treinos} treinos · ${fmtValue("volume", r.volume)} · ${r.series} séries · ${r.recordes} recordes`
                      : `Ainda sem números de ${monthLabel}`}
                    {!eu && r.atual && ` · ${new Date(r.em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`}
                  </span>
                </span>
                <span className="font-display text-2xl font-bold">{fmtValue(board.kind, r.valor)}</span>
              </li>
            );
          })}
        </ol>
        {rows.length === 1 && <p className="text-sm text-muted">Só você por enquanto. Mande o link para um amigo entrar.</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" className="btn-primary" onClick={() => void share()}>
            <LinkIcon size={18} aria-hidden /> Enviar link do desafio
          </button>
          <ShareCanvas
            title="Card do desafio"
            fileName={`desafio-${mes}.png`}
            className="min-h-12"
            draw={(c, logo) =>
              drawChallengeCard(
                c,
                CHALLENGE_KINDS[board.kind],
                monthLabel,
                rows.map((r) => ({ nome: r.id === board.me ? name.trim() || "Eu" : r.nome, valor: fmtValue(board.kind, r.valor), eu: r.id === board.me })),
                logo
              )
            }
          >
            <Share2 size={16} aria-hidden /> Card do ranking
          </ShareCanvas>
        </div>
        {msg && (
          <p role="status" className="flex items-start gap-1.5 break-all text-sm text-ok">
            <Copy size={14} className="mt-0.5 shrink-0" aria-hidden /> {msg}
          </p>
        )}
        <p className="text-xs text-muted">
          Os números vêm de cada app e ficam só nos links e nos aparelhos. Nada vai para um servidor. Todo mês o ranking zera.
        </p>
      </Card>
    </div>
  );
}
