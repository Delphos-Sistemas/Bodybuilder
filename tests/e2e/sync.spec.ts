import { expect, test } from "@playwright/test";

/**
 * Sincronização entre dois aparelhos. Precisa do Worker com D1 local:
 *   npx wrangler d1 migrations apply bodybuilder-sync-local --local -c wrangler.local.jsonc
 *   npx wrangler dev -c wrangler.local.jsonc --port 8799
 *   SYNC_BASE_URL=http://localhost:8799 npx playwright test sync --project desktop
 */
const base = process.env.SYNC_BASE_URL;
test.skip(!base, "SYNC_BASE_URL não definido (Worker com D1 local não está rodando)");

test("dois aparelhos com o mesmo código veem os mesmos treinos", async ({ browser }) => {
  const a = await (await browser.newContext({ baseURL: base })).newPage();
  const b = await (await browser.newContext({ baseURL: base })).newPage();

  // aparelho A cria um treino e ativa a sincronização
  await a.goto("/treinos/editar?novo=1");
  await a.getByLabel("Nome do treino").fill("Treino do celular");
  await a.getByRole("button", { name: "Salvar treino" }).click();
  await expect(a).toHaveURL(/\/treinos\/?$/);
  await a.goto("/configuracoes");
  await a.getByRole("button", { name: "Ativar sincronização" }).click();
  await expect(a.getByTestId("sync-ativo")).toBeVisible();
  await a.getByRole("button", { name: "Mostrar" }).click();
  const code = (await a.getByTestId("codigo-sync").textContent())!.trim();
  expect(code).toMatch(/^([A-Z0-9]{4}-){5}[A-Z0-9]{4}$/);

  // aparelho B tem outro treino, conecta com o código e recebe o de A
  await b.goto("/treinos/editar?novo=1");
  await b.getByLabel("Nome do treino").fill("Treino do computador");
  await b.getByRole("button", { name: "Salvar treino" }).click();
  await expect(b).toHaveURL(/\/treinos\/?$/);
  await b.goto("/configuracoes");
  await b.getByRole("button", { name: "Já tenho um código" }).click();
  await b.getByLabel("Código de sincronização").fill(code.toLowerCase().replace(/-/g, " "));
  await b.getByRole("button", { name: "Conectar" }).click();
  await expect(b.getByTestId("sync-ativo")).toBeVisible();
  await b.goto("/treinos");
  const meusB = b.getByRole("region", { name: "Meus treinos" });
  await expect(meusB).toContainText("Treino do celular");
  await expect(meusB).toContainText("Treino do computador");

  // A recebe o treino de B ao sincronizar; exclusão em A some em B
  await a.getByRole("button", { name: "Sincronizar agora" }).click();
  await expect(a.getByText("Sincronizado.")).toBeVisible();
  await a.goto("/treinos");
  await expect(a.getByRole("region", { name: "Meus treinos" })).toContainText("Treino do computador");
  await a.getByRole("button", { name: "Excluir Treino do celular" }).click();
  await a.getByRole("button", { name: "Excluir", exact: true }).click();
  await expect(a.getByRole("region", { name: "Meus treinos" })).not.toContainText("Treino do celular");
  await a.goto("/configuracoes");
  await a.getByRole("button", { name: "Sincronizar agora" }).click();
  await expect(a.getByText("Sincronizado.")).toBeVisible();

  await b.goto("/configuracoes");
  await b.getByRole("button", { name: "Sincronizar agora" }).click();
  await expect(b.getByText("Sincronizado.")).toBeVisible();
  await b.goto("/treinos");
  await expect(meusB).not.toContainText("Treino do celular");
  await expect(meusB).toContainText("Treino do computador");
});
