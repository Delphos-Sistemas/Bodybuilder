import { expect, test } from "@playwright/test";

test("fluxo demo de treino", async ({ page }) => {
  await page.goto("/inicio");
  await page.getByRole("button", { name: /iniciar treino/i }).click();
  await expect(page.getByText(/Treino ativo/i)).toBeVisible();
  await page.getByRole("button", { name: /Concluir serie/i }).click();
  await expect(page.getByText(/Descanso iniciado/i)).toBeVisible();
});
