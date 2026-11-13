"use client";

import clsx from "clsx";
import { Share2, Trophy, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { drawRecordCard, shareCanvas, type RecordCardInfo } from "@/lib/shareCard";

/** Botão que abre o card de recorde pessoal (formato story) para compartilhar ou baixar. */
export function ShareRecord({ info, className, label = "Compartilhar recorde" }: { info: RecordCardInfo; className?: string; label?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      if (canvasRef.current) drawRecordCard(canvasRef.current, info);
      const logo = new Image();
      logo.onload = () => canvasRef.current && drawRecordCard(canvasRef.current, info, logo);
      logo.src = "/brand/logo-512.png";
    }
    if (!open && d.open) d.close();
  }, [open, info]);

  return (
    <>
      <button type="button" className={clsx("btn-secondary min-h-10 px-3 text-sm", className)} onClick={() => (setMsg(""), setOpen(true))}>
        <Trophy size={16} aria-hidden /> {label}
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        aria-label="Card do recorde"
        className="m-auto max-h-[96vh] w-[min(92vw,420px)] rounded-2xl bg-transparent p-0 backdrop:bg-black/70"
      >
        <div className="space-y-3 rounded-2xl border border-line bg-graphite p-4 text-parchment">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Card do recorde</h2>
            <button type="button" className="btn-ghost min-h-10 px-2" onClick={() => setOpen(false)} aria-label="Fechar">
              <X size={20} aria-hidden />
            </button>
          </div>
          <canvas
            ref={canvasRef}
            className="mx-auto h-auto max-h-[62vh] w-auto max-w-full rounded-xl"
            role="img"
            aria-label={`Recorde: ${info.exerciseName}, ${info.value}`}
          />
          <button
            type="button"
            className="btn-primary w-full"
            onClick={async () => {
              if (!canvasRef.current) return;
              const r = await shareCanvas(canvasRef.current, `recorde-${new Date(info.date).toISOString().slice(0, 10)}.png`);
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
