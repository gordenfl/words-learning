/**
 * Download all MP3s from zispace/hanyu-pinyin-audio (branch data, path gitcode.com/audio).
 * Source: https://github.com/zispace/hanyu-pinyin-audio/tree/data/gitcode.com/audio
 *
 * Files are saved flat as mobile/public/audio/pinyin-hanyu/{basename}.mp3 (e.g. a1.mp3).
 *
 * Usage (from mobile/):
 *   node scripts/sync-hanyu-pinyin-audio.mjs
 *
 * Optional: GITHUB_TOKEN=ghp_xxx for higher API rate limits (5000/hr).
 *
 * If GitHub returns truncated tree, clone the repo manually:
 *   git clone --depth 1 --branch data https://github.com/zispace/hanyu-pinyin-audio.git .tmp-hanyu
 *   xcopy /s .tmp-hanyu\gitcode.com\audio\*.mp3 public\audio\pinyin-hanyu\
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "audio", "pinyin-hanyu");

const OWNER = "zispace";
const REPO = "hanyu-pinyin-audio";
const BRANCH = "data";
const PATH_PREFIX = "gitcode.com/audio/";
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${PATH_PREFIX}`;

const DELAY_MS = 120;
const MAX_RETRIES = 3;

function ghHeaders() {
  const t = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const h = { Accept: "application/vnd.github+json", "User-Agent": "words-learning-pinyin-sync/1.0" };
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: ghHeaders() });
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function getBranchTreeSha() {
  const j = await fetchJson(`https://api.github.com/repos/${OWNER}/${REPO}/branches/${BRANCH}`);
  const sha = j?.commit?.commit?.tree?.sha || j?.commit?.tree?.sha;
  if (!sha) throw new Error("Could not read branch tree sha");
  return sha;
}

async function getTreeRecursive(treeSha) {
  const j = await fetchJson(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${treeSha}?recursive=1`
  );
  if (j.truncated) {
    console.warn(
      "WARNING: GitHub API tree response was truncated. Use git clone (see script header) to get all files."
    );
  }
  return j.tree || [];
}

async function downloadFile(basename) {
  const url = `${RAW_BASE}${basename}`;
  const dest = path.join(OUT_DIR, basename);
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "audio/*,*/*",
          "User-Agent": "words-learning-pinyin-sync/1.0",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 32) throw new Error("response too small");
      fs.writeFileSync(dest, buf);
      return buf.length;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  throw lastErr;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log("Fetching file list from GitHub API…");
  const treeSha = await getBranchTreeSha();
  const tree = await getTreeRecursive(treeSha);

  const entries = tree.filter(
    (n) =>
      n.type === "blob" &&
      typeof n.path === "string" &&
      n.path.startsWith(PATH_PREFIX) &&
      n.path.endsWith(".mp3")
  );
  const basenames = [...new Set(entries.map((n) => n.path.slice(PATH_PREFIX.length)))].filter(
    (b) => b && !b.includes("/")
  );

  console.log(`Found ${basenames.length} mp3 entries under ${PATH_PREFIX}. Downloading…`);

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < basenames.length; i++) {
    const b = basenames[i];
    try {
      const n = await downloadFile(b);
      ok++;
      if ((i + 1) % 50 === 0 || i === basenames.length - 1) {
        console.log(`  ${i + 1}/${basenames.length} (${ok} ok, ${fail} fail) ${b}`);
      }
    } catch (e) {
      console.error(`  FAIL ${b}:`, e.message);
      fail++;
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(`Done: ${ok} downloaded, ${fail} failed → ${OUT_DIR}`);
  console.log("Next: set in mobile/.env:");
  console.log("  VITE_PINYIN_AUDIO_BASE_URL=/audio/pinyin-hanyu");
  console.log("  VITE_PINYIN_AUDIO_NAMING=hanyu");
  if (fail) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
