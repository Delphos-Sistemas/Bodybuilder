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

export type RecordCardInfo = {
  exerciseName: string;
  /** "Recorde de carga" | "Recorde de força" … */
  label: string;
  value: string;
  detail?: string;
  previous?: string;
  date: number;
};

/** Card de recorde pessoal em formato de story (1080 × 1920). */
export function drawRecordCard(canvas: HTMLCanvasElement, info: RecordCardInfo, logo?: HTMLImageElement): void {
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#2A1F14");
  grad.addColorStop(0.55, "#130F0B");
  grad.addColorStop(1, C.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // brilho atrás do troféu
  const glow = ctx.createRadialGradient(W / 2, 640, 40, W / 2, 640, 520);
  glow.addColorStop(0, "rgba(211,164,107,0.35)");
  glow.addColorStop(1, "rgba(211,164,107,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 100, W, 1100);

  ctx.textBaseline = "middle";
  if (logo?.complete && logo.naturalWidth) ctx.drawImage(logo, 75, 95, 160, 160);
  ctx.textAlign = "left";
  ctx.fillStyle = C.text;
  ctx.font = `bold 60px ${DISPLAY}`;
  ctx.fillText("BODYBUILDER", logo?.complete && logo.naturalWidth ? 250 : 90, 178);

  // troféu desenhado (sem imagem externa)
  ctx.save();
  ctx.translate(W / 2, 600);
  ctx.fillStyle = C.bronzeLight;
  ctx.strokeStyle = C.bronzeLight;
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.arc(-150, -60, 70, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(150, -60, 70, Math.PI * 1.5, Math.PI * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-170, -170);
  ctx.lineTo(170, -170);
  ctx.quadraticCurveTo(170, 90, 0, 120);
  ctx.quadraticCurveTo(-170, 90, -170, -170);
  ctx.fill();
  ctx.fillRect(-28, 110, 56, 90);
  ctx.beginPath();
  ctx.roundRect(-130, 195, 260, 60, 14);
  ctx.fill();
  ctx.fillStyle = C.bg;
  ctx.font = `bold 120px ${DISPLAY}`;
  ctx.textAlign = "center";
  ctx.fillText("1", 0, -40);
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.bronzeLight;
  ctx.font = `bold 52px ${DISPLAY}`;
  ctx.fillText("NOVO RECORDE PESSOAL", W / 2, 1000);

  ctx.fillStyle = C.text;
  fitFont(ctx, info.exerciseName, W - 160, "bold", 92, DISPLAY, 50);
  const lines = wrap(ctx, info.exerciseName, W - 160, 2);
  lines.forEach((t, i) => ctx.fillText(t, W / 2, 1120 + i * 100));
  let y = 1120 + (lines.length - 1) * 100;

  ctx.fillStyle = C.text;
  fitFont(ctx, info.value, W - 160, "bold", 230, DISPLAY, 120);
  ctx.fillText(info.value, W / 2, y + 260);
  y += 260;

  ctx.fillStyle = C.sand;
  ctx.font = `600 44px ${SANS}`;
  ctx.fillText(info.label + (info.detail ? ` · ${info.detail}` : ""), W / 2, y + 90);
  if (info.previous) {
    ctx.fillStyle = C.muted;
    ctx.font = `500 38px ${SANS}`;
    ctx.fillText(info.previous, W / 2, y + 150);
  }

  ctx.fillStyle = C.muted;
  ctx.font = `500 34px ${SANS}`;
  ctx.fillText(new Date(info.date).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }), W / 2, H - 160);
  ctx.font = `500 28px ${SANS}`;
  ctx.fillText("Desenvolvido por Delphos Sistemas", W / 2, H - 90);
  ctx.textAlign = "left";
}

function header(ctx: CanvasRenderingContext2D, logo?: HTMLImageElement) {
  ctx.textBaseline = "middle";
  const hasLogo = !!(logo?.complete && logo.naturalWidth);
  if (hasLogo) ctx.drawImage(logo!, 75, 95, 160, 160);
  ctx.textAlign = "left";
  ctx.fillStyle = C.text;
  ctx.font = `bold 60px ${DISPLAY}`;
  ctx.fillText("BODYBUILDER", hasLogo ? 250 : 90, 178);
  ctx.textBaseline = "alphabetic";
}

function footer(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = C.muted;
  ctx.font = `500 28px ${SANS}`;
  ctx.textAlign = "center";
  ctx.fillText("Desenvolvido por Delphos Sistemas", W / 2, H - 90);
  ctx.textAlign = "left";
}

function statBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, value: string, accent = false) {
  ctx.fillStyle = accent ? "rgba(176,125,69,0.18)" : C.panel;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 28);
  ctx.fill();
  ctx.strokeStyle = accent ? C.bronze : C.line;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = C.muted;
  ctx.font = `500 30px ${SANS}`;
  ctx.fillText(label, x + 30, y + 60);
  ctx.fillStyle = accent ? C.bronzeLight : C.text;
  fitFont(ctx, value, w - 60, "bold", 70, DISPLAY);
  ctx.fillText(value, x + 30, y + h - 45);
}

export type WeekCardInfo = {
  start: number;
  end: number;
  treinos: number;
  meta: number;
  volume: number;
  series: number;
  minutos: number;
  recordes: number;
  dias: boolean[];
  topMusculos: { nome: string; series: number }[];
  sequencia: number;
  vsAnterior: number | null;
};

