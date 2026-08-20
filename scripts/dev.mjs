import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeDevUrl } from "./write-dev-url.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const icon = spawn(process.execPath, ["scripts/sync-desktop-icon.mjs", "--watch"], {
  cwd: root,
  stdio: "inherit",
});

const nextBin = join(root, "node_modules", ".bin", "next");
const next = spawn(nextBin, ["dev"], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});

next.stdout.pipe(process.stdout);
next.stderr.pipe(process.stderr);

function onChunk(chunk) {
  const text = chunk.toString();
  const match = text.match(/Local:\s+(https?:\/\/[^\s]+)/i);
  if (!match) return;
  const url = match[1].replace("localhost", "127.0.0.1").replace(/\/$/, "");
  writeDevUrl(url);
}

next.stdout.on("data", onChunk);
next.stderr.on("data", onChunk);

function shutdown() {
  writeDevUrl(null);
  icon.kill("SIGTERM");
  next.kill("SIGTERM");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

next.on("exit", (code) => {
  writeDevUrl(null);
  icon.kill("SIGTERM");
  process.exit(code ?? 0);
});
