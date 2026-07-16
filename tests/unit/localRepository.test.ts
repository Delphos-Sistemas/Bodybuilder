import { describe, expect, it } from "vitest";
import { loadLocalState, saveLocalState } from "../../src/services/localRepository";

describe("persistencia local", () => {
  it("salva e recupera estado", () => {
    saveLocalState({ ok: true });
    expect(loadLocalState({ ok: false })).toEqual({ ok: true });
  });
});
