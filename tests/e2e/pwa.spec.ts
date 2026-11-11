import { expect, test } from "@playwright/test";

test("PWA: manifesto, service worker e abertura sem internet", async ({ page, context, request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.lang).toBe("pt-BR");
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);

  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.goto("/biblioteca");
  await expect(page.getByRole("heading", { name: "Biblioteca" })).toBeVisible();
  await expect(page.getByText("50 exercícios encontrados")).toBeVisible();
  await page.goto("/treinos");
  await expect(page.getByRole("heading", { name: "Modelos" })).toBeVisible();
  await context.setOffline(false);
});
