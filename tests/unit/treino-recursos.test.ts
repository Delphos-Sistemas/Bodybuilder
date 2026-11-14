import { completeSet, createSession, isSessionComplete, nextStep, swapCurrent, dropsPending } from "@/lib/session";
import { smartRest } from "@/lib/smartRest";
import { warmupPlan, needsWarmup } from "@/lib/warmup";
import { substituteOptions } from "@/lib/substitutes";
import { applyPhase, cycleWeek } from "@/lib/periodization";
import { dayStreak, medals, monthGoals, weekStreak } from "@/lib/achievements";
import { diaryInsights } from "@/lib/diary";
import { decodeChallenge, encodeChallenge, mergeEntries, ranking } from "@/lib/challenge";
import { weekSummary } from "@/lib/weekly";
import { EXERCISES, EXERCISE_MAP } from "@/data/exercises";
import { emptyDataset, useStore } from "@/lib/store";
import type { ChallengeEntry, Session, Workout } from "@/lib/types";

const we = (exerciseId: string, extra: Partial<Workout["exercises"][number]> = {}) => ({
  uid: exerciseId,
  exerciseId,
  sets: 2,
  repsMin: 8,
  repsMax: 12,
  loadKg: 40,
  rir: 2,
  restSec: 90,
  ...extra
});
const W = (exercises: Workout["exercises"]): Workout => ({ id: "w", name: "T", notes: "", createdAt: 0, updatedAt: 0, exercises });
const set = { loadKg: 40, reps: 10, rir: 2 };

describe("supersérie", () => {
  it("alterna A → B sem descanso e descansa no fim da rodada", () => {
    let s = createSession(W([we("supino-reto", { superset: true }), we("remada-curvada", { restSec: 60 }), we("rosca-direta")]), 0);
    expect(nextStep(s)).toBe("troca");
    s = completeSet(s, set, 1);
    expect(s.currentIndex).toBe(1);
    expect(s.rest).toBeNull();
    expect(nextStep(s)).toBe("rodada");
    s = completeSet(s, set, 2);
    expect(s.currentIndex).toBe(0);
    expect(s.rest?.endsAt).toBe(2 + 60_000);
    s = completeSet(s, set, 3);
    expect(s.currentIndex).toBe(1);
    s = completeSet(s, set, 4);
    // grupo terminou: segue para a rosca com descanso
    expect(s.currentIndex).toBe(2);
    expect(s.rest).not.toBeNull();
  });
});

describe("drop set planejado", () => {
  it("depois da última série vem o drop sem descanso; o descanso vem no fim dos drops", () => {
    let s = createSession(W([we("rosca-direta", { sets: 1, drops: 2 }), we("triceps-polia")]), 0);
    expect(nextStep(s)).toBe("drop");
    s = completeSet(s, set, 1);
    expect(s.rest).toBeNull();
    expect(dropsPending(s.items[0])).toBe(2);
    s = completeSet(s, { ...set, kind: "drop" }, 2);
    expect(s.currentIndex).toBe(0);
    expect(nextStep(s)).toBe("proximo");
    s = completeSet(s, { ...set, kind: "drop" }, 3);
    expect(s.currentIndex).toBe(1);
    expect(s.rest).not.toBeNull();
  });
});

describe("descanso inteligente", () => {
  const supino = EXERCISE_MAP["supino-reto"];
  const elev = EXERCISE_MAP["elevacao-lateral"];
  const planned = { restSec: 90, repsMin: 8, repsMax: 12, rir: 2 };
  it("aumenta em série pesada de multiarticular e até a falha", () => {
    const r = smartRest(planned, supino, { reps: 4, rir: 0, loadKg: 100 });
    expect(r.sec).toBe(180);
    expect(r.reason).toBe("+90 s: carga pesada e falha");
  });
  it("diminui em isolado com repetições altas, sem passar de 30 s", () => {
    expect(smartRest({ ...planned, restSec: 45 }, elev, { reps: 15, rir: 2, loadKg: 8 }).sec).toBe(30);
  });
  it("mantém quando nada muda", () => {
    expect(smartRest(planned, supino, { reps: 10, rir: 2, loadKg: 60 })).toEqual({ sec: 90 });
  });
  it("a loja usa o descanso ajustado e guarda o motivo", () => {
    useStore.setState({ mode: "usuario", usuario: emptyDataset(), demo: null, settings: { audioEnabled: false, vibration: true, alertVolume: 0.7 } });
    const id = useStore.getState().saveWorkout({ id: "", name: "A", notes: "", exercises: [we("supino-reto", { sets: 3 })] });
    useStore.getState().startSession(id);
    useStore.getState().logSet({ loadKg: 100, reps: 3, rir: 0 });
    const rest = useStore.getState().usuario.activeSession!.rest!;
    expect(rest.endsAt - rest.startedAt).toBe(180_000);
    expect(rest.reason).toMatch(/^\+90 s/);
  });
});

