import { expect, test } from "@playwright/test";

test("timer guiado: preparo → execução → descanso → volta, registrando as séries sozinho e falando", async ({ page }) => {
  // registra as falas em vez de depender da voz do navegador de teste
  await page.addInitScript(() => {
    const spoken: string[] = [];
    (window as unknown as { __falas: string[] }).__falas = spoken;
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        speak: (u: SpeechSynthesisUtterance) => u.text.trim() && spoken.push(u.text),
        cancel: () => undefined,
        getVoices: () => [],
        addEventListener: () => undefined,
        removeEventListener: () => undefined
      }
    });
  });
  const vozes: string[] = [];
  page.on("request", (r) => r.url().includes("/voz/") && vozes.push(r.url()));
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/treinos");
  await page.getByRole("link", { name: "Criar do zero" }).click();
  await page.getByLabel("Nome do treino").fill("Guiado");
  await page.getByRole("button", { name: "Adicionar exercício" }).click();
  await page.getByLabel("Buscar exercício").fill("supino reto com barra");
  await page.getByRole("button", { name: "Adicionar Supino reto com barra" }).click();
  await page.getByRole("button", { name: "Concluir" }).click();
  const item = page.getByTestId("item-exercicio");
  await item.getByRole("button", { name: "Diminuir séries" }).click(); // 2 séries
  await item.getByLabel("Descanso (s)").fill("3");
  await item.getByLabel("Execução (timer) (s)").fill("5");
  await item.getByLabel("Preparo (timer) (s)").fill("2");
  await page.getByRole("button", { name: "Salvar treino" }).click();
  await page.getByRole("listitem").filter({ hasText: "Guiado" }).getByRole("button", { name: "Iniciar treino" }).click();

  const timer = page.getByTestId("timer-guiado");
  await expect(timer).toContainText("Execução 5s · Descanso 3s · Preparo 2s");
  await timer.getByRole("button", { name: "Iniciar timer guiado" }).click();
  await expect(page.getByTestId("timer-fase")).toHaveText("Prepare-se");
  await expect(page.getByTestId("timer-fase")).toHaveText("Execute", { timeout: 5000 });
  await expect(page.getByTestId("timer-fase")).toHaveText("Descanse", { timeout: 8000 });
  await expect(page.getByRole("heading", { name: "Série 2 de 2" })).toBeVisible();
  await expect(page.getByTestId("timer-fase")).toHaveText("Prepare-se", { timeout: 6000 });
  await expect(page.getByTestId("timer-fase")).toHaveText("Execute", { timeout: 5000 });
  await page.getByRole("button", { name: "Terminei" }).click();
  await expect(page.getByRole("heading", { name: "Todas as séries concluídas" })).toBeVisible();

  // a voz gravada é baixada (o navegador de teste pode não liberar o áudio; aí cai na voz do aparelho)
  expect(vozes.some((u) => u.includes("/voz/dora/neutro/iniciar-"))).toBe(true);
  // anuncia o nome e o aparelho do exercício
  expect(vozes.some((u) => u.endsWith("/voz/dora/exercicios/supino-reto.mp3"))).toBe(true);
  const falas = await page.evaluate(() => (window as unknown as { __falas: string[] }).__falas);
  if (falas.length) expect(falas).toContain("Treino concluído! Finalize para salvar.");
});

test("timer guiado no modo manual espera escolher o próximo exercício", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/treinos");
  await page.getByRole("link", { name: "Criar do zero" }).click();
  await page.getByLabel("Nome do treino").fill("Manual");
  for (const nome of ["Supino reto com barra", "Agachamento livre com barra"]) {
    await page.getByRole("button", { name: "Adicionar exercício" }).click();
    await page.getByLabel("Buscar exercício").fill(nome);
    await page.getByRole("button", { name: `Adicionar ${nome}` }).click();
    await page.getByRole("button", { name: "Concluir" }).click();
  }
  for (const item of await page.getByTestId("item-exercicio").all()) {
    await item.getByLabel("Séries", { exact: true }).fill("1");
    await item.getByLabel("Descanso (s)").fill("2");
    await item.getByLabel("Execução (timer) (s)").fill("5");
    await item.getByLabel("Preparo (timer) (s)").fill("1");
  }
  await page.getByRole("button", { name: "Salvar treino" }).click();
  await page.getByRole("listitem").filter({ hasText: "Manual" }).getByRole("button", { name: "Iniciar treino" }).click();

  const timer = page.getByTestId("timer-guiado");
  await timer.getByRole("button", { name: "Ajustar tempos" }).click();
  await timer.getByRole("radio", { name: "Esperar eu escolher" }).click();
  await timer.getByRole("button", { name: "Iniciar timer guiado" }).click();
  await expect(page.getByTestId("timer-fase")).toHaveText("Execute", { timeout: 4000 });
  await page.getByRole("button", { name: "Terminei" }).click();
  await expect(page.getByTestId("timer-fase")).toHaveText("Exercício concluído", { timeout: 6000 });
  await page.waitForTimeout(1500);
  await expect(page.getByTestId("timer-fase")).toHaveText("Exercício concluído");
  await page.getByRole("button", { name: "Começar Agachamento livre com barra" }).click();
  await expect(page.getByTestId("timer-fase")).toHaveText("Execute", { timeout: 4000 });
  await page.getByRole("button", { name: "Terminei" }).click();
  await expect(page.getByRole("heading", { name: "Todas as séries concluídas" })).toBeVisible();
});
