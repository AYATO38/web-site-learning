import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const URL_FILE = join(ROOT, ".next", "posse-dev-url.txt");
const SITE_FILE = join(ROOT, "site.config.json");
const PORTS = [3000, 3001, 3002, 3003, 3004];

function run(cmd, args) {
  try {
    return execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

export function productionUrl() {
  try {
    const site = JSON.parse(readFileSync(SITE_FILE, "utf8"));
    return String(site.productionUrl ?? "").replace(/\/$/, "");
  } catch {
    return "https://learner-app-rho.vercel.app";
  }
}

function pidForPort(port) {
  const out = run("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-Fpc"]);
  let pid = "";
  let command = "";
  for (const line of out.split("\n")) {
    if (line.startsWith("p")) pid = line.slice(1);
    if (line.startsWith("c")) command = line.slice(1);
  }
  if (!pid || !command.toLowerCase().includes("node")) return null;
  return pid;
}

function cwdOf(pid) {
  const out = run("lsof", ["-a", "-p", pid, "-d", "cwd", "-Fn"]);
  const line = out.split("\n").find((entry) => entry.startsWith("n"));
  return line ? line.slice(1) : "";
}

function elapsedOf(pid) {
  const value = Number(run("ps", ["-p", pid, "-o", "etimes="]).trim());
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

export function findDevUrl() {
  const matches = [];
  for (const port of PORTS) {
    const pid = pidForPort(port);
    if (!pid) continue;
    if (cwdOf(pid) !== ROOT) continue;
    matches.push({ port, elapsed: elapsedOf(pid) });
  }
  matches.sort((a, b) => a.elapsed - b.elapsed);
  return matches[0] ? `http://127.0.0.1:${matches[0].port}` : null;
}

export function openAppUrl() {
  return productionUrl();
}

export function writeDevUrl(url = findDevUrl()) {
  mkdirSync(dirname(URL_FILE), { recursive: true });
  if (url) {
    writeFileSync(URL_FILE, url);
    return url;
  }
  if (existsSync(URL_FILE)) {
    writeFileSync(URL_FILE, "");
  }
  return null;
}

if (process.argv[1] && /write-dev-url\.mjs$/.test(process.argv[1])) {
  process.stdout.write(openAppUrl());
}
