import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  watch,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ICON_SRC = join(ROOT, "src", "app", "icon.png");
const ICON_PUBLIC = join(ROOT, "public", "icon.png");
const DESKTOP = join(homedir(), "Desktop");
const PNG_DEST = join(DESKTOP, "POSSE.png");
const APP_DEST = join(DESKTOP, "POSSE.app");
const LAUNCHER_VERSION = "production-url-1";
const STAMP = join(ROOT, ".next", "desktop-icon.sha");
const SITE_FILE = join(ROOT, "site.config.json");

function sha(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: "pipe" });
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function applyFinderIcon(iconPath, targetPath) {
  const script = `
use framework "AppKit"
on run argv
  set iconPath to item 1 of argv
  set targetPath to item 2 of argv
  set img to current application's NSImage's alloc()'s initWithContentsOfFile:iconPath
  set ws to current application's NSWorkspace's sharedWorkspace()
  ws's setIcon:img forFile:targetPath options:0
end run
`;
  spawnSync("osascript", ["-", iconPath, targetPath], {
    input: script,
    encoding: "utf8",
  });
}

function buildIcns(srcPng) {
  const dir = mkdtempSync(join(tmpdir(), "posse-icon-"));
  const iconset = join(dir, "posse.iconset");
  mkdirSync(iconset);
  const sizes = [
    [16, "icon_16x16.png"],
    [32, "icon_16x16@2x.png"],
    [32, "icon_32x32.png"],
    [64, "icon_32x32@2x.png"],
    [128, "icon_128x128.png"],
    [256, "icon_128x128@2x.png"],
    [256, "icon_256x256.png"],
    [512, "icon_256x256@2x.png"],
    [512, "icon_512x512.png"],
    [1024, "icon_512x512@2x.png"],
  ];
  for (const [px, name] of sizes) {
    run("sips", ["-z", String(px), String(px), srcPng, "--out", join(iconset, name)]);
  }
  const icns = join(dir, "posse.icns");
  run("iconutil", ["-c", "icns", iconset, "-o", icns]);
  return { dir, icns };
}

function productionUrlFromConfig() {
  try {
    const site = JSON.parse(readFileSync(SITE_FILE, "utf8"));
    return String(site.productionUrl ?? "").replace(/\/$/, "");
  } catch {
    return "https://learner-app-rho.vercel.app";
  }
}

function ensureApp() {
  const openUrl = productionUrlFromConfig();
  const scriptPath = join(tmpdir(), `posse-open-${Date.now()}.applescript`);
  writeFileSync(
    scriptPath,
    `
set stamp to do shell script "date +%s"
do shell script "/usr/bin/open " & quoted form of (${JSON.stringify(openUrl)} & "/?v=" & stamp)
`,
  );
  try {
    run("osacompile", ["-o", APP_DEST, scriptPath]);
  } finally {
    rmSync(scriptPath, { force: true });
  }
  const plist = join(APP_DEST, "Contents", "Info.plist");
  const version = String(Date.now());
  try {
    run("/usr/libexec/PlistBuddy", ["-c", "Set :CFBundleName POSSE", plist]);
  } catch {
    /* already set */
  }
  try {
    run("/usr/libexec/PlistBuddy", ["-c", `Set :CFBundleVersion ${version}`, plist]);
  } catch {
    try {
      run("/usr/libexec/PlistBuddy", [
        "-c",
        `Add :CFBundleVersion string ${version}`,
        plist,
      ]);
    } catch {
      /* ignore */
    }
  }
}

function syncDesktopIcon({ force = false } = {}) {
  if (!existsSync(ICON_SRC)) {
    console.warn("desktop icon: src/app/icon.png がありません");
    return false;
  }
  if (!existsSync(DESKTOP)) {
    console.warn("desktop icon: Desktop が見つかりません");
    return false;
  }

  const hash = `${sha(ICON_SRC)}:${LAUNCHER_VERSION}`;
  if (!force && existsSync(STAMP) && readFileSync(STAMP, "utf8").trim() === hash) {
    return false;
  }

  mkdirSync(dirname(ICON_PUBLIC), { recursive: true });
  copyFileSync(ICON_SRC, ICON_PUBLIC);

  console.log("desktop icon: POSSE.png を更新");
  copyFileSync(ICON_SRC, PNG_DEST);
  applyFinderIcon(ICON_SRC, PNG_DEST);
  run("touch", [PNG_DEST]);

  sleep(280);

  console.log("desktop icon: POSSE.app を更新");
  ensureApp();
  const { dir, icns } = buildIcns(ICON_SRC);
  try {
    copyFileSync(icns, join(APP_DEST, "Contents", "Resources", "applet.icns"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  applyFinderIcon(ICON_SRC, APP_DEST);
  run("touch", [APP_DEST, join(APP_DEST, "Contents", "Info.plist")]);
  try {
    run(
      "/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister",
      ["-f", APP_DEST],
    );
  } catch {
    /* optional */
  }

  mkdirSync(dirname(STAMP), { recursive: true });
  writeFileSync(STAMP, hash);
  return true;
}

function watchIcon() {
  let timer;
  const kick = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        syncDesktopIcon({ force: true });
      } catch (err) {
        console.warn("desktop icon: 更新に失敗しました", err instanceof Error ? err.message : err);
      }
    }, 400);
  };

  watch(dirname(ICON_SRC), (event, filename) => {
    if (filename === "icon.png") kick();
  });
  watch(SITE_FILE, () => kick());
  console.log("desktop: アイコンと公開URLの変更を監視中");
}

const watchMode = process.argv.includes("--watch");
try {
  syncDesktopIcon({ force: process.argv.includes("--force") });
} catch (err) {
  console.warn("desktop icon: 初回同期に失敗しました", err instanceof Error ? err.message : err);
}

if (watchMode) {
  watchIcon();
}
