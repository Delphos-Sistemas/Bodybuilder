import type { Recipe } from "@/data/recipes";
import type { BodyWeight, Nutrition, NutritionDay, ShoppingItem } from "./types";
import { uid } from "./id";

/** Valor de referência comum para quem treina força (1,6 a 2,2 g/kg); não é prescrição. */
export const DEFAULT_PROTEIN_PER_KG = 1.8;
export const PROTEIN_PER_KG_RANGE = { min: 1.2, max: 2.4 } as const;
/** Referência prática de 35 ml por kg; sem peso, 2,5 litros. */
export const WATER_ML_PER_KG = 35;
export const DEFAULT_WATER_ML = 2500;

export const EMPTY_DAY: NutritionDay = { proteinG: 0, waterMl: 0, updatedAt: 0 };

export function latestWeightKg(weights: BodyWeight[]): number | null {
  if (!weights.length) return null;
  return [...weights].sort((a, b) => b.date.localeCompare(a.date))[0].kg;
}

export type Goals = {
  proteinG: number | null;
  waterMl: number;
  /** de onde veio a meta de proteína */
  proteinSource: "manual" | "peso" | "sem-peso";
  waterSource: "manual" | "peso" | "padrao";
  perKg: number;
};

export function dailyGoals(n: Nutrition | undefined, weights: BodyWeight[]): Goals {
  const kg = latestWeightKg(weights);
  const perKg = n?.proteinPerKg ?? DEFAULT_PROTEIN_PER_KG;
  let proteinG: number | null = null;
  let proteinSource: Goals["proteinSource"] = "sem-peso";
  if (n?.proteinGoalG) {
    proteinG = n.proteinGoalG;
    proteinSource = "manual";
  } else if (kg) {
    proteinG = Math.round((kg * perKg) / 5) * 5;
    proteinSource = "peso";
  }
  let waterMl = DEFAULT_WATER_ML;
  let waterSource: Goals["waterSource"] = "padrao";
  if (n?.waterGoalMl) {
    waterMl = n.waterGoalMl;
    waterSource = "manual";
  } else if (kg) {
    waterMl = Math.round((kg * WATER_ML_PER_KG) / 250) * 250;
    waterSource = "peso";
  }
  return { proteinG, waterMl, proteinSource, waterSource, perKg };
}

export function dayOf(n: Nutrition | undefined, date: string): NutritionDay {
  return n?.days[date] ?? EMPTY_DAY;
}

/** Soma (ou subtrai) ao dia, sem deixar negativo. */
export function bumpDay(day: NutritionDay, delta: { proteinG?: number; waterMl?: number }, now = Date.now()): NutritionDay {
  return {
    ...day,
    proteinG: Math.max(0, Math.min(1000, day.proteinG + (delta.proteinG ?? 0))),
    waterMl: Math.max(0, Math.min(20000, day.waterMl + (delta.waterMl ?? 0))),
    updatedAt: now
  };
}

/** Dias seguidos, até hoje (ou ontem, se hoje ainda não foi marcado), em que a pessoa seguiu o próprio plano. */
export function onPlanStreak(n: Nutrition | undefined, today: string): number {
  if (!n) return 0;
  const d = new Date(`${today}T12:00:00`);
  if (!n.days[today]?.onPlan) d.setDate(d.getDate() - 1);
  let count = 0;
  for (;;) {
    const key = isoOf(d);
    if (!n.days[key]?.onPlan) return count;
    count++;
    d.setDate(d.getDate() - 1);
  }
}

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Junta metas e dias de dois aparelhos: em cada dia vale o registro mais recente. */
export function mergeNutrition(a: Nutrition | undefined, b: Nutrition | undefined): Nutrition | undefined {
  if (!a) return b;
  if (!b) return a;
  const goals = (a.goalsUpdatedAt ?? 0) >= (b.goalsUpdatedAt ?? 0) ? a : b;
  const days: Record<string, NutritionDay> = { ...b.days };
  for (const [k, v] of Object.entries(a.days)) if (!days[k] || v.updatedAt >= days[k].updatedAt) days[k] = v;
  return {
    proteinPerKg: goals.proteinPerKg,
    proteinGoalG: goals.proteinGoalG,
    waterGoalMl: goals.waterGoalMl,
    goalsUpdatedAt: goals.goalsUpdatedAt,
    days
  };
}

