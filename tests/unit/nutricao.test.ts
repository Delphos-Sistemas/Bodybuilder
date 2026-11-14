import { describe, expect, it } from "vitest";
import { RECIPES, RECIPE_MAP, RECIPE_TAGS } from "@/data/recipes";
import { addRecipeToList, bumpDay, combineQty, dailyGoals, mergeNutrition, onPlanStreak } from "@/lib/nutrition";
import { datasetSchema } from "@/lib/schemas";
import { mergeDatasets } from "@/lib/sync";
import { emptyDataset } from "@/lib/store";
import type { Dataset, ShoppingItem } from "@/lib/types";

describe("metas de proteína e água", () => {
  it("usa o peso mais recente e 1,8 g/kg por padrão, arredondando de 5 em 5", () => {
    const g = dailyGoals(undefined, [
      { id: "a", date: "2026-01-01", kg: 90 },
      { id: "b", date: "2026-03-01", kg: 80 }
    ]);
    expect(g.proteinG).toBe(145);
    expect(g.proteinSource).toBe("peso");
    expect(g.waterMl).toBe(2750);
  });
  it("sem peso não inventa meta de proteína e usa 2,5 L de água", () => {
    const g = dailyGoals(undefined, []);
    expect(g.proteinG).toBeNull();
    expect(g.waterMl).toBe(2500);
  });
  it("meta manual vence o cálculo", () => {
    const g = dailyGoals({ proteinGoalG: 160, waterGoalMl: 3000, days: {} }, [{ id: "a", date: "2026-01-01", kg: 70 }]);
    expect(g).toMatchObject({ proteinG: 160, waterMl: 3000, proteinSource: "manual", waterSource: "manual" });
  });
  it("registro não fica negativo", () => {
    expect(bumpDay({ proteinG: 5, waterMl: 0, updatedAt: 0 }, { proteinG: -10, waterMl: -250 }, 1)).toEqual({ proteinG: 0, waterMl: 0, updatedAt: 1 });
  });
});

describe("sequência no plano", () => {
  const days = (keys: string[]) => ({ days: Object.fromEntries(keys.map((k) => [k, { proteinG: 0, waterMl: 0, onPlan: true, updatedAt: 1 }])) });
  it("conta até hoje, ou até ontem se hoje ainda não foi marcado", () => {
    expect(onPlanStreak(days(["2026-11-09", "2026-11-10", "2026-11-11"]), "2026-11-11")).toBe(3);
    expect(onPlanStreak(days(["2026-11-09", "2026-11-10"]), "2026-11-11")).toBe(2);
    expect(onPlanStreak(days(["2026-11-08", "2026-11-10"]), "2026-11-11")).toBe(1);
    expect(onPlanStreak(undefined, "2026-11-11")).toBe(0);
  });
  it("atravessa a virada do mês", () => {
    expect(onPlanStreak(days(["2026-10-31", "2026-11-01"]), "2026-11-01")).toBe(2);
  });
});

describe("lista de compras", () => {
  it("soma quantidades com a mesma unidade e junta as diferentes", () => {
    expect(combineQty("100 g", "150 g")).toBe("250 g");
    expect(combineQty("1 unidade", "2 unidades")).toBe("3 unidades");
    expect(combineQty("1/2 unidade", "1/2 unidade")).toBe("1 unidade");
    expect(combineQty("100 g", "1 lata")).toBe("100 g + 1 lata");
    expect(combineQty(undefined, "1 lata")).toBe("1 lata");
    expect(combineQty("1 dose (30 g)", "1/2 dose (15 g)")).toBe("1,5 doses");
  });
  it("não duplica item que já está na lista e ignora quantidades vagas", () => {
    const r = RECIPE_MAP["panqueca-banana-aveia"];
    const first = addRecipeToList([], r, 1);
    expect(first.added).toBe(r.ingredients.length);
    const second = addRecipeToList(first.list, r, 2);
    expect(second.added).toBe(0);
    expect(second.list.find((x) => x.text === "Ovos")?.qtd).toBe("4 unidades");
    const withSalt = addRecipeToList([], { ...r, ingredients: [{ item: "Sal", qtd: "a gosto" }] });
    expect(withSalt.list[0].qtd).toBeUndefined();
  });
  it("item já comprado não recebe soma: entra de novo", () => {
    const r = RECIPE_MAP["panqueca-banana-aveia"];
    const bought: ShoppingItem[] = addRecipeToList([], r, 1).list.map((x) => ({ ...x, done: true }));
    expect(addRecipeToList(bought, r).added).toBe(r.ingredients.length);
  });
});

describe("receitas", () => {
  it("são entre 20 e 30, com ids únicos, tags conhecidas e valores plausíveis", () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(20);
    expect(RECIPES.length).toBeLessThanOrEqual(30);
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
    for (const r of RECIPES) {
      expect(r.tags.every((t) => t in RECIPE_TAGS)).toBe(true);
      expect(r.ingredients.length).toBeGreaterThan(0);
      expect(r.steps.length).toBeGreaterThan(0);
      // proteína (4 kcal/g) nunca passa das calorias totais
      expect(r.proteinG * 4).toBeLessThan(r.kcal);
      expect(r.proteinG).toBeGreaterThanOrEqual(15);
    }
  });
});

describe("sincronização da nutrição", () => {
  it("em cada dia vale o registro mais recente; metas pela data de alteração", () => {
    const a = {
      proteinGoalG: 150,
      goalsUpdatedAt: 10,
      days: { "2026-11-10": { proteinG: 50, waterMl: 0, updatedAt: 5 }, "2026-11-11": { proteinG: 20, waterMl: 0, updatedAt: 9 } }
    };
    const b = { proteinGoalG: 170, goalsUpdatedAt: 20, days: { "2026-11-10": { proteinG: 80, waterMl: 500, updatedAt: 8 } } };
    const m = mergeNutrition(a, b)!;
    expect(m.proteinGoalG).toBe(170);
    expect(m.days["2026-11-10"].proteinG).toBe(80);
    expect(m.days["2026-11-11"].proteinG).toBe(20);
  });
  it("itens apagados da lista não voltam e o mais recente vence", () => {
    const item = (id: string, done: boolean, updatedAt: number): ShoppingItem => ({ id, text: id, done, updatedAt });
    const local: Dataset = { ...emptyDataset(), shoppingList: [item("x", true, 5), item("y", false, 1)], tombstones: { z: 3 } };
    const remote: Dataset = { ...emptyDataset(), shoppingList: [item("x", false, 2), item("z", false, 1), item("w", false, 1)] };
    const m = mergeDatasets(local, remote);
    expect(m.shoppingList?.map((x) => [x.id, x.done])).toEqual([
      ["x", true],
      ["y", false],
      ["w", false]
    ]);
  });
  it("o esquema aceita os novos dados", () => {
    const d: Dataset = {
      ...emptyDataset(),
      nutrition: { proteinPerKg: 2, days: { "2026-11-11": { proteinG: 40, waterMl: 750, onPlan: true, updatedAt: 1 } } },
      shoppingList: [{ id: "s", text: "Ovos", qtd: "12 unidades", done: false, updatedAt: 1 }]
    };
    expect(datasetSchema.safeParse(d).success).toBe(true);
  });
});
