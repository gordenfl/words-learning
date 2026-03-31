/**
 * Optional demo audio for pinyin finals (per tone). Set VITE_PINYIN_AUDIO_BASE_URL
 * and place files like a-1.mp3 … a-4.mp3 under that path (see public/audio/pinyin/README.txt).
 *
 * Override any single clip with URL_OVERRIDES (full URL), key = "{fileStem}-{tone}" e.g. "a-3".
 */

const URL_OVERRIDES = {
  // Example:
  // "a-1": "https://your-cdn.example.com/pinyin/a-1.mp3",
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

/** ASCII-safe filename stem (matches README naming). */
export function pinyinFinalAudioStem(rawFinal) {
  const n = normalizeFinal(rawFinal);
  if (n === "ü") return "u-dia";
  if (n === "üe") return "ue-dia";
  if (n === "üan") return "uan-dia";
  if (n === "ün") return "un-dia";
  return n;
}

export function isPinyinDemoAudioConfigured() {
  const base = (import.meta.env.VITE_PINYIN_AUDIO_BASE_URL || "").trim();
  return !!base || Object.keys(URL_OVERRIDES).length > 0;
}

/**
 * Absolute URL or site-relative URL to load with new Audio(). Empty = use TTS only.
 */
export function audioUrlForFinalTone(rawFinal, tone) {
  const stem = pinyinFinalAudioStem(rawFinal);
  const t = Number(tone);
  if (!stem || t < 1 || t > 4) return "";
  const key = `${stem}-${t}`;
  if (URL_OVERRIDES[key]) return URL_OVERRIDES[key];

  const base = (import.meta.env.VITE_PINYIN_AUDIO_BASE_URL || "").trim();
  if (!base) return "";
  const ext = (import.meta.env.VITE_PINYIN_AUDIO_EXT || "mp3").replace(/^\./, "");
  const file = `${stem}-${t}.${ext}`;
  const root = base.replace(/\/$/, "");
  return `${root}/${file}`;
}
