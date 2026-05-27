import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const api = spawn(process.execPath, [new URL("./index.mjs", import.meta.url)], {
  stdio: "inherit",
  env: process.env,
  cwd: root,
});

const web = spawn(npmCommand, ["run", "dev"], {
  stdio: "inherit",
  env: process.env,
  cwd: root,
});

function shutdown() {
  api.kill("SIGTERM");
  web.kill("SIGTERM");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

api.on("exit", (code) => {
  if (code && code !== 0) {
    process.exit(code);
  }
});

web.on("exit", (code) => {
  if (code && code !== 0) {
    process.exit(code);
  }
});
