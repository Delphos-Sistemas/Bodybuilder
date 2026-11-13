import { EXERCISE_MAP } from "@/data/exercises";
import { fmt } from "./progression";
import type { RecordHit } from "./records";
import { sessionSetCount, sessionVolume, workingSets } from "./session";
import { formatClock, workoutElapsed } from "./time";
import type { Session } from "./types";

const C = { bg: "#0B0A09", panel: "#171513", line: "#34302A", bronze: "#B07D45", bronzeLight: "#D3A46B", sand: "#CDBFA9", text: "#F3EEE6", muted: "#9C9284" };
const DISPLAY = '"Arial Narrow", "Roboto Condensed", Impact, system-ui, sans-serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function fitText(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

/** Reduz o tamanho da fonte até o texto caber na largura. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, max: number, weight: string, size: number, family: string, min = 28): void {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (s > min && ctx.measureText(text).width > max) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${family}`;
  }
}

/** Quebra o texto em até `lines` linhas. */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number, lines: number): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width <= max || !cur) cur = t;
    else {
      out.push(cur);
      cur = w;
    }
  }
  if (cur) out.push(cur);
  if (out.length > lines) {
    const rest = out.slice(lines - 1).join(" ");
    return [...out.slice(0, lines - 1), fitText(ctx, rest, max)];
  }
  return out;
}

/** Desenha o resumo do treino em formato de story (1080 × 1920). */
export function drawShareCard(canvas: HTMLCanvasElement, session: Session, records: RecordHit[], logo?: HTMLImageElement): void {
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#1B1611");
  grad.addColorStop(1, C.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = "middle";
  if (logo?.complete && logo.naturalWidth) {
    ctx.drawImage(logo, 75, 95, 160, 160);
  } else {
    // monograma, enquanto a logo não carregou
    ctx.strokeStyle = C.bronze;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(90, 110, 130, 130, 28);
    ctx.stroke();
    ctx.fillStyle = C.bronzeLight;
    ctx.font = `bold 64px ${DISPLAY}`;
    ctx.textAlign = "center";
    ctx.fillText("BB", 155, 178);
  }
  ctx.textAlign = "left";
  ctx.fillStyle = C.text;
  ctx.font = `bold 60px ${DISPLAY}`;
  ctx.fillText("BODYBUILDER", 250, 178);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.bronzeLight;
  ctx.font = `600 34px ${SANS}`;
  ctx.fillText(new Date(session.startedAt).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase(), 90, 380);
  ctx.fillStyle = C.text;
  ctx.font = `bold 88px ${DISPLAY}`;
  const title = wrap(ctx, session.workoutName, W - 180, 2);
  title.forEach((t, i) => ctx.fillText(t, 90, 480 + i * 96));
  const shift = (title.length - 1) * 96;
  ctx.translate(0, shift);

  // números
  const stats: [string, string][] = [
    ["Duração", formatClock(workoutElapsed(session, session.endedAt ?? session.startedAt))],
    ["Séries", String(sessionSetCount(session))],
    ["Volume", `${Math.round(sessionVolume(session)).toLocaleString("pt-BR")} kg`]
  ];
  const boxW = (W - 180 - 40) / 3;
  stats.forEach(([label, value], i) => {
    const x = 90 + i * (boxW + 20);
    ctx.fillStyle = C.panel;
    ctx.beginPath();
    ctx.roundRect(x, 570, boxW, 200, 28);
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = C.muted;
    ctx.font = `500 30px ${SANS}`;
    ctx.fillText(label, x + 30, 630);
    ctx.fillStyle = C.text;
    fitFont(ctx, value, boxW - 50, "bold", 58, DISPLAY);
    ctx.fillText(value, x + 30, 720);
  });

  let y = 860;
  if (records.length) {
    ctx.fillStyle = C.bronze;
    ctx.beginPath();
    ctx.roundRect(90, y, W - 180, 90 + Math.min(records.length, 3) * 60, 28);
    ctx.fill();
    ctx.fillStyle = C.bg;
    ctx.font = `bold 44px ${DISPLAY}`;
    ctx.fillText(records.length === 1 ? "NOVO RECORDE PESSOAL" : `${records.length} RECORDES PESSOAIS`, 130, y + 66);
    ctx.font = `600 32px ${SANS}`;
    records.slice(0, 3).forEach((r, i) => {
      const name = EXERCISE_MAP[r.exerciseId]?.name ?? r.exerciseId;
      const what = r.type === "carga" ? `${fmt(r.value)} kg` : `1RM est. ${fmt(r.value)} kg`;
      ctx.fillText(fitText(ctx, `${name}: ${what}`, W - 260), 130, y + 126 + i * 60);
    });
    y += 130 + Math.min(records.length, 3) * 60;
  }

  // exercícios
  ctx.fillStyle = C.muted;
  ctx.font = `600 30px ${SANS}`;
  ctx.fillText("EXERCÍCIOS", 90, y + 40);
  y += 70;
  const items = session.items.filter((it) => workingSets(it.sets).length);
  const maxRows = Math.floor((1700 - shift - y) / 86);
  items.slice(0, maxRows).forEach((it) => {
    const sets = workingSets(it.sets);
    const best = sets.reduce((a, b) => (b.loadKg > a.loadKg ? b : a));
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, y + 10);
    ctx.lineTo(W - 90, y + 10);
    ctx.stroke();
    ctx.fillStyle = C.text;
    ctx.font = `600 38px ${SANS}`;
    ctx.fillText(fitText(ctx, EXERCISE_MAP[it.exerciseId]?.name ?? it.exerciseId, 640), 90, y + 62);
    ctx.fillStyle = C.sand;
    ctx.font = `500 34px ${SANS}`;
    ctx.textAlign = "right";
    ctx.fillText(`${sets.length} × ${best.loadKg ? `${fmt(best.loadKg)} kg` : `${best.reps}`}`, W - 90, y + 62);
    ctx.textAlign = "left";
    y += 86;
  });
  if (items.length > maxRows) {
    ctx.fillStyle = C.muted;
    ctx.font = `500 30px ${SANS}`;
    ctx.fillText(`+ ${items.length - maxRows} exercícios`, 90, y + 50);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = C.muted;
  ctx.font = `500 28px ${SANS}`;
  ctx.textAlign = "center";
  ctx.fillText("Desenvolvido por Delphos Sistemas", W / 2, H - 90);
  ctx.textAlign = "left";
}

/** Compartilha a imagem pelo menu do sistema (celular) ou baixa o arquivo. */
export async function shareCanvas(canvas: HTMLCanvasElement, fileName: string): Promise<"compartilhado" | "baixado" | "cancelado"> {
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (!blob) return "cancelado";
  const file = new File([blob], fileName, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "Meu treino no BODYBUILDER" });
      return "compartilhado";
    } catch {
      return "cancelado";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "baixado";
}
