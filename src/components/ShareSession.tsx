"use client";

import { Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RecordHit } from "@/lib/records";
import { drawShareCard, shareCanvas } from "@/lib/shareCard";
import type { Session } from "@/lib/types";

/** Gera o card do treino (formato story) e oferece compartilhar ou baixar. */
export function ShareSession({ session, records }: { session: Session; records: RecordHit[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      if (canvasRef.current) drawShareCard(canvasRef.current, session, records);
      const logo = new Image();
      logo.onload = () => canvasRef.current && drawShareCard(canvasRef.current, session, records, logo);
      logo.src = "/brand/logo-512.png";
    }
    if (!open && d.open) d.close();
  }, [open, session, records]);

  return (
    <>
      <button type="button" className="btn-secondary min-h-10 px-3 text-sm" onClick={() => (setMsg(""), setOpen(true))}>
        <Share2 size={16} aria-hidden /> Compartilhar
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        aria-labelledby={`share-${session.id}`}
        className="m-auto max-h-[96vh] w-[min(92vw,420px)] rounded-2xl bg-transparent p-0 backdrop:bg-black/70"
      >
        <div className="space-y-3 rounded-2xl border border-line bg-graphite p-4 text-parchment">
          <div className="flex items-center justify-between">
            <h2 id={`share-${session.id}`} className="font-display text-xl font-bold">
              Card do treino
            </h2>
            <button type="button" className="btn-ghost min-h-10 px-2" onClick={() => setOpen(false)} aria-label="Fechar">
              <X size={20} aria-hidden />
            </button>
          </div>
          <canvas
            ref={canvasRef}
            className="mx-auto h-auto max-h-[62vh] w-auto max-w-full rounded-xl"
            role="img"
            aria-label={`Resumo do treino ${session.workoutName}`}
          />
          <button
            type="button"
            className="btn-primary w-full"
            onClick={async () => {
              if (!canvasRef.current) return;
              const r = await shareCanvas(canvasRef.current, `treino-${new Date(session.startedAt).toISOString().slice(0, 10)}.png`);
              setMsg(r === "baixado" ? "Imagem salva. Agora é só postar nos stories." : r === "compartilhado" ? "Compartilhado." : "");
            }}
          >
            <Share2 size={18} aria-hidden /> Compartilhar imagem
          </button>
          {msg && (
            <p role="status" className="text-center text-sm text-ok">
              {msg}
            </p>
          )}
        </div>
      </dialog>
    </>
  );
}
