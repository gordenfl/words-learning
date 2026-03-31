/**
 * Download authorized pinyin audio files into public/audio/pinyin/.
 *
 * You (or DigMandarin under your license) provide a manifest: each row is one file
 * our app already expects: { "saveAs": "a-1.mp3", "url": "https://..." }.
 *
 * Usage (from mobile/):
 *   node scripts/generate-pinyin-audio-manifest.mjs   # writes manifest.to-fill.json
 *   # edit manifest.to-fill.json: set each "url"
 *   node scripts/download-pinyin-audio.mjs manifest.to-fill.json
 *
 * Requires Node 18+ (global fetch).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "audio", "pinyin");
const DELAY_MS = 400;

async function downloadOne(url, dest) {
  const res = await fetch(url, {
    headers: {
      Accept: "audio/*,*/*",
      "User-Agent": "words-learning-pinyin-sync/1.0 (authorized asset sync)",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 32) {
    throw new Error("response too small; expected audio");
  }
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    console.error("Usage: node scripts/download-pinyin-audio.mjs <manifest.json>");
    process.exit(1);
  }
  const raw = fs.readFileSync(manifestPath, "utf8");
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows)) {
    console.error("Manifest must be a JSON array");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const row of rows) {
    const url = (row.url || "").trim();
    const saveAs = (row.saveAs || row.filename || "").trim();
    if (!saveAs) {
      console.warn("skip (no saveAs):", row);
      skip++;
      continue;
    }
    if (!url) {
      skip++;
      continue;
    }
    const dest = path.join(OUT_DIR, saveAs);
    try {
      const n = await downloadOne(url, dest);
      console.log("OK", saveAs, n, "bytes");
      ok++;
    } catch (e) {
      console.error("FAIL", saveAs, e.message);
      fail++;
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(`Done: ${ok} downloaded, ${skip} skipped (empty url), ${fail} failed`);
  if (fail) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
