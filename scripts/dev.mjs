import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const icon = spawn(process.execPath, ["scripts/sync-desktop-icon.mjs", "--watch"], {
  cwd: root,
  stdio: "inherit",
});

const nextBin = join(root, "node_modules", ".bin", "next");
const next = spawn(nextBin, ["dev"], {
  cwd: root,
  stdio: "inherit",
});

function shutdown() {
  icon.kill("SIGTERM");
  next.kill("SIGTERM");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

next.on("exit", (code) => {
  icon.kill("SIGTERM");
  process.exit(code ?? 0);
});
