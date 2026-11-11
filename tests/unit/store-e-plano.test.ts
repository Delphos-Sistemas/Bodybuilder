import { suggestPlan } from "@/lib/plan";
import { loadHistory } from "@/lib/stats";
import { DEFAULT_PROFILE, emptyDataset, useStore } from "@/lib/store";
import { EXERCISE_MAP } from "@/data/exercises";

beforeEach(() => {
  localStorage.clear();
  useStore.setState({ mode: "usuario", usuario: emptyDataset(), demo: null });
});

describe("armazenamento local", () => {
  it("salva treino, inicia, registra e encerra no histórico", () => {
    const s = useStore.getState();
    const id = s.saveWorkout({
      id: "",
      name: "Meu treino",
      notes: "",
      exercises: [{ uid: "x", exerciseId: "leg-press", sets: 1, repsMin: 10, repsMax: 12, loadKg: 100, rir: 2, restSec: 60 }]
    });
    expect(useStore.getState().usuario.workouts[0].name).toBe("Meu treino");
    expect(useStore.getState().startSession(id)).toBe(true);
    useStore.getState().logSet({ reps: 12, loadKg: 100, rir: 2 });
    const sid = useStore.getState().finish(false);
    const d = useStore.getState().usuario;
    expect(d.activeSession).toBeNull();
    expect(d.sessions[0].id).toBe(sid);
    expect(loadHistory(d.sessions, "leg-press")[0].maxLoad).toBe(100);
    // persistido no localStorage
    expect(localStorage.getItem("bodybuilder:v2")).toContain("Meu treino");
  });

  it("modo demonstração não mistura dados com os do usuário", () => {
    useStore.getState().saveWorkout({ id: "", name: "Real", notes: "", exercises: [] });
    useStore.getState().enterDemo();
    const demo = useStore.getState().demo!;
    expect(demo.workouts.length).toBeGreaterThan(0);
    expect(demo.sessions.length).toBeGreaterThan(0);
    useStore.getState().saveWorkout({ id: "", name: "Criado no demo", notes: "", exercises: [] });
    useStore.getState().exitDemo();
    const user = useStore.getState().usuario;
    expect(user.workouts.map((w) => w.name)).toEqual(["Real"]);
    expect(
      useStore
        .getState()
        .exportData()
        .data.workouts.map((w) => w.name)
    ).toEqual(["Real"]);
  });

  it("duplica treino com novo id", () => {
    const id = useStore.getState().saveWorkout({ id: "", name: "A", notes: "", exercises: [] });
    const copy = useStore.getState().duplicateWorkout(id);
    expect(copy).not.toBe(id);
    expect(useStore.getState().usuario.workouts.map((w) => w.name)).toEqual(["A", "A (cópia)"]);
  });

  it("exporta e importa com validação", () => {
    useStore.getState().saveWorkout({ id: "", name: "Backup", notes: "", exercises: [] });
    const file = JSON.parse(JSON.stringify(useStore.getState().exportData()));
    useStore.getState().clearUserData();
    expect(useStore.getState().usuario.workouts).toHaveLength(0);
    expect(useStore.getState().importData(file)).toEqual({ ok: true });
    expect(useStore.getState().usuario.workouts[0].name).toBe("Backup");
    const bad = useStore.getState().importData({ app: "outro" });
    expect(bad.ok).toBe(false);
    expect(useStore.getState().usuario.workouts[0].name).toBe("Backup");
  });
});

describe("plano sugerido", () => {
  it("escolhe o modelo pelos dias e respeita equipamentos", () => {
    const p = { ...DEFAULT_PROFILE, days: [1, 2, 4, 5], equipment: ["halteres" as const, "peso-corporal" as const] };
    const plan = suggestPlan(p, 0);
    expect(plan.templateId).toBe("upper-lower");
    for (const w of plan.workouts) for (const e of w.exercises) expect(["halteres", "peso-corporal"]).toContain(EXERCISE_MAP[e.exerciseId].equipment);
  });
  it("iniciante com 3 dias recebe Full Body", () => {
    expect(suggestPlan({ ...DEFAULT_PROFILE, days: [1, 3, 5] }, 0).templateId).toBe("full-body");
  });
});
