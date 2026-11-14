import { ANIMS } from "@/lib/anim/library";
import type { AnimSpec } from "@/lib/anim/render";

/**
 * Demonstrações dos exercícios: animações próprias do app, desenhadas em código (src/lib/anim).
 * Não dependem de arquivos de imagem nem de vídeo e funcionam offline.
 */
export function getAnim(id: string): AnimSpec | undefined {
  return ANIMS[id];
}

/**
 * Imagens separadas de aparelhos (ficha de exercícios em máquina).
 * Ainda não há material com licença adequada; ver README > Mídia dos exercícios.
 */
export const MACHINE_IMAGES: Record<string, string> = {};
