import { expect, test } from "@playwright/test";

test("PWA: manifesto, service worker e abertura sem internet", async ({ page, context, request, browserName }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.lang).toBe("pt-BR");
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);

  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  // No WebKit do Playwright, o modo offline simulado bloqueia a navegação antes do service worker
  // ("WebKit encountered an internal error"), então a abertura sem internet só é verificada no Chromium.
  // No Safari, o teste acima confirma que o service worker instalou e controla a página.
  if (browserName === "webkit") return;

  await context.setOffline(true);
  await page.goto("/biblioteca");
  await expect(page.getByRole("heading", { name: "Biblioteca" })).toBeVisible();
  await expect(page.getByText("50 exercícios encontrados")).toBeVisible();
  await page.goto("/treinos");
  await expect(page.getByRole("heading", { name: "Modelos" })).toBeVisible();
  await context.setOffline(false);
});
