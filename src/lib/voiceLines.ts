import LINES from "@/data/voice-lines.json";

/** Falas do timer guiado. "zoeira" é o técnico ácido: provoca, mas sem ofender. */
export type VoiceStyle = keyof typeof LINES;
export type VoiceEvent = keyof (typeof LINES)["neutro"];

export const VOICE_STYLES: Record<VoiceStyle, string> = {
  neutro: "Neutro",
  zoeira: "Zoeira ácida",
  comico: "Cômico",
  estoico: "Filósofo estoico",
  maromba: "Zoeira maromba"
};

/** Vozes neurais gravadas (public/voz) ou a voz do próprio aparelho. */
export type VoicePack = "dora" | "alex" | "santa" | "aparelho";
export const VOICE_PACKS: Record<VoicePack, string> = {
  dora: "Feminina (Dora)",
  alex: "Masculina (Alex)",
  santa: "Masculina grave (Santa)",
  aparelho: "Voz do aparelho"
};

export type Line = { text: string; url: string };

const lastPick: Partial<Record<string, number>> = {};

/** Sorteia uma fala do estilo escolhido, sem repetir a anterior do mesmo evento. */
export function voiceLine(style: VoiceStyle, event: VoiceEvent, pack: VoicePack = "dora", rand: () => number = Math.random): Line {
  const pool = LINES[style][event];
  const key = `${style}:${event}`;
  let i = Math.floor(rand() * pool.length);
  if (pool.length > 1 && i === lastPick[key]) i = (i + 1) % pool.length;
  lastPick[key] = i;
  return { text: pool[i], url: `/voz/${pack === "aparelho" ? "dora" : pack}/${style}/${event}-${i}.mp3` };
}

/** Todos os arquivos de um estilo e voz, para baixar antes do treino. */
export function voiceUrls(style: VoiceStyle, pack: VoicePack): string[] {
  if (pack === "aparelho") return [];
  return Object.entries(LINES[style]).flatMap(([event, pool]) => pool.map((_, i) => `/voz/${pack}/${style}/${event}-${i}.mp3`));
}

const EQUIPMENT_HINT: Record<string, string> = {
  barra: "Pegue a barra.",
  halteres: "Pegue os halteres.",
  maquina: "Vá para a máquina.",
  polia: "Vá para a polia.",
  smith: "Vá para o Smith.",
  "peso-corporal": "Só o peso do corpo."
};

/** Texto falado para anunciar um exercício (o mesmo usado para gravar public/voz/<voz>/exercicios). */
export function exerciseAnnouncement(e: { name: string; equipment: string }): string {
  const name = e.name
    .replace(/(\d+)\s*°/g, "$1 graus")
    .replace(/\s*\(([^)]+)\)/g, ", ou $1,")
    .replace(/,\s*$/, "");
  return `Próximo: ${name}. ${EQUIPMENT_HINT[e.equipment] ?? ""}`.trim();
}

export function exerciseClipUrl(pack: VoicePack, id: string): string {
  return `/voz/${pack === "aparelho" ? "dora" : pack}/exercicios/${id}.mp3`;
}
