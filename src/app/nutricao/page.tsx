"use client";

import clsx from "clsx";
import { Check, Clock, Copy, Droplet, Flame, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, EmptyState, PageHeader, ProgressBar, Toggle } from "@/components/ui";
import { RECIPE_TAGS, RECIPES, type Recipe, type RecipeTag } from "@/data/recipes";
import { dailyGoals, dayOf, normalizeItem, onPlanStreak, PROTEIN_PER_KG_RANGE } from "@/lib/nutrition";
import { useData, useStore } from "@/lib/store";
import { todayISO } from "@/lib/time";

const TABS = [
  { id: "hoje", label: "Hoje" },
  { id: "receitas", label: "Receitas" },
  { id: "compras", label: "Compras" }
] as const;
type Tab = (typeof TABS)[number]["id"];

const n0 = (v: number) => v.toLocaleString("pt-BR");

export default function NutricaoPage() {
  const [tab, setTab] = useState<Tab>("hoje");
  const pending = (useData().shoppingList ?? []).filter((x) => !x.done).length;

  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (TABS.some((t) => t.id === h)) setTab(h as Tab);
  }, []);
  const choose = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
  };

  return (
    <div>
      <PageHeader eyebrow="Alimentação leve" title="Nutrição" />
      <div role="tablist" aria-label="Seções de nutrição" className="mb-5 grid grid-cols-3 gap-1 rounded-2xl border border-line bg-graphite p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`aba-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`painel-${t.id}`}
            onClick={() => choose(t.id)}
            className={clsx("min-h-11 rounded-xl text-sm font-semibold", tab === t.id ? "bg-steel text-bronze-light" : "text-sand")}
          >
            {t.label}
            {t.id === "compras" && pending > 0 && <span className="ml-1.5 rounded-full bg-bronze px-1.5 text-xs text-iron">{pending}</span>}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`painel-${tab}`} aria-labelledby={`aba-${tab}`}>
        {tab === "hoje" && <Today />}
        {tab === "receitas" && <Recipes onOpenList={() => choose("compras")} />}
        {tab === "compras" && <Shopping onOpenRecipes={() => choose("receitas")} />}
      </div>
      <p className="mt-8 text-xs leading-relaxed text-muted">
        As metas e os valores das receitas são aproximados e servem como referência para o dia a dia de quem treina. Não substituem a orientação de um
        nutricionista ou médico, principalmente se você tem alguma condição de saúde, está gestante ou tem restrições alimentares.
      </p>
    </div>
  );
}

// ---------------- Hoje ----------------

