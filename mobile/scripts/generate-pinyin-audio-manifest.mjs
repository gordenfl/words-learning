/**
 * Generate manifest.to-fill.json: all filenames the app uses for finals × 4 tones.
 * Fill each "url" with your authorized source (e.g. DigMandarin CDN links), then run:
 *   node scripts/download-pinyin-audio.mjs manifest.to-fill.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Must match mobile/src/utils/pinyinFinalAudio.js pinyinFinalAudioStem() */
function stemForFinal(f) {
  const n = String(f).trim().toLowerCase();
  if (n === "ü") return "u-dia";
  if (n === "üe") return "ue-dia";
  if (n === "üan") return "uan-dia";
  if (n === "ün") return "un-dia";
  return n;
}

// Same finals as PinYinFinalsView + ü variants
const FINALS = [
  "a",
  "o",
  "e",
  "i",
  "u",
  "ü",
  "er",
  "ai",
  "ei",
  "ao",
  "ou",
  "an",
  "en",
  "ang",
  "eng",
  "ong",
  "ia",
  "ie",
  "iao",
  "iu",
  "ian",
  "in",
  "iang",
  "ing",
  "iong",
  "ua",
  "uo",
  "uai",
  "ui",
  "uan",
  "un",
  "uang",
  "ueng",
  "üe",
  "üan",
  "ün",
];

const manifest = [];
for (const f of FINALS) {
  const stem = stemForFinal(f);
  for (let tone = 1; tone <= 4; tone++) {
    manifest.push({
      saveAs: `${stem}-${tone}.mp3`,
      url: "",
      note: `final ${f}, tone ${tone}`,
    });
  }
}

const outPath = path.join(__dirname, "manifest.to-fill.json");
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), "utf8");
console.log("Wrote", outPath, `(${manifest.length} rows). Fill "url" for each row, then run download-pinyin-audio.mjs.`);
