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

  const falas = await page.evaluate(() => (window as unknown as { __falas: string[] }).__falas);
  expect(falas).toContain("Bora lá, iniciar série!");
  expect(falas.some((f) => f.startsWith("Retomar série"))).toBe(true);
  expect(falas).toContain("Treino concluído! Finalize para salvar.");
});
