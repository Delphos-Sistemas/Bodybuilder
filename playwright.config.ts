import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3100",
    ...devices["Pixel 5"]
  },
  webServer: {
    command:
      "powershell -NoProfile -Command \"$env:Path='C:\\\\Users\\\\Click Motion\\\\.cache\\\\codex-runtimes\\\\codex-primary-runtime\\\\dependencies\\\\node\\\\bin;'+$env:Path; & '.\\\\node_modules\\\\.bin\\\\next.cmd' dev -H 127.0.0.1 -p 3100\"",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: true,
    timeout: 120000
  }
});