function Today() {
  const data = useData();
  const log = useStore((s) => s.logNutrition);
  const setDay = useStore((s) => s.setNutritionDay);
  const today = todayISO();
  const day = dayOf(data.nutrition, today);
  const goals = dailyGoals(data.nutrition, data.bodyWeights);
  const streak = onPlanStreak(data.nutrition, today);
  const last7 = useMemo(() => {
    const out: { key: string; label: string; onPlan: boolean; protein: number }[] = [];
    const d = new Date(`${today}T12:00:00`);
    for (let i = 6; i >= 0; i--) {
      const x = new Date(d);
      x.setDate(d.getDate() - i);
      const key = todayISO(x.getTime());
      const rec = data.nutrition?.days[key];
      out.push({
        key,
        label: x.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        onPlan: !!rec?.onPlan,
        protein: rec?.proteinG ?? 0
      });
    }
    return out;
  }, [data.nutrition, today]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card aria-labelledby="proteina-titulo" data-testid="proteina">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 id="proteina-titulo" className="flex items-center gap-2 font-display text-xl font-bold">
            <Flame size={20} className="text-bronze-light" aria-hidden /> Proteína
          </h2>
          <p className="tabular-nums text-sand">
            <strong className="text-2xl text-parchment" data-testid="proteina-valor">
              {n0(day.proteinG)}
            </strong>
            {goals.proteinG ? ` de ${n0(goals.proteinG)} g` : " g"}
          </p>
        </div>
        {goals.proteinG ? (
          <ProgressBar value={day.proteinG / goals.proteinG} label="Proteína de hoje em relação à meta" />
        ) : (
          <p className="text-sm text-muted">
            Registre seu peso em{" "}
            <Link href="/evolucao" className="text-bronze-light underline">
              Evolução
            </Link>{" "}
            ou defina uma meta abaixo para ver o progresso.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {[10, 25, 40].map((g) => (
            <button key={g} type="button" className="btn-secondary min-h-11 px-3" onClick={() => log(today, { proteinG: g })}>
              +{g} g
            </button>
          ))}
          <button
            type="button"
            className="btn-ghost min-h-11 px-3"
            disabled={day.proteinG === 0}
            onClick={() => log(today, { proteinG: -10 })}
            aria-label="Tirar 10 g de proteína"
          >
            −10 g
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">
          Para ter uma ideia: 1 ovo ≈ 6 g · 100 g de frango cozido ≈ 31 g · 1 pote de iogurte grego ≈ 10 g · 1 dose de whey ≈ 24 g.
        </p>
      </Card>

      <Card aria-labelledby="agua-titulo" data-testid="agua">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 id="agua-titulo" className="flex items-center gap-2 font-display text-xl font-bold">
            <Droplet size={20} className="text-bronze-light" aria-hidden /> Água
          </h2>
          <p className="tabular-nums text-sand">
            <strong className="text-2xl text-parchment" data-testid="agua-valor">
              {n0(day.waterMl)}
            </strong>{" "}
            de {n0(goals.waterMl)} ml
          </p>
        </div>
        <ProgressBar value={day.waterMl / goals.waterMl} label="Água de hoje em relação à meta" />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-secondary min-h-11 px-3" onClick={() => log(today, { waterMl: 250 })}>
            +250 ml <span className="text-xs text-muted">copo</span>
          </button>
          <button type="button" className="btn-secondary min-h-11 px-3" onClick={() => log(today, { waterMl: 500 })}>
            +500 ml <span className="text-xs text-muted">garrafa</span>
          </button>
          <button
            type="button"
            className="btn-ghost min-h-11 px-3"
            disabled={day.waterMl === 0}
            onClick={() => log(today, { waterMl: -250 })}
            aria-label="Tirar 250 ml de água"
          >
            −250 ml
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">Em dias quentes ou de treino longo, a necessidade costuma ser maior.</p>
      </Card>

      <Card aria-labelledby="plano-titulo">
        <h2 id="plano-titulo" className="font-display text-xl font-bold">
          Seu plano
        </h2>
        <Toggle
          id="segui-plano"
          label="Segui meu plano hoje"
          description="Marque se comeu como planejou (seu plano ou o do seu nutricionista). Aparece no calendário do histórico."
          checked={!!day.onPlan}
          onChange={(v) => setDay(today, { onPlan: v })}
        />
        {streak > 1 && (
          <p className="mt-1 text-sm text-ok" data-testid="sequencia">
            {streak} dias seguidos no plano.
          </p>
        )}
        <ol className="mt-3 grid grid-cols-7 gap-1 text-center text-xs" aria-label="Últimos 7 dias">
          {last7.map((d) => (
            <li
              key={d.key}
              className={clsx("rounded-lg py-2", d.onPlan ? "bg-ok/20 text-ok" : "bg-iron text-muted", d.key === today && "ring-1 ring-bronze-light")}
              aria-label={`${d.label}: ${d.onPlan ? "seguiu o plano" : "sem marcação"}, ${d.protein} g de proteína`}
            >
              <span className="block capitalize">{d.label}</span>
              <span className="mt-1 block h-4">{d.onPlan ? <Check size={14} className="mx-auto" aria-hidden /> : "·"}</span>
            </li>
          ))}
        </ol>
      </Card>

      <GoalsEditor />
    </div>
  );
}

function GoalsEditor() {
  const data = useData();
  const save = useStore((s) => s.setNutritionGoals);
  const goals = dailyGoals(data.nutrition, data.bodyWeights);
  const n = data.nutrition;
  const [perKg, setPerKg] = useState(String(n?.proteinPerKg ?? goals.perKg).replace(".", ","));
  const [manualProtein, setManualProtein] = useState(n?.proteinGoalG ? String(n.proteinGoalG) : "");
  const [water, setWater] = useState(n?.waterGoalMl ? String(n.waterGoalMl) : "");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const pk = Number(perKg.replace(",", "."));
    const pg = manualProtein ? Number(manualProtein) : undefined;
    const wm = water ? Number(water) : undefined;
    if (!Number.isFinite(pk) || pk < PROTEIN_PER_KG_RANGE.min || pk > PROTEIN_PER_KG_RANGE.max) {
      return setErr(`Use um valor entre ${n0(PROTEIN_PER_KG_RANGE.min)} e ${n0(PROTEIN_PER_KG_RANGE.max)} g por kg.`);
    }
    if (pg !== undefined && (!Number.isFinite(pg) || pg < 20 || pg > 400)) return setErr("A meta de proteína deve ficar entre 20 e 400 g.");
    if (wm !== undefined && (!Number.isFinite(wm) || wm < 500 || wm > 8000)) return setErr("A meta de água deve ficar entre 500 e 8.000 ml.");
    setErr("");
    save({ proteinPerKg: pk, proteinGoalG: pg, waterGoalMl: wm });
    setMsg("Metas salvas.");
  };

  const source =
    goals.proteinSource === "manual"
      ? "meta definida por você"
      : goals.proteinSource === "peso"
        ? `${n0(goals.perKg)} g por kg do seu peso mais recente`
        : "registre seu peso para calcular";

  return (
    <Card aria-labelledby="metas-titulo">
      <h2 id="metas-titulo" className="font-display text-xl font-bold">
        Metas
      </h2>
      <p className="mt-1 text-sm text-muted">
        Proteína: {goals.proteinG ? `${n0(goals.proteinG)} g` : "sem meta"} ({source}). Água: {n0(goals.waterMl)} ml (
        {goals.waterSource === "manual" ? "meta definida por você" : goals.waterSource === "peso" ? "35 ml por kg" : "referência padrão"}).
      </p>
      <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="meta-gkg" className="label">
            Proteína por kg
          </label>
          <input id="meta-gkg" className="input" inputMode="decimal" value={perKg} onChange={(e) => setPerKg(e.target.value)} />
        </div>
        <div>
          <label htmlFor="meta-proteina" className="label">
            Ou meta fixa (g)
          </label>
          <input
            id="meta-proteina"
            className="input"
            inputMode="numeric"
            placeholder="automática"
            value={manualProtein}
            onChange={(e) => setManualProtein(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div>
          <label htmlFor="meta-agua" className="label">
            Água (ml)
          </label>
          <input
            id="meta-agua"
            className="input"
            inputMode="numeric"
            placeholder="automática"
            value={water}
            onChange={(e) => setWater(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
          <button type="submit" className="btn-primary">
            Salvar metas
          </button>
          {err ? (
            <p role="alert" className="text-sm text-danger">
              {err}
            </p>
          ) : (
            msg && (
              <p role="status" className="text-sm text-ok">
                {msg}
              </p>
            )
          )}
        </div>
      </form>
      <p className="mt-3 text-xs text-muted">
        Para quem treina força, referências costumam ficar entre 1,6 e 2,2 g de proteína por kg ao dia. Seu nutricionista pode indicar outro valor.
      </p>
    </Card>
  );
}

// ---------------- Receitas ----------------

function Recipes({ onOpenList }: { onOpenList: () => void }) {
  const [q, setQ] = useState("");
  const [tags, setTags] = useState<RecipeTag[]>([]);
  const [open, setOpen] = useState<Recipe | null>(null);

  const list = useMemo(() => {
    const nq = normalizeItem(q);
    return RECIPES.filter(
      (r) =>
        tags.every((t) => r.tags.includes(t)) && (!nq || normalizeItem(r.name).includes(nq) || r.ingredients.some((i) => normalizeItem(i.item).includes(nq)))
    );
  }, [q, tags]);

  return (
    <div>
      <div className="relative mb-3">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <label htmlFor="busca-receita" className="sr-only">
          Buscar receita ou ingrediente
        </label>
        <input
          id="busca-receita"
          type="search"
          className="input pl-10"
          placeholder="Buscar receita ou ingrediente"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar receitas">
        {(Object.keys(RECIPE_TAGS) as RecipeTag[]).map((t) => {
          const on = tags.includes(t);
          return (
            <button
              key={t}
              type="button"
              aria-pressed={on}
              className={clsx("chip", on && "chip-on")}
              onClick={() => setTags((l) => (on ? l.filter((x) => x !== t) : [...l, t]))}
            >
              {RECIPE_TAGS[t]}
            </button>
          );
        })}
      </div>
      <p className="mb-3 text-sm text-muted" aria-live="polite">
        {list.length} {list.length === 1 ? "receita" : "receitas"}
      </p>
      {list.length === 0 ? (
        <EmptyState title="Nenhuma receita encontrada" text="Tente tirar algum filtro ou buscar por outro ingrediente." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setOpen(r)}
                className="card flex h-full w-full flex-col text-left hover:border-bronze"
                data-testid="receita"
                aria-label={`${r.name}: ${r.proteinG} g de proteína por porção`}
              >
                <span className="font-semibold text-parchment">{r.name}</span>
                <span className="mt-1 text-sm text-muted">{r.summary}</span>
                <span className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-3 text-xs text-sand">
                  <span className="font-semibold text-bronze-light">{r.proteinG} g proteína</span>
                  <span>{r.kcal} kcal</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} aria-hidden /> {r.minutes} min
                  </span>
                  <span>
                    {r.servings} {r.servings === 1 ? "porção" : "porções"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <RecipeDialog recipe={open} onClose={() => setOpen(null)} onOpenList={onOpenList} />
    </div>
  );
}

function RecipeDialog({ recipe, onClose, onOpenList }: { recipe: Recipe | null; onClose: () => void; onOpenList: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const addToList = useStore((s) => s.addRecipeToShopping);
  const log = useStore((s) => s.logNutrition);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (recipe && !d.open) {
      setMsg("");
      d.showModal();
    }
    if (!recipe && d.open) d.close();
  }, [recipe]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="receita-titulo"
      className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/70 sm:m-auto sm:h-auto sm:max-h-[92vh] sm:max-w-xl sm:rounded-2xl"
    >
      {recipe && (
        <div className="anim-sheet flex h-full flex-col overflow-y-auto bg-graphite text-parchment sm:rounded-2xl sm:border sm:border-line">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-line bg-graphite/95 px-4 py-3">
            <h2 id="receita-titulo" className="font-display text-xl font-bold">
              {recipe.name}
            </h2>
            <button type="button" className="btn-ghost min-h-11 px-3" onClick={onClose} aria-label="Fechar">
              <X size={20} aria-hidden />
            </button>
          </div>
          <div className="space-y-5 p-4">
            <p className="text-sand">{recipe.summary}</p>
            <dl className="grid grid-cols-4 gap-2 text-center">
              {[
                ["Proteína", `${recipe.proteinG} g`],
                ["Energia", `${recipe.kcal} kcal`],
                ["Tempo", `${recipe.minutes} min`],
                ["Rende", `${recipe.servings} ${recipe.servings === 1 ? "porção" : "porções"}`]
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-iron px-1 py-2">
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="text-sm font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="-mt-3 text-xs text-muted">Valores aproximados por porção.</p>
            <section>
              <h3 className="eyebrow mb-2">Ingredientes (receita inteira)</h3>
              <ul className="space-y-1.5">
                {recipe.ingredients.map((i) => (
                  <li key={i.item} className="flex justify-between gap-3 border-b border-line/60 pb-1.5 text-sm">
                    <span>{i.item}</span>
                    <span className="text-right text-muted">{i.qtd}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="eyebrow mb-2">Modo de preparo</h3>
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                {recipe.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </section>
            {msg && (
              <p role="status" className="rounded-xl border border-ok/40 bg-ok/10 px-3 py-2 text-sm">
                {msg}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => {
                  const added = addToList(recipe);
                  setMsg(
                    added === recipe.ingredients.length
                      ? `${added} itens adicionados à lista de compras.`
                      : `Lista atualizada: ${added} ${added === 1 ? "item novo" : "itens novos"}, os outros tiveram a quantidade somada.`
                  );
                }}
              >
                <ShoppingCart size={18} aria-hidden /> Adicionar à lista
              </button>
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => {
                  log(todayISO(), { proteinG: recipe.proteinG });
                  setMsg(`+${recipe.proteinG} g de proteína registrados hoje.`);
                }}
              >
                <Plus size={18} aria-hidden /> Comi 1 porção
              </button>
            </div>
            {msg.includes("lista") && (
              <button
                type="button"
                className="btn-ghost w-full"
                onClick={() => {
                  onClose();
                  onOpenList();
                }}
              >
                Ver lista de compras
              </button>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

// ---------------- Lista de compras ----------------

function Shopping({ onOpenRecipes }: { onOpenRecipes: () => void }) {
  const list = useData().shoppingList ?? [];
  const add = useStore((s) => s.addShoppingItem);
  const toggle = useStore((s) => s.toggleShoppingItem);
  const remove = useStore((s) => s.removeShoppingItem);
  const clearDone = useStore((s) => s.clearShoppingDone);
  const [text, setText] = useState("");
  const [qtd, setQtd] = useState("");
  const [msg, setMsg] = useState("");
  const todo = list.filter((x) => !x.done);
  const done = list.filter((x) => x.done);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    add(text, qtd);
    setText("");
    setQtd("");
  };

  const copy = async () => {
    const body = todo.map((x) => `• ${x.text}${x.qtd ? ` (${x.qtd})` : ""}`).join("\n");
    const content = `Lista de compras\n${body}`;
    try {
      if (navigator.share) await navigator.share({ title: "Lista de compras", text: content });
      else {
        await navigator.clipboard.writeText(content);
        setMsg("Lista copiada.");
      }
    } catch {
      /* compartilhamento cancelado */
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-[1fr_12rem_auto]">
          <div>
            <label htmlFor="compra-item" className="label">
              Item
            </label>
            <input id="compra-item" className="input" maxLength={120} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: Ovos" />
          </div>
          <div>
            <label htmlFor="compra-qtd" className="label">
              Quantidade (opcional)
            </label>
            <input id="compra-qtd" className="input" maxLength={200} value={qtd} onChange={(e) => setQtd(e.target.value)} placeholder="Ex.: 2 dúzias" />
          </div>
          <button type="submit" className="btn-primary self-end" disabled={!text.trim()}>
            <Plus size={18} aria-hidden /> Adicionar
          </button>
        </form>
      </Card>

      {list.length === 0 ? (
        <EmptyState
          title="Lista vazia"
          text="Adicione itens acima ou abra uma receita e toque em “Adicionar à lista”."
          action={
            <button type="button" className="btn-secondary" onClick={onOpenRecipes}>
              Ver receitas
            </button>
          }
        />
      ) : (
        <>
          <section aria-labelledby="compras-pendentes">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 id="compras-pendentes" className="font-display text-lg font-bold">
                Para comprar ({todo.length})
              </h2>
              {todo.length > 0 && (
                <button type="button" className="btn-ghost min-h-10 px-3 text-sm" onClick={copy}>
                  <Copy size={16} aria-hidden /> Compartilhar
                </button>
              )}
            </div>
            {msg && (
              <p role="status" className="mb-2 text-sm text-ok">
                {msg}
              </p>
            )}
            {todo.length === 0 ? <p className="text-sm text-muted">Tudo comprado.</p> : <ItemList items={todo} toggle={toggle} remove={remove} />}
          </section>
          {done.length > 0 && (
            <section aria-labelledby="compras-feitas">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 id="compras-feitas" className="font-display text-lg font-bold text-sand">
                  No carrinho ({done.length})
                </h2>
                <button type="button" className="btn-ghost min-h-10 px-3 text-sm" onClick={clearDone}>
                  <Trash2 size={16} aria-hidden /> Limpar comprados
                </button>
              </div>
              <ItemList items={done} toggle={toggle} remove={remove} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ItemList({
  items,
  toggle,
  remove
}: {
  items: { id: string; text: string; qtd?: string; done: boolean }[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
}) {
  return (
    <ul className="divide-y divide-line rounded-2xl border border-line bg-graphite">
      {items.map((x) => (
        <li key={x.id} className="flex items-center gap-2 px-3" data-testid="item-compra">
          <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-3 py-2">
            <input type="checkbox" className="h-5 w-5 shrink-0 accent-[#B07D45]" checked={x.done} onChange={() => toggle(x.id)} />
            <span className={clsx("min-w-0", x.done && "text-muted line-through")}>
              <span className="block">{x.text}</span>
              {x.qtd && <span className="block text-xs text-muted">{x.qtd}</span>}
            </span>
          </label>
          <button type="button" className="btn-ghost min-h-11 px-2" onClick={() => remove(x.id)} aria-label={`Remover ${x.text}`}>
            <Trash2 size={16} aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
