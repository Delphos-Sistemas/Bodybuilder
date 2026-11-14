import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("supersérie, aquecimento, descanso inteligente, troca de exercício e diário", async ({ page }) => {
  await page.goto("/treinos");
  await page.getByRole("link", { name: "Criar do zero" }).click();
  await page.getByLabel("Nome do treino").fill("Super");
  for (const nome of ["Supino reto com barra", "Remada curvada com barra"]) {
    await page.getByRole("button", { name: "Adicionar exercício" }).click();
    await page.getByLabel("Buscar exercício").fill(nome);
    await page.getByRole("button", { name: `Adicionar ${nome}` }).click();
    await page.getByRole("button", { name: "Concluir" }).click();
  }
  const items = page.getByTestId("item-exercicio");
  for (const item of await items.all()) {
    await item.getByLabel("Séries", { exact: true }).fill("1");
    await item.getByLabel("Carga (kg)").fill("60");
  }
  await items.first().getByRole("switch", { name: "Supersérie com o próximo" }).click();
  await page.getByRole("button", { name: "Salvar treino" }).click();
  await page.getByRole("listitem").filter({ hasText: "Super" }).getByRole("button", { name: "Iniciar treino" }).click();

  await expect(page.getByTestId("superserie")).toContainText("Remada curvada com barra");
  // aquecimento antes do primeiro exercício pesado
  const warm = page.getByTestId("aquecimento");
  await expect(warm).toContainText("30 kg");
  await warm.getByRole("button", { name: "Feito" }).first().click();
  await expect(page.getByTestId("series-extras")).toContainText("1 aquecimento");

  // troca de exercício (aparelho ocupado)
  await page.getByRole("button", { name: "Trocar" }).click();
  await page.getByTestId("opcoes-troca").getByRole("button").first().click();
  await expect(page.getByTestId("trocado")).toContainText("Supino reto com barra");

  // série pesada até a falha: vai direto à remada, sem descanso
  await page.getByLabel("Repetições", { exact: true }).fill("4");
  await page.getByLabel("RIR", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Concluir série" }).click();
  await expect(page.getByRole("heading", { name: "Remada curvada com barra" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pular descanso" })).toHaveCount(0);

  await page.getByRole("button", { name: "Concluir série" }).click();
  await page.getByRole("button", { name: "Finalizar e salvar treino" }).click();
  await expect(page.getByTestId("nova-medalha")).toContainText("Primeiro passo");
  const diary = page.getByTestId("diario").first();
  await diary.getByRole("radio", { name: "Energia: 4 de 5" }).click();
  await expect(diary.getByRole("radio", { name: "Energia: 4 de 5" })).toHaveAttribute("aria-checked", "true");

  await page.goto("/conquistas");
  await expect(page.getByTestId("medalha-ok").filter({ hasText: "Primeiro passo" })).toHaveCount(1);
  await page.goto("/");
  await expect(page.getByTestId("mapa-semana")).toContainText("Esquecidos");
});

test("calculadora de 1RM e anilhas", async ({ page }) => {
  await page.goto("/calculadora");
  await page.getByLabel("Carga (kg)").fill("100");
  await page.getByLabel("Repetições", { exact: true }).fill("5");
  await expect(page.getByTestId("resultado-1rm")).toHaveText("116,7 kg");
  await page.getByLabel("Carga total (kg)").fill("100");
  await expect(page.getByTestId("resultado-anilhas")).toContainText("25 + 15 kg");
});

test("desafio por link: entra no ranking de quem mandou", async ({ page }) => {
  const code = await page.evaluate(() => {
    const w = { k: "treinos", p: [["d_amigo1", "Zé", new Date().toISOString().slice(0, 7), 9, 12000, 80, 2, Date.now()]] };
    const bytes = new TextEncoder().encode(JSON.stringify(w));
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  });
  await page.goto(`/desafio#d=${code}`);
  await expect(page.getByRole("status").first()).toContainText("1 pessoa");
  await expect(page.getByTestId("ranking")).toContainText("Zé");
  await expect(page.getByTestId("ranking").getByRole("listitem").first()).toContainText("Zé");
});
