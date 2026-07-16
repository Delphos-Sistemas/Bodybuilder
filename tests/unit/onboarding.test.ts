import { describe, expect, it } from "vitest";
import { onboardingSchema } from "../../src/validators/onboarding";

describe("onboarding", () => {
  it("valida perfil inicial", () => {
    expect(
      onboardingSchema.safeParse({
        name: "Tiago",
        birthDate: "1992-08-21",
        heightCm: 178,
        currentWeightKg: 86.4,
        experienceLevel: "Avancado",
        goals: ["Hipertrofia"]
      }).success
    ).toBe(true);
  });
});
