import { EXERCISES, EXERCISE_MAP } from "@/data/exercises";
import { ANIMS } from "@/lib/anim/library";
import { renderSvg } from "@/lib/anim/render";
import { solve } from "@/lib/anim/rig";
import { TEMPLATES } from "@/data/templates";

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

  it("cada exercício tem animação com posições válidas", () => {
    for (const e of EXERCISES) {
      const spec = ANIMS[e.id];
      expect(spec, e.id).toBeDefined();
      expect(spec.keys.length, e.id).toBeGreaterThanOrEqual(e.isometric ? 1 : 2);
      for (const k of spec.keys) {
        const j = solve(k.pose, { joint: spec.anchor, at: k.at ?? spec.at }, spec);
        for (const [n, p] of Object.entries(j)) expect(Number.isFinite(p[0]) && Number.isFinite(p[1]), `${e.id} ${n}`).toBe(true);
      }
      const svg = renderSvg(spec, 0.7, { primary: e.primary, secondary: e.secondary });
      expect(svg).toContain("<svg");
      expect(svg).not.toContain("NaN");
    }
  });

  it("modelos usam apenas exercícios da biblioteca", () => {
    for (const t of TEMPLATES) for (const d of t.days) for (const [id] of d.rows) expect(EXERCISE_MAP[id], id).toBeDefined();
  });
});
