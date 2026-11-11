import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 4173);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: 0,
  use: { baseURL: `http://localhost:${port}`, trace: "off" },
  webServer: {
    command: `node scripts/serve-out.mjs --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 30_000
  },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 860 } } },
    // Safari do iPhone (WebKit). Ligado com PW_WEBKIT=1, pois exige `npx playwright install webkit`.
    ...(process.env.PW_WEBKIT ? [{ name: "iphone", use: { ...devices["iPhone 14"] } }] : [])
  ]
});