/** Resumo da semana em formato de story (1080 × 1920). */
export function drawWeekCard(canvas: HTMLCanvasElement, w: WeekCardInfo, logo?: HTMLImageElement): void {
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#1E1712");
  grad.addColorStop(1, C.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  header(ctx, logo);

  const d = (ts: number) => new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  ctx.fillStyle = C.bronzeLight;
  ctx.font = `600 34px ${SANS}`;
  ctx.fillText(`SEMANA DE ${d(w.start)} A ${d(w.end)}`, 90, 380);
  ctx.fillStyle = C.text;
  fitFont(ctx, "RESUMO DA SEMANA", W - 180, "bold", 110, DISPLAY, 60);
  ctx.fillText("RESUMO DA SEMANA", 90, 500);

  // dias da semana
  const labels = ["S", "T", "Q", "Q", "S", "S", "D"];
  const gap = (W - 180) / 7;
  labels.forEach((l, i) => {
    const cx = 90 + gap * i + gap / 2;
    ctx.beginPath();
    ctx.arc(cx, 620, 50, 0, Math.PI * 2);
    ctx.fillStyle = w.dias[i] ? C.bronze : C.panel;
    ctx.fill();
    ctx.strokeStyle = w.dias[i] ? C.bronzeLight : C.line;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = w.dias[i] ? C.bg : C.muted;
    ctx.font = `bold 40px ${DISPLAY}`;
    ctx.textAlign = "center";
    ctx.fillText(l, cx, 635);
    ctx.textAlign = "left";
  });

  const bw = (W - 180 - 30) / 2;
  const meta = w.treinos >= w.meta;
  statBox(ctx, 90, 720, bw, 210, "Treinos", `${w.treinos} de ${w.meta}`, meta);
  statBox(ctx, 90 + bw + 30, 720, bw, 210, "Volume", `${(w.volume / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} t`);
  statBox(ctx, 90, 960, bw, 210, "Séries", String(w.series));
  statBox(
    ctx,
    90 + bw + 30,
    960,
    bw,
    210,
    "Tempo treinando",
    w.minutos >= 60 ? `${Math.floor(w.minutos / 60)}h${String(w.minutos % 60).padStart(2, "0")}` : `${w.minutos} min`
  );
  statBox(ctx, 90, 1200, bw, 210, "Recordes", String(w.recordes), w.recordes > 0);
  statBox(ctx, 90 + bw + 30, 1200, bw, 210, "Sequência", `${w.sequencia} ${w.sequencia === 1 ? "semana" : "semanas"}`, w.sequencia >= 2);

  let y = 1490;
  if (w.vsAnterior !== null) {
    ctx.fillStyle = w.vsAnterior >= 0 ? "#7FB77E" : C.sand;
    ctx.font = `600 38px ${SANS}`;
    ctx.fillText(`${w.vsAnterior >= 0 ? "▲" : "▼"} ${Math.abs(w.vsAnterior)}% de volume em relação à semana passada`, 90, y);
    y += 80;
  }
  if (w.topMusculos.length) {
    ctx.fillStyle = C.muted;
    ctx.font = `600 30px ${SANS}`;
    ctx.fillText("MAIS TREINADOS", 90, y);
    ctx.fillStyle = C.text;
    ctx.font = `600 40px ${SANS}`;
    ctx.fillText(fitText(ctx, w.topMusculos.map((m) => `${m.nome} (${m.series})`).join(" · "), W - 180), 90, y + 60);
  }
  if (meta) {
    ctx.fillStyle = C.bronzeLight;
    ctx.font = `bold 48px ${DISPLAY}`;
    ctx.textAlign = "center";
    ctx.fillText("META DA SEMANA CUMPRIDA", W / 2, H - 190);
    ctx.textAlign = "left";
  }
  footer(ctx, W, H);
}

export type ChallengeCardRow = { nome: string; valor: string; eu: boolean };

/** Ranking do desafio entre amigos em formato de story. */
export function drawChallengeCard(canvas: HTMLCanvasElement, title: string, month: string, rows: ChallengeCardRow[], logo?: HTMLImageElement): void {
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#221A12");
  grad.addColorStop(1, C.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  header(ctx, logo);
  ctx.fillStyle = C.bronzeLight;
  ctx.font = `600 34px ${SANS}`;
  ctx.fillText(`DESAFIO DE ${month.toUpperCase()}`, 90, 380);
  ctx.fillStyle = C.text;
  fitFont(ctx, title.toUpperCase(), W - 180, "bold", 110, DISPLAY, 60);
  ctx.fillText(title.toUpperCase(), 90, 500);
  const medal = [C.bronzeLight, "#C9C3BA", "#A0714A"];
  rows.slice(0, 10).forEach((r, i) => {
    const y = 600 + i * 120;
    ctx.fillStyle = r.eu ? "rgba(176,125,69,0.2)" : C.panel;
    ctx.beginPath();
    ctx.roundRect(90, y, W - 180, 100, 24);
    ctx.fill();
    ctx.strokeStyle = r.eu ? C.bronze : C.line;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = medal[i] ?? C.muted;
    ctx.font = `bold 52px ${DISPLAY}`;
    ctx.fillText(`${i + 1}º`, 120, y + 70);
    ctx.fillStyle = C.text;
    ctx.font = `600 42px ${SANS}`;
    ctx.fillText(fitText(ctx, r.nome, 560), 240, y + 66);
    ctx.textAlign = "right";
    ctx.fillStyle = C.bronzeLight;
    ctx.font = `bold 48px ${DISPLAY}`;
    ctx.fillText(r.valor, W - 120, y + 68);
    ctx.textAlign = "left";
  });
  footer(ctx, W, H);
}
