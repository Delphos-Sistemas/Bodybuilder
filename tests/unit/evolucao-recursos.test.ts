import { TEMPLATES, TEMPLATE_GOALS } from "@/data/templates";
import { suggestPlan } from "@/lib/plan";
import { applyProgression, planProgression } from "@/lib/progression";
import { allRecords, recordCardInfo } from "@/lib/records";
import { DEFAULT_PROFILE, emptyDataset, useStore } from "@/lib/store";
import { compareDates } from "@/components/BodyProgress";
import { EXERCISE_MAP } from "@/data/exercises";
import type { Session } from "@/lib/types";

beforeEach(() => {
  localStorage.clear();
  useStore.setState({ mode: "usuario", usuario: emptyDataset(), demo: null, settings: { audioEnabled: false, vibration: true, alertVolume: 0.7 } });
});

const ex = (exerciseId: string, loadKg: number, repsMin = 8, repsMax = 12) => ({
  uid: exerciseId,
  exerciseId,
  sets: 2,
  repsMin,
  repsMax,
  loadKg,
  rir: 2,
  restSec: 60
});

function train(id: string, sets: [number, number, number][]) {
  useStore.getState().startSession(id);
  for (const [loadKg, reps, rir] of sets) useStore.getState().logSet({ loadKg, reps, rir });
  return useStore.getState().finish(false)!;
}

describe("progressão automática", () => {
  it("sobe a carga da ficha quando bate o topo das repetições", () => {
    const id = useStore.getState().saveWorkout({ id: "", name: "T", notes: "", exercises: [ex("supino-reto", 60)] });
    const sid = train(id, [
      [60, 12, 2],
      [60, 12, 2]
    ]);
    const d = useStore.getState().usuario;
    expect(d.workouts[0].exercises[0].loadKg).toBe(62.5);
    const s = d.sessions.find((x) => x.id === sid)!;
    expect(s.progression).toEqual([{ exerciseId: "supino-reto", fromKg: 60, toKg: 62.5, reps: 8, kind: "subir", applied: true }]);
  });

  it("desfaz e refaz pelo histórico", () => {
    const id = useStore.getState().saveWorkout({ id: "", name: "T", notes: "", exercises: [ex("rosca-direta", 20)] });
    const sid = train(id, [
      [20, 12, 3],
      [20, 12, 3]
    ]);
    expect(useStore.getState().usuario.workouts[0].exercises[0].loadKg).toBe(22.5);
    useStore.getState().toggleProgression(sid);
    expect(useStore.getState().usuario.workouts[0].exercises[0].loadKg).toBe(20);
    expect(useStore.getState().usuario.sessions[0].progression![0].applied).toBe(false);
    useStore.getState().toggleProgression(sid);
    expect(useStore.getState().usuario.workouts[0].exercises[0].loadKg).toBe(22.5);
  });

  it("com a opção desligada só sugere", () => {
    useStore.getState().updateSettings({ autoProgress: false });
    const id = useStore.getState().saveWorkout({ id: "", name: "T", notes: "", exercises: [ex("leg-press", 100)] });
    train(id, [
      [100, 12, 2],
      [100, 12, 2]
    ]);
    const d = useStore.getState().usuario;
    expect(d.workouts[0].exercises[0].loadKg).toBe(100);
    expect(d.sessions[0].progression![0]).toMatchObject({ toKg: 102.5, applied: false });
  });

  it("mantém a carga sem bater a meta e grava a carga usada quando a ficha estava zerada", () => {
    const id = useStore.getState().saveWorkout({ id: "", name: "T", notes: "", exercises: [ex("remada-curvada", 0)] });
    train(id, [
      [50, 9, 2],
      [50, 8, 2]
    ]);
    const d = useStore.getState().usuario;
    expect(d.workouts[0].exercises[0].loadKg).toBe(50);
    expect(d.sessions[0].progression![0]).toMatchObject({ kind: "manter", fromKg: 0, toKg: 50, reps: 10 });
  });

  it("planProgression ignora aquecimento e applyProgression não mexe em quem não mudou", () => {
    const session = {
      id: "s",
      workoutId: "w",
      workoutName: "T",
      startedAt: 0,
      endedAt: 1,
      currentIndex: 0,
      rest: null,
      items: [
        {
          exerciseId: "supino-reto",
          planned: { sets: 1, repsMin: 5, repsMax: 5, loadKg: 80, rir: 2, restSec: 60 },
          sets: [
            { kind: "aquecimento", loadKg: 40, reps: 10, rir: 5, completedAt: 0 },
            { loadKg: 80, reps: 5, rir: 2, completedAt: 0 }
          ],
          skipped: false
        }
      ]
    } as Session;
    const ch = planProgression(session, (id) => EXERCISE_MAP[id]?.equipment);
    expect(ch[0]).toMatchObject({ toKg: 82.5, kind: "subir" });
    const w = { id: "w", name: "T", notes: "", createdAt: 0, updatedAt: 0, exercises: [ex("supino-reto", 80), ex("stiff", 40)] };
    const out = applyProgression(w, ch, 5);
    expect(out.exercises.map((e) => e.loadKg)).toEqual([82.5, 40]);
    expect(out.updatedAt).toBe(5);
  });
});

