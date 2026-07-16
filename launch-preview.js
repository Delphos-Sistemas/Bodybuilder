const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const project = __dirname;
const nodePath = "C:\\Users\\Click Motion\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin";
const pnpm = "C:\\Users\\Click Motion\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\bin\\fallback\\pnpm.cmd";
const out = fs.openSync(path.join(project, "preview.log"), "a");
const err = fs.openSync(path.join(project, "preview-error.log"), "a");

const child = spawn("cmd.exe", ["/d", "/c", "call", pnpm, "dev", "--hostname", "127.0.0.1", "--port", "3000"], {
  cwd: project,
  detached: true,
  shell: false,
  windowsHide: true,
  stdio: ["ignore", out, err],
  env: {
    ...process.env,
    Path: `${nodePath};${process.env.Path || ""}`
  }
});

fs.writeSync(out, `\n[launcher] started pid ${child.pid} at ${new Date().toISOString()}\n`);
child.unref();
