"use client";

import clsx from "clsx";
import { Share2, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { shareCanvas } from "@/lib/shareCard";

/** Botão que abre um card em formato story (desenhado em canvas) para compartilhar ou baixar. */
export function ShareCanvas({
  title,
  fileName,
  draw,
  children,
  className
}: {
  title: string;
  fileName: string;
  draw: (canvas: HTMLCanvasElement, logo?: HTMLImageElement) => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      if (canvasRef.current) drawRef.current(canvasRef.current);
      const logo = new Image();
      logo.onload = () => canvasRef.current && drawRef.current(canvasRef.current, logo);
      logo.src = "/brand/logo-512.png";
    }
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <button type="button" className={clsx("btn-secondary min-h-10 px-3 text-sm", className)} onClick={() => (setMsg(""), setOpen(true))}>
        {children}
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        aria-label={title}
        className="m-auto max-h-[96vh] w-[min(92vw,420px)] rounded-2xl bg-transparent p-0 backdrop:bg-black/70"
      >
        <div className="space-y-3 rounded-2xl border border-line bg-graphite p-4 text-parchment">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">{title}</h2>
            <button type="button" className="btn-ghost min-h-10 px-2" onClick={() => setOpen(false)} aria-label="Fechar">
              <X size={20} aria-hidden />
            </button>
          </div>
          <canvas ref={canvasRef} className="mx-auto h-auto max-h-[62vh] w-auto max-w-full rounded-xl" role="img" aria-label={title} />
          <button
            type="button"
            className="btn-primary w-full"
            onClick={async () => {
              if (!canvasRef.current) return;
              const r = await shareCanvas(canvasRef.current, fileName);
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
