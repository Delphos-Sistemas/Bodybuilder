import { describe, expect, it } from "vitest";
import { calculateVolume, readinessRecommendation, shouldSuggestDoubleProgression } from "../../src/utils/progression";

describe("progressao e volume", () => {
  it("calcula volume total", () => {
    expect(calculateVolume([{ weight: 100, reps: 8 }, { weight: 80, reps: 10 }])).toBe(1600);
  });

  it("sugere progressao dupla quando todas as series batem teto e RIR", () => {
    expect(
      shouldSuggestDoubleProgression(
        { sets: 3, maxReps: 12, targetRir: 2 },
        [
          { reps: 12, rir: 2 },
          { reps: 13, rir: 2 },
          { reps: 12, rir: 3 }
        ]
      )
    ).toBe(true);
  });

  it("recomenda ajuste quando muito fatigado", () => {
    expect(readinessRecommendation("Muito fatigado")).toContain("Reduza");
  });
});
