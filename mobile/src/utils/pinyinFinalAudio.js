/**
 * Optional demo audio for pinyin finals (per tone).
 *
 * Naming modes (VITE_PINYIN_AUDIO_NAMING):
 * - hyphen: {stem}-{tone}.mp3  (e.g. a-1.mp3) — your own files / manifest downloads
 * - hanyu:  {syllable}{tone}.mp3 — matches zispace/hanyu-pinyin-audio (see scripts/sync-hanyu-pinyin-audio.mjs)
 *
 * Set VITE_PINYIN_AUDIO_BASE_URL=/audio/pinyin-hanyu and VITE_PINYIN_AUDIO_NAMING=hanyu after sync.
 */

/**
 * Map our file stem (pinyinFinalAudioStem) to syllable prefix used in hanyu-pinyin-audio filenames
 * for “zero initial” readings (yi/wu/yu/…).
 */
const HANYU_SYLLABLE_FOR_STEM = {
  i: "yi",
  u: "wu",
  "u-dia": "yu",
  "ue-dia": "yue",
  "uan-dia": "yuan",
  "un-dia": "yun",
  ia: "ya",
  ie: "ye",
  iao: "yao",
  iu: "you",
  ian: "yan",
  in: "yin",
  iang: "yang",
  ing: "ying",
  iong: "yong",
  ua: "wa",
  uo: "wo",
  uai: "wai",
  ui: "wei",
  uan: "wan",
  un: "wen",
  uang: "wang",
  ueng: "weng",
};

function normalizeFinal(raw) {
  if (raw == null) return "";
  let s = String(raw).trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    /* ignore */
  }
  return s.toLowerCase();
}

/** ASCII-safe filename stem (hyphon mode / override keys). */
export function pinyinFinalAudioStem(rawFinal) {
  const n = normalizeFinal(rawFinal);
  if (n === "ü") return "u-dia";
  if (n === "üe") return "ue-dia";
  if (n === "üan") return "uan-dia";
  if (n === "ün") return "un-dia";
  return n;
}

/** Syllable root used in hanyu-pinyin-audio repo (a1.mp3, yin1.mp3, …). */
export function hanyuSyllableBaseForStem(stem) {
  return HANYU_SYLLABLE_FOR_STEM[stem] ?? stem;
}

export function isPinyinDemoAudioConfigured() {
  const base = (import.meta.env.VITE_PINYIN_AUDIO_BASE_URL || "").trim();
  return !!(base || "/audio/pinyin-hanyu");
}

/**
 * Absolute URL or site-relative URL to load with new Audio(). Empty = no static clip.
 */
export function audioUrlForFinalTone(rawFinal, tone) {
  const stem = pinyinFinalAudioStem(rawFinal);
  const t = Number(tone);
  if (!stem || t < 1 || t > 4) return "";

  const base = (import.meta.env.VITE_PINYIN_AUDIO_BASE_URL || "").trim() || "/audio/pinyin-hanyu";
  const ext = (import.meta.env.VITE_PINYIN_AUDIO_EXT || "mp3").replace(/^\./, "");
  const naming = (import.meta.env.VITE_PINYIN_AUDIO_NAMING || "hanyu").toLowerCase();

  let file;
  if (naming === "hanyu") {
    const syllable = hanyuSyllableBaseForStem(stem);
    file = `${syllable}${t}.${ext}`;
  } else {
    file = `${stem}-${t}.${ext}`;
  }

  const root = base.replace(/\/$/, "");
  return `${root}/${file}`;
}