describe("aquecimento", () => {
  it("monta cargas crescentes abaixo da carga de trabalho, nunca abaixo da barra", () => {
    expect(warmupPlan(100, "barra")).toEqual([
      { kg: 40, reps: 8, pct: 0.4 },
      { kg: 60, reps: 5, pct: 0.6 },
      { kg: 80, reps: 3, pct: 0.8 }
    ]);
    expect(warmupPlan(40, "barra").every((w) => w.kg >= 20 && w.kg < 40)).toBe(true);
    expect(warmupPlan(20, "barra")).toEqual([]);
    expect(warmupPlan(30, "peso-corporal")).toEqual([]);
  });
  it("só no primeiro exercício do músculo na sessão", () => {
    let s = createSession(W([we("supino-reto"), we("supino-inclinado-halteres")]), 0);
    expect(needsWarmup(s, EXERCISE_MAP["supino-reto"], EXERCISE_MAP)).toBe(true);
    s = completeSet(completeSet(s, set, 1), set, 2);
    expect(needsWarmup(s, EXERCISE_MAP["supino-inclinado-halteres"], EXERCISE_MAP)).toBe(false);
  });
});

describe("substituir exercício", () => {
  it("sugere primeiro os indicados na ficha e respeita os equipamentos", () => {
    const opts = substituteOptions(EXERCISE_MAP["supino-reto"], EXERCISES, ["halteres", "peso-corporal"]);
    expect(opts[0].id).toBe("supino-reto-halteres");
    expect(opts.every((o) => ["halteres", "peso-corporal"].includes(o.equipment))).toBe(true);
    expect(opts.every((o) => o.primary === "peito" || EXERCISE_MAP["supino-reto"].substitutions.includes(o.id))).toBe(true);
  });
  it("troca na sessão e, se pedido, na ficha", () => {
    useStore.setState({ mode: "usuario", usuario: emptyDataset(), demo: null, settings: { audioEnabled: false, vibration: true, alertVolume: 0.7 } });
    const id = useStore.getState().saveWorkout({ id: "", name: "A", notes: "", exercises: [we("supino-reto"), we("remada-curvada")] });
    useStore.getState().startSession(id);
    useStore.getState().swapExercise("supino-reto-halteres", true);
    const st = useStore.getState().usuario;
    expect(st.activeSession!.items[0]).toMatchObject({ exerciseId: "supino-reto-halteres", swappedFrom: "supino-reto" });
    expect(st.workouts[0].exercises[0].exerciseId).toBe("supino-reto-halteres");
    expect(swapCurrent(completeSet(st.activeSession!, set, 1), "crossover").items[0].exerciseId).toBe("supino-reto-halteres");
  });
});

describe("periodização", () => {
  const w = W([we("supino-reto", { sets: 4, loadKg: 100, repsMin: 8, repsMax: 10, rir: 2 })]);
  it("conta as semanas do ciclo a partir da semana de início", () => {
    const start = "2026-11-02"; // segunda
    expect(cycleWeek(start, new Date("2026-11-04T10:00:00").getTime())).toBe(0);
    expect(cycleWeek(start, new Date("2026-11-10T10:00:00").getTime())).toBe(1);
    expect(cycleWeek(start, new Date("2026-11-29T10:00:00").getTime())).toBe(3);
    expect(cycleWeek(start, new Date("2026-11-30T10:00:00").getTime())).toBe(0);
  });
  it("ajusta séries e cargas por semana sem mudar a ficha", () => {
    expect(applyPhase(w, "volume").exercises[0].sets).toBe(5);
    expect(applyPhase(w, "pesada").exercises[0]).toMatchObject({ loadKg: 105, repsMin: 6, repsMax: 8, rir: 1 });
    expect(applyPhase(w, "alivio").exercises[0]).toMatchObject({ sets: 2, loadKg: 90, rir: 4 });
    expect(w.exercises[0].sets).toBe(4);
  });
  it("na semana de alívio a progressão não mexe na ficha", () => {
    useStore.setState({
      mode: "usuario",
      usuario: emptyDataset(),
      demo: null,
      settings: { audioEnabled: false, vibration: true, alertVolume: 0.7, periodization: { on: true, start: "2000-01-03" } }
    });
    // 2000-01-03 + 3 semanas = alívio em 2000-01-24
    vi.setSystemTime(new Date("2000-01-25T10:00:00"));
    const id = useStore.getState().saveWorkout({ id: "", name: "A", notes: "", exercises: [we("supino-reto", { sets: 2, loadKg: 100 })] });
    useStore.getState().startSession(id);
    expect(useStore.getState().usuario.activeSession!.phase).toBe("alivio");
    expect(useStore.getState().usuario.activeSession!.items[0].planned).toMatchObject({ sets: 1, loadKg: 90 });
    useStore.getState().logSet({ loadKg: 90, reps: 15, rir: 4 });
    useStore.getState().finish(false);
    expect(useStore.getState().usuario.workouts[0].exercises[0].loadKg).toBe(100);
    vi.useRealTimers();
  });
});