describe("recordes", () => {
  it("lista o recorde de cada exercício e monta o card", () => {
    const id = useStore.getState().saveWorkout({ id: "", name: "T", notes: "", exercises: [ex("supino-reto", 60)] });
    train(id, [
      [60, 10, 2],
      [60, 10, 2]
    ]);
    train(id, [
      [70, 8, 1],
      [70, 8, 1]
    ]);
    const list = allRecords(useStore.getState().usuario.sessions);
    expect(list[0].exerciseId).toBe("supino-reto");
    expect(list[0].maxLoad!.value).toBe(70);
    const info = recordCardInfo({ exerciseId: "supino-reto", type: "carga", value: 70, previous: 60 }, "Supino reto", 0);
    expect(info.value).toBe("70 kg");
    expect(info.previous).toBe("Antes: 60 kg (+10 kg)");
  });
});

describe("treinos prontos por objetivo", () => {
  it("tem modelos de hipertrofia, força e iniciante com exercícios válidos", () => {
    for (const g of Object.keys(TEMPLATE_GOALS)) expect(TEMPLATES.filter((t) => t.goal === g).length).toBeGreaterThanOrEqual(2);
    for (const t of TEMPLATES)
      for (const d of t.days) for (const [id, sets, min, max] of d.rows) expect(EXERCISE_MAP[id] && sets > 0 && min <= max, `${t.id}/${id}`).toBeTruthy();
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
  });

  it("objetivo força (não iniciante) recebe um modelo de força", () => {
    expect(suggestPlan({ ...DEFAULT_PROFILE, goal: "forca", experience: "intermediario", days: [1, 3, 5] }, 0).templateId).toBe("forca-5x5");
    expect(suggestPlan({ ...DEFAULT_PROFILE, goal: "forca", experience: "avancado", days: [1, 2, 4, 5] }, 0).templateId).toBe("forca-4-dias");
    expect(suggestPlan({ ...DEFAULT_PROFILE, goal: "forca", experience: "iniciante", days: [1, 3, 5] }, 0).templateId).toBe("full-body");
  });
});

describe("comparação de fotos", () => {
  it("calcula a diferença de peso e medidas entre as datas", () => {
    const r = compareDates(
      "2026-09-01",
      "2026-11-01",
      [
        { id: "a", date: "2026-08-30", kg: 80 },
        { id: "b", date: "2026-10-30", kg: 83.5 }
      ],
      [
        { id: "m1", date: "2026-09-01", cm: { braco: 36, cintura: 84 } },
        { id: "m2", date: "2026-11-01", cm: { braco: 38 } }
      ]
    );
    expect(r.days).toBe(61);
    expect(r.rows).toEqual([
      { label: "Peso", from: 80, to: 83.5, unit: "kg" },
      { label: "Braço", from: 36, to: 38, unit: "cm" }
    ]);
  });
});

describe("progressão com treino incompleto", () => {
  it("não sobe a carga se faltaram séries", () => {
    const id = useStore.getState().saveWorkout({ id: "", name: "T", notes: "", exercises: [{ ...ex("supino-reto", 60), sets: 4 }] });
    train(id, [
      [60, 12, 2],
      [60, 12, 2]
    ]);
    const d = useStore.getState().usuario;
    expect(d.workouts[0].exercises[0].loadKg).toBe(60);
    expect(d.sessions[0].progression![0]).toMatchObject({ kind: "manter", toKg: 60 });
  });
});
