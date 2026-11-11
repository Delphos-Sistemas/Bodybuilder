import generated from "./media.generated.json";

export type ExerciseMedia = {
  /** quadros estáticos: ["inicio", "fim"] ou ["posicao"] */
  frames: string[];
  poster: string;
  video: { webm: string; mp4: string; kind: "alternancia" } | null;
  credit: MediaCredit;
};

export type MediaCredit = {
  author: string;
  source: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  changes: string;
  originalFiles: string[];
};

type Generated = Record<
  string,
  {
    frames: string[];
    poster: string;
    video: ExerciseMedia["video"];
    sources: string[];
  }
>;

const EVERKINETIC = {
  author: "Everkinetic (everkinetic.com)",
  source: "Everkinetic Open Data",
  sourceUrl: "https://github.com/everkinetic/data",
  license: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.pt_BR",
  changes:
    "Recorte, enquadramento 4:3, troca de cores (traço cinza-grafite sobre fundo cinza-claro) e montagem de vídeo curto alternando posição inicial e final."
};

export const MEDIA: Record<string, ExerciseMedia> = Object.fromEntries(
  Object.entries(generated as Generated).map(([id, m]) => [
    id,
    {
      frames: m.frames,
      poster: m.poster,
      video: m.video,
      credit: { ...EVERKINETIC, originalFiles: m.sources }
    }
  ])
);

export function getMedia(id: string): ExerciseMedia | undefined {
  return MEDIA[id];
}

/**
 * Imagens separadas de aparelhos (ficha de exercícios em máquina).
 * Ainda não há material com licença adequada; ver README > Inventário de mídia.
 */
export const MACHINE_IMAGES: Record<string, string> = {};
