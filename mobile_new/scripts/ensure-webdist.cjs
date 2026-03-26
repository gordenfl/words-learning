const fs = require("fs");
const path = require("path");

// Capacitor/iOS runtime may try to load `public/<webDir>/index.html` when `webDir` is set to `dist`.
// However `cap sync` often copies `dist` contents directly into `public/`, so `public/dist/` is missing.
// This script ensures `public/dist/` exists by copying the entire Capacitor web root into it.

const iosPublicDir = path.join(__dirname, "..", "ios", "App", "App", "public");
const distDir = path.join(iosPublicDir, "dist");

if (!fs.existsSync(iosPublicDir)) {
  console.warn(`[ensure-webdist] public dir not found: ${iosPublicDir}`);
  process.exit(0);
}

// Replace to avoid stale files from previous builds.
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const entry of fs.readdirSync(iosPublicDir)) {
  if (entry === "dist") continue;
  const from = path.join(iosPublicDir, entry);
  const to = path.join(distDir, entry);
  fs.cpSync(from, to, { recursive: true });
}

console.log(`[ensure-webdist] Synced to ${distDir}`);

