import { describe, expect, it } from "vitest";
import { DEFAULT_PREP_SEC, DEFAULT_WORK_SEC, guidedTimes, setItemTimes } from "@/lib/session";
import { voiceLine } from "@/lib/voiceLines";
import type { Session } from "@/lib/types";

const planned = { sets: 3, repsMin: 8, repsMax: 12, loadKg: 40, rir: 2, restSec: 90 };

describe("timer guiado", () => {
  it("usa padrões e o tempo máximo em isométricos", () => {
    expect(guidedTimes(planned)).toEqual({ workSec: DEFAULT_WORK_SEC, prepSec: DEFAULT_PREP_SEC, restSec: 90 });
    expect(guidedTimes({ ...planned, repsMax: 45 }, true).workSec).toBe(45);
    expect(guidedTimes({ ...planned, workSec: 30, prepSec: 0 })).toEqual({ workSec: 30, prepSec: 0, restSec: 90 });
  });

  it("ajusta os tempos só do exercício atual", () => {
    const s = {
      currentIndex: 1,
      items: [
        { exerciseId: "a", planned, sets: [], skipped: false },
        { exerciseId: "b", planned, sets: [], skipped: false }
      ]
    } as unknown as Session;
    const n = setItemTimes(s, { workSec: 25 });
    expect(n.items[1].planned.workSec).toBe(25);
    expect(n.items[0].planned.workSec).toBeUndefined();
  });

  it("não repete a mesma fala seguida", () => {
    const ctx = { exercicio: "Supino", serie: 2, total: 4 };
    const a = voiceLine("zoeira", "iniciar", ctx, () => 0);
    const b = voiceLine("zoeira", "iniciar", ctx, () => 0);
    expect(a).not.toBe(b);
    expect(voiceLine("neutro", "retomar", ctx)).toContain("série 2 de 4");
  });
});
