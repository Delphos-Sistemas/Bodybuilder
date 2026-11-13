/** Falas do timer guiado. "zoeira" é o técnico ácido: provoca, mas sem ofender. */
export type VoiceStyle = "neutro" | "zoeira";
export type VoiceEvent = "preparar" | "retomar" | "iniciar" | "serie-feita" | "exercicio-feito" | "faltam-10" | "treino-feito";

export const VOICE_STYLES: Record<VoiceStyle, string> = {
  neutro: "Neutro",
  zoeira: "Zoeira ácida"
};

type Ctx = { exercicio: string; serie: number; total: number };
type Line = string | ((c: Ctx) => string);

const NEUTRO: Record<VoiceEvent, Line[]> = {
  preparar: [(c) => `Prepare-se: ${c.exercicio}, série ${c.serie} de ${c.total}.`],
  retomar: [(c) => `Retomar série. Prepare-se: série ${c.serie} de ${c.total}.`],
  iniciar: ["Bora lá, iniciar série!"],
  "serie-feita": ["Série concluída. Descansar."],
  "exercicio-feito": ["Exercício concluído. Descansar."],
  "faltam-10": ["Faltam 10 segundos."],
  "treino-feito": ["Treino concluído! Finalize para salvar."]
};

const ZOEIRA: Record<VoiceEvent, Line[]> = {
  preparar: [
    (c) => `Próxima vítima: ${c.exercicio}. Série ${c.serie} de ${c.total}. Se posiciona aí.`,
    (c) => `${c.exercicio}. Larga o celular e vai pro aparelho, campeão.`,
    (c) => `Agora é ${c.exercicio}. Respira fundo, que reclamar não queima caloria.`,
    (c) => `${c.exercicio}, série ${c.serie}. O espelho tá olhando. Faz bonito.`
  ],
  retomar: [
    (c) => `Acabou a moleza. Série ${c.serie} de ${c.total}, volta pro ferro.`,
    "Fim do descanso. O sofá não vai te deixar grande.",
    "Levanta daí, que o descanso não é aposentadoria.",
    (c) => `Série ${c.serie}. O músculo não cresce no papo, bora.`,
    "Chega de olhar o celular. Hora de trabalhar."
  ],
  iniciar: [
    "Bora lá, iniciar série! Sem chorar.",
    "Vai! Mostra que o shape não é só filtro.",
    "Valendo! Cada repetição conta, até a feia.",
    "Começa! Dor de hoje é marra de amanhã.",
    "Vai, vai, vai! Peso não se levanta sozinho."
  ],
  "serie-feita": [
    "Série concluída. Pode descansar, mas não se acostuma.",
    "Feito. Bebe uma água e para de se achar.",
    "Boa. Descansa aí, que já já tem mais.",
    "Sobreviveu. Descansar.",
    "Mandou bem. Agora descansa, princesa do supino."
  ],
  "exercicio-feito": [
    "Exercício finalizado. Um a menos pra você reclamar.",
    "Acabou esse. Descansa, que o próximo é pior.",
    "Exercício concluído. Até que você não é tão frango."
  ],
  "faltam-10": ["Faltam 10 segundos. Vai se ajeitando.", "10 segundos. Já pode parar de fingir que tá cansado.", "10 segundos, levanta a moral."],
  "treino-feito": [
    "Treino concluído! Agora sim pode postar a foto. Finalize pra salvar.",
    "Acabou! Hoje você mereceu o frango com batata doce. Finalize pra salvar.",
    "Fim do treino. Amanhã a escada vai lembrar de você. Finalize pra salvar."
  ]
};

const lastPick: Partial<Record<VoiceEvent, number>> = {};

/** Sorteia uma fala do estilo escolhido, sem repetir a anterior do mesmo evento. */
export function voiceLine(style: VoiceStyle, event: VoiceEvent, ctx: Ctx, rand: () => number = Math.random): string {
  const pool = (style === "zoeira" ? ZOEIRA : NEUTRO)[event];
  let i = Math.floor(rand() * pool.length);
  if (pool.length > 1 && i === lastPick[event]) i = (i + 1) % pool.length;
  lastPick[event] = i;
  const line = pool[i];
  return typeof line === "function" ? line(ctx) : line;
}
