import { EXERCISES, EXERCISE_MAP } from "@/data/exercises";
import { MEDIA } from "@/data/media";
import { TEMPLATES } from "@/data/templates";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("biblioteca de exercícios", () => {
  it("tem 50 exercícios com ids únicos", () => {
    expect(EXERCISES).toHaveLength(50);
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(50);
  });

  it("cada exercício tem instruções, erros comuns e substituições válidas", () => {
    for (const e of EXERCISES) {
      expect(e.instructions.length, e.id).toBeGreaterThanOrEqual(3);
      expect(e.errors.length, e.id).toBeGreaterThanOrEqual(2);
      for (const s of e.substitutions) {
        expect(EXERCISE_MAP[s], `${e.id} → ${s}`).toBeDefined();
        expect(s).not.toBe(e.id);
      }
    }
  });

  it("cada exercício tem mídia com arquivos existentes e crédito de licença", () => {
    for (const e of EXERCISES) {
      const m = MEDIA[e.id];
      expect(m, e.id).toBeDefined();
      const files = [m.poster, ...m.frames, ...(m.video ? [m.video.webm, m.video.mp4] : [])];
      for (const f of files) expect(existsSync(join(process.cwd(), "public", f)), f).toBe(true);
      expect(m.credit.license).toBe("CC BY-SA 4.0");
      expect(m.credit.originalFiles.length).toBeGreaterThan(0);
    }
  });

  it("modelos usam apenas exercícios da biblioteca", () => {
    for (const t of TEMPLATES) for (const d of t.days) for (const [id] of d.rows) expect(EXERCISE_MAP[id], id).toBeDefined();
  });
});