function sess(id: string, start: string, extra: Partial<Session> = {}, load = 50): Session {
  const t = new Date(start).getTime();
  return {
    id,
    workoutId: "w",
    workoutName: "T",
    startedAt: t,
    endedAt: t + 3_600_000,
    currentIndex: 0,
    rest: null,
    items: [
      {
        exerciseId: "supino-reto",
        planned: { sets: 1, repsMin: 8, repsMax: 10, loadKg: load, rir: 2, restSec: 60 },
        sets: [{ loadKg: load, reps: 10, rir: 2, completedAt: t }],
        skipped: false
      }
    ],
    ...extra
  };
}

describe("conquistas", () => {
  const now = new Date("2026-11-13T12:00:00").getTime(); // sexta
  const list = [
    sess("a", "2026-10-20T08:00:00"),
    sess("b", "2026-10-22T08:00:00"),
    sess("c", "2026-10-27T08:00:00"),
    sess("d", "2026-10-29T06:30:00"),
    sess("e", "2026-11-03T08:00:00", {}, 60),
    sess("f", "2026-11-05T08:00:00", {}, 60),
    sess("g", "2026-11-12T08:00:00"),
    sess("h", "2026-11-13T08:00:00")
  ].reverse();
  it("sequência de semanas batendo a meta (inclui a atual)", () => {
    expect(weekStreak(list, 2, now)).toEqual({ current: 4, best: 4 });
    expect(weekStreak(list, 3, now)).toEqual({ current: 0, best: 0 });
  });
  it("dias seguidos", () => {
    expect(dayStreak(list, now)).toBe(2);
  });
  it("medalhas com data de conquista", () => {
    const m = medals(list, 2, now);
    expect(m.find((x) => x.id === "treinos-1")!.achievedAt).toBe(new Date("2026-10-20T08:00:00").getTime());
    expect(m.find((x) => x.id === "cedo")!.achievedAt).toBe(new Date("2026-10-29T06:30:00").getTime());
    expect(m.find((x) => x.id === "sem-4")!.achievedAt).toBeDefined();
    expect(m.find((x) => x.id === "rec-1")!.achievedAt).toBe(new Date("2026-11-03T08:00:00").getTime());
    expect(m.find((x) => x.id === "treinos-10")!.progressText).toBe("8 de 10 treinos");
  });
  it("metas do mês", () => {
    const g = monthGoals(list, 2, now);
    expect(g.treinos).toEqual({ value: 4, target: 9 });
    expect(g.recordes).toBe(2); // carga e 1RM estimado
  });
  it("resumo da semana", () => {
    const w = weekSummary(list, 2, now);
    expect(w.treinos).toBe(2);
    expect(w.dias).toEqual([false, false, false, true, true, false, false]);
    expect(w.sequencia).toBe(4);
  });
});

describe("diário", () => {
  it("compara o volume com sono bom e ruim", () => {
    const list = [
      sess("a", "2026-11-01T08:00:00", { diary: { sono: 5 } }, 60),
      sess("b", "2026-11-02T08:00:00", { diary: { sono: 4 } }, 60),
      sess("c", "2026-11-03T08:00:00", { diary: { sono: 1 } }, 40),
      sess("d", "2026-11-04T08:00:00", { diary: { sono: 2 } }, 40)
    ];
    const ins = diaryInsights(list);
    expect(ins).toHaveLength(1);
    expect(ins[0]).toMatchObject({ key: "sono", diffPct: 50 });
    expect(ins[0].text).toContain("dormir bem");
  });
});

describe("desafio por link", () => {
  const e = (id: string, nome: string, treinos: number, em: number): ChallengeEntry => ({
    id,
    nome,
    mes: "2026-11",
    treinos,
    volume: 1000,
    series: 10,
    recordes: 0,
    em
  });
  it("codifica e lê o link, validando os dados", () => {
    const code = encodeChallenge("treinos", [e("d_abcd1", "Barretão", 5, 1), e("d_efgh2", "Zé", 7, 2)]);
    const back = decodeChallenge(code)!;
    expect(back.kind).toBe("treinos");
    expect(back.entries.map((x) => x.nome)).toEqual(["Barretão", "Zé"]);
    expect(decodeChallenge("lixo")).toBeNull();
  });
  it("fica a versão mais nova de cada pessoa e ordena o ranking", () => {
    const m = mergeEntries([e("d_abcd1", "A", 3, 1)], [e("d_abcd1", "A", 6, 5), e("d_efgh2", "B", 4, 2), { ...e("d_ijkl3", "C", 9, 3), mes: "2026-10" }]);
    expect(m.find((x) => x.id === "d_abcd1")!.treinos).toBe(6);
    const r = ranking(m, "treinos", "2026-11");
    expect(r.map((x) => x.nome)).toEqual(["A", "B", "C"]);
    expect(r[2]).toMatchObject({ atual: false, valor: 0 });
  });
});

it("treino com supersérie termina", () => {
  let s = createSession(W([we("supino-reto", { sets: 1, superset: true }), we("remada-curvada", { sets: 1 })]), 0);
  s = completeSet(s, set, 1);
  s = completeSet(s, set, 2);
  expect(isSessionComplete(s)).toBe(true);
});