// ---------- lista de compras ----------

export const normalizeItem = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const SIMPLE_QTY =
  /^(\d+(?:[.,]\d+)?|\d+\/\d+)\s+(g|kg|ml|l|unidades?|latas?|fatias?|doses?|colheres de sopa|colheres de chá|colher de sopa|colher de chá|xícaras?|dentes|folhas)$/i;

function parseQty(q: string): { n: number; unit: string } | null {
  // "1 dose (30 g)" soma como "1 dose"; o detalhe entre parênteses fica de fora
  const m = q
    .trim()
    .replace(/\s*\(.*\)$/, "")
    .match(SIMPLE_QTY);
  if (!m) return null;
  const n = m[1].includes("/") ? Number(m[1].split("/")[0]) / Number(m[1].split("/")[1]) : Number(m[1].replace(",", "."));
  return Number.isFinite(n) ? { n, unit: canonicalUnit(m[2].toLowerCase()) } : null;
}

function canonicalUnit(u: string): string {
  if (u.startsWith("unidade")) return "unidade";
  if (u.startsWith("lata")) return "lata";
  if (u.startsWith("fatia")) return "fatia";
  if (u.startsWith("dose")) return "dose";
  if (u.startsWith("xícara")) return "xícara";
  if (u.startsWith("colher") && u.endsWith("sopa")) return "colher de sopa";
  if (u.startsWith("colher")) return "colher de chá";
  if (u === "dentes") return "dente";
  if (u === "folhas") return "folha";
  return u;
}

const PLURAL: Record<string, string> = {
  unidade: "unidades",
  lata: "latas",
  fatia: "fatias",
  dose: "doses",
  xícara: "xícaras",
  "colher de sopa": "colheres de sopa",
  "colher de chá": "colheres de chá",
  dente: "dentes",
  folha: "folhas"
};

function formatQty(n: number, unit: string): string {
  const value = Number.isInteger(n) ? String(n) : n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return `${value} ${n > 1 && PLURAL[unit] ? PLURAL[unit] : unit}`;
}

/** Soma duas quantidades quando a unidade é a mesma ("100 g" + "150 g" = "250 g"); senão junta com "+". */
export function combineQty(a: string | undefined, b: string): string {
  if (!a) return b;
  const x = parseQty(a);
  const y = parseQty(b);
  if (x && y && x.unit === y.unit) return formatQty(x.n + y.n, x.unit);
  return `${a} + ${b}`;
}

const SKIP_QTY = /^(a gosto|à vontade|1 pitada)$/i;

/**
 * Adiciona os ingredientes de uma receita à lista. Um item que já está na lista (e ainda não foi comprado)
 * tem a quantidade somada, em vez de aparecer duas vezes.
 */
export function addRecipeToList(list: ShoppingItem[], recipe: Recipe, now = Date.now()): { list: ShoppingItem[]; added: number } {
  const out = list.map((x) => ({ ...x }));
  let added = 0;
  for (const ing of recipe.ingredients) {
    const qtd = SKIP_QTY.test(ing.qtd.trim()) ? undefined : ing.qtd;
    const same = out.find((x) => !x.done && normalizeItem(x.text) === normalizeItem(ing.item));
    if (same) {
      if (qtd) same.qtd = combineQty(same.qtd, qtd);
      same.updatedAt = now;
      continue;
    }
    out.push({ id: uid("sh_"), text: ing.item, qtd, done: false, recipeId: recipe.id, updatedAt: now });
    added++;
  }
  return { list: out, added };
}
