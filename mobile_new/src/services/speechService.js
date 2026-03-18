/**
 * Text-to-Speech service - ChatTTS via API, fallback to browser SpeechSynthesis
 */
import api from "./api";
import { useAuthStore } from "../stores/auth";

/**
 * Speak text using ChatTTS (if available) or browser SpeechSynthesis
 * @param {string} text - Text to speak
 * @param {object} options - { lang?: 'zh'|'en', rate?: number, speed?: number, voiceId?: string }
 *   rate: for browser fallback (0.3-1, lower=slower)
 *   speed: for ChatTTS (1-10, lower=slower). Default 5 for normal, 3 for compounds.
 * @returns {Promise<void>}
 */

/**
 * Fetch TTS audio from API. Returns { audioBase64, sampleRate } or null.
 */
async function fetchTtsAudio(text, options = {}) {
  if (!text || typeof text !== "string" || !text.trim()) return null;
  const lang = options.lang || "zh";
  const voiceId = options.voiceId ?? useAuthStore().user?.profile?.ttsVoice ?? "xiaoming";
  const speed = options.speed ?? (options.rate != null && options.rate < 0.5 ? 3 : 5);
  try {
    const { data } = await api.post("/speech/tts/synthesize", {
      text: text.trim(),
      voiceId,
      lang,
      speed,
    });
    if (data?.audioBase64) {
      return { audioBase64: data.audioBase64, sampleRate: data.sampleRate || 24000 };
    }
  } catch (err) {
    if (err.response?.status !== 503 && import.meta.env.DEV) {
      console.warn("TTS API failed:", err.message);
    }
  }
  return null;
}

export async function speak(text, options = {}) {
  if (!text || typeof text !== "string" || !text.trim()) return;
  const audio = await fetchTtsAudio(text, options);
  if (audio) {
    await playBase64Audio(audio.audioBase64, audio.sampleRate);
    return;
  }
  return fallbackSpeak(text, options);
}

function playBase64Audio(base64, sampleRate) {
  return new Promise((resolve, reject) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    audio.play();
  });
}

function fallbackSpeak(text, options = {}) {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = options.lang === "en" ? "en-US" : "zh-CN";
    u.rate = options.rate ?? (options.lang === "zh" ? 0.4 : 0.8);
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

/**
 * Speak Chinese text (slow rate for learning)
 * @param {string} text
 * @param {number} rate - 0.3-1, lower=slower. Default 0.4 for learning.
 */
export function speakChinese(text, rate = 0.4) {
  return speak(text, { lang: "zh", rate, speed: rate < 0.5 ? 3 : 5 });
}

/**
 * Speak English text
 */
export function speakEnglish(text, rate = 0.8) {
  return speak(text, { lang: "en", rate });
}

/**
 * Speak Chinese then English (for compounds/examples)
 * Fetches both in parallel. Plays Chinese as soon as it arrives; plays English after Chinese (waits for English if not yet ready).
 * @param {string} chinese
 * @param {string} english
 * @param {number} delayMs - pause between Chinese and English
 * @param {boolean} slow - if true, use slowest speed (1) for Chinese (compounds/sentences)
 */
export async function speakChineseThenEnglish(chinese, english, delayMs = 400, slow = false) {
  const optsZh = { lang: "zh", rate: slow ? 0.25 : 0.4, speed: slow ? 1 : 5 };
  const optsEn = { lang: "en", rate: 0.8 };

  // 并行发起请求，不等待两个都完成
  const chinesePromise = fetchTtsAudio(chinese, optsZh);
  const englishPromise = english ? fetchTtsAudio(english, optsEn) : null;

  // 拿到中文就播
  const audioZh = await chinesePromise;
  if (audioZh) {
    await playBase64Audio(audioZh.audioBase64, audioZh.sampleRate);
  } else {
    await fallbackSpeak(chinese, optsZh);
  }

  if (english) {
    await new Promise((r) => setTimeout(r, delayMs));
    // 英文可能已就绪，未就绪则等待
    const audioEn = await englishPromise;
    if (audioEn) {
      await playBase64Audio(audioEn.audioBase64, audioEn.sampleRate);
    } else {
      await fallbackSpeak(english, optsEn);
    }
  }
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking() {
  if (typeof window !== "undefined") {
    window.speechSynthesis?.cancel();
    // Also stop any Audio elements if we track them
  }
}
