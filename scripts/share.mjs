import { spawn } from "node:child_process";
import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { findDevUrl } from "./write-dev-url.mjs";

const ORIGIN_PATH = join(process.cwd(), "data", "share-origin.txt");
const URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;

function saveOrigin(origin) {
  mkdirSync(dirname(ORIGIN_PATH), { recursive: true });
  writeFileSync(ORIGIN_PATH, origin.replace(/\/$/, ""), "utf8");
  console.log(`\n招待に使う公開URL: ${origin}\n`);
}

function clearOrigin() {
  try {
    unlinkSync(ORIGIN_PATH);
  } catch {
    /* ignore */
  }
}

const local = findDevUrl() || "http://127.0.0.1:3000";
console.log(`トンネル先: ${local}`);

const child = spawn(
  "npx",
  ["--yes", "cloudflared", "tunnel", "--url", local],
  { stdio: ["ignore", "pipe", "pipe"] },
);

let found = false;
let buf = "";

function onData(chunk) {
  const text = chunk.toString();
  process.stderr.write(text);
  buf += text;
  if (found) return;
  const match = buf.match(URL_RE);
  if (match) {
    found = true;
    saveOrigin(match[0]);
  }
}

child.stdout.on("data", onData);
child.stderr.on("data", onData);

child.on("exit", (code) => {
  clearOrigin();
  process.exit(code ?? 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
