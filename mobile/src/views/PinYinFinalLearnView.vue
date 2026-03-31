<template>
  <div class="page">
    <header class="top">
      <h1 class="title">Final</h1>
      <p class="desc">Tap the big final to hear four tones in order, or tap a tone below.</p>
    </header>

    <button type="button" class="big" @click="playAll()" :disabled="playing">
      <div class="big-text">{{ finalText }}</div>
      <div class="big-sub">{{ learned ? "Learned" : "Tap to learn" }}</div>
    </button>

    <div class="tones">
      <template v-for="s in toneSlots" :key="s.tone">
        <button
          v-if="s.available"
          type="button"
          class="tone-btn"
          @click="playTone(s.tone)"
          :disabled="playing || !tonesReady"
        >
          <div class="tone-text">{{ toned(s.tone) }}</div>
          <button
            type="button"
            class="mic-btn"
            :class="{ recording: recordingTone === s.tone }"
            :disabled="playing || !tonesReady"
            @click.stop.prevent
            @pointerdown.stop.prevent="onMicDown(s.tone)"
            @pointerup.stop.prevent="onMicUp()"
            @pointercancel.stop.prevent="onMicUp()"
            @pointerleave.stop.prevent="onMicUp()"
          >
            <svg class="mic-ico" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </button>
        <div v-else class="tone-empty" aria-hidden="true"></div>
      </template>
    </div>
    <div v-if="lastMicResult" class="mic-result">{{ lastMicResult }}</div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { applyToneMark } from "../utils/pinyinTone";
import {
  audioUrlForFinalTone,
} from "../utils/pinyinFinalAudio";
import { usePinyinProgressStore } from "../stores/pinyinProgress";

const route = useRoute();
const progress = usePinyinProgressStore();

const finalText = computed(() => {
  const raw = String(route.params.final || "").trim();
  return raw || "a";
});

const learned = computed(() => progress.isFinalLearned(finalText.value));

const playing = ref(false);

const toneOrder = [1, 2, 3, 4];
const toneAvailable = ref({ 1: true, 2: true, 3: true, 4: true });
const tonesReady = ref(false);

let activeDemoAudio = null;
const recordingTone = ref(0);
let micSession = null;
let micPitchSamples = [];
let micRaf = 0;
const lastMicResult = ref("");
const refPitchCache = new Map();

function toned(tone) {
  return applyToneMark(finalText.value, tone);
}

/** Gap after each tone when playing all four in order (ms). */
const PAUSE_BETWEEN_TONES_MS = 650;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stopDemoAudio() {
  if (activeDemoAudio) {
    try {
      activeDemoAudio.pause();
    } catch {
      /* ignore */
    }
    activeDemoAudio = null;
  }
}

function canUseSpeech() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

function speakEncourage(text) {
  if (!canUseSpeech()) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

function randomEncouragement() {
  const list = ["对了！", "很好！", "太棒了！", "继续！", "发音很准！"];
  return list[Math.floor(Math.random() * list.length)];
}

async function audioExists(url) {
  if (!url) return false;
  try {
    // Some dev/prod setups may return 200 + text/html (SPA fallback) for missing files.
    // We only treat it as "exists" if it looks like an audio response.
    const r = await fetch(url, { method: "GET", cache: "no-store" });
    if (!r.ok) return false;
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("text/html")) return false;
    if (ct.startsWith("audio/")) return true;
    if (ct.includes("mpeg") || ct.includes("mp3") || ct.includes("octet-stream")) return true;
    return false;
  } catch {
    return false;
  }
}

async function refreshToneAvailability() {
  tonesReady.value = false;
  lastMicResult.value = "";
  recordingTone.value = 0;
  await stopMicSession();
  stopDemoAudio();

  const entries = await Promise.all(
    toneOrder.map(async (t) => {
      const url = audioUrlForFinalTone(finalText.value, t);
      const ok = await audioExists(url);
      return [t, ok];
    })
  );
  const next = { 1: false, 2: false, 3: false, 4: false };
  for (const [t, ok] of entries) next[t] = ok;
  toneAvailable.value = next;
  tonesReady.value = true;
}

/** Play clip; returns true if playback finished, false if skipped/failed. */
function playDemoUrl(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      activeDemoAudio = null;
      resolve(ok);
    };
    try {
      stopDemoAudio();
      const a = new Audio(url);
      activeDemoAudio = a;
      a.playbackRate = 0.85;
      a.onended = () => done(true);
      a.onerror = () => done(false);
      const p = a.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => done(false));
      }
    } catch {
      done(false);
    }
  });
}

async function playOne(tone) {
  const url = audioUrlForFinalTone(finalText.value, tone);
  if (!url) return;
  await playDemoUrl(url);
}

function dtwDistance(a, b, band = 12) {
  if (!a.length || !b.length) return Infinity;
  const n = a.length;
  const m = b.length;
  const w = Math.max(band, Math.abs(n - m));

  const INF = 1e18;
  let prev = new Float64Array(m + 1);
  let curr = new Float64Array(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = INF;
  prev[0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 0; j <= m; j++) curr[j] = INF;
    const jStart = Math.max(1, i - w);
    const jEnd = Math.min(m, i + w);
    for (let j = jStart; j <= jEnd; j++) {
      const cost = Math.abs(a[i - 1] - b[j - 1]);
      const bestPrev = Math.min(prev[j], curr[j - 1], prev[j - 1]);
      curr[j] = cost + bestPrev;
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }
  return prev[m];
}

function normalizePitchContour(pitchesHz) {
  const voiced = pitchesHz.filter((p) => p >= 70 && p <= 500);
  if (voiced.length < 12) return [];

  const smoothed = [];
  const win = 5;
  for (let i = 0; i < voiced.length; i++) {
    const s = Math.max(0, i - Math.floor(win / 2));
    const e = Math.min(voiced.length, i + Math.ceil(win / 2));
    smoothed.push(median(voiced.slice(s, e)));
  }

  const log = smoothed.map((p) => Math.log(p));
  const mean = log.reduce((acc, v) => acc + v, 0) / log.length;
  const varr = log.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / log.length;
  const std = Math.sqrt(Math.max(1e-9, varr));
  return log.map((v) => (v - mean) / std);
}

async function fetchAudioBuffer(url) {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`audio fetch failed: ${res.status}`);
  const arr = await res.arrayBuffer();
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  try {
    return await ctx.decodeAudioData(arr);
  } finally {
    try {
      await ctx.close();
    } catch {
      /* ignore */
    }
  }
}

function pitchContourFromAudioBuffer(audioBuffer) {
  const sr = audioBuffer.sampleRate;
  const ch0 = audioBuffer.getChannelData(0);

  const windowSize = 2048;
  const hop = 512;
  const buf = new Float32Array(windowSize);
  const pitches = [];

  for (let pos = 0; pos + windowSize <= ch0.length; pos += hop) {
    buf.set(ch0.subarray(pos, pos + windowSize));
    const hz = detectPitchHz(buf, sr);
    if (hz) pitches.push(hz);
  }
  return pitches;
}

async function getReferenceContour(url) {
  if (!url) return [];
  if (refPitchCache.has(url)) return refPitchCache.get(url);
  const ab = await fetchAudioBuffer(url);
  const contour = pitchContourFromAudioBuffer(ab);
  refPitchCache.set(url, contour);
  return contour;
}

function median(values) {
  if (!values.length) return 0;
  const a = [...values].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

// Basic autocorrelation pitch detection. Returns Hz or 0 if unknown.
function detectPitchHz(timeDomain, sampleRate) {
  const n = timeDomain.length;
  let rms = 0;
  for (let i = 0; i < n; i++) rms += timeDomain[i] * timeDomain[i];
  rms = Math.sqrt(rms / n);
  if (rms < 0.01) return 0;

  let bestOffset = -1;
  let bestCorr = 0;
  const minLag = Math.floor(sampleRate / 500); // 500Hz
  const maxLag = Math.floor(sampleRate / 70); // 70Hz

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < n - lag; i++) corr += timeDomain[i] * timeDomain[i + lag];
    corr = corr / (n - lag);
    if (corr > bestCorr) {
      bestCorr = corr;
      bestOffset = lag;
    }
  }
  if (bestCorr < 0.02 || bestOffset <= 0) return 0;
  return sampleRate / bestOffset;
}

function classifyToneFromPitch(pitchesHz) {
  // Keep plausible voiced samples and smooth with median.
  const voiced = pitchesHz.filter((p) => p >= 70 && p <= 500);
  if (voiced.length < 12) return 0;

  // Smooth via sliding median.
  const smoothed = [];
  const win = 5;
  for (let i = 0; i < voiced.length; i++) {
    const s = Math.max(0, i - Math.floor(win / 2));
    const e = Math.min(voiced.length, i + Math.ceil(win / 2));
    smoothed.push(median(voiced.slice(s, e)));
  }

  const start = median(smoothed.slice(0, Math.min(6, smoothed.length)));
  const end = median(smoothed.slice(Math.max(0, smoothed.length - 6)));
  const min = Math.min(...smoothed);
  const max = Math.max(...smoothed);
  const range = Math.max(1, max - min);
  const overallSlope = (end - start) / range;

  // Tone 1: fairly flat
  const flatness = range / Math.max(1, median(smoothed));
  if (flatness < 0.08 && Math.abs(overallSlope) < 0.15) return 1;

  // Tone 2: rising
  if (overallSlope > 0.35 && end > start) return 2;

  // Tone 4: falling
  if (overallSlope < -0.35 && start > end) return 4;

  // Tone 3: dip then rise
  const minIdx = smoothed.indexOf(min);
  const midLo = minIdx > smoothed.length * 0.2 && minIdx < smoothed.length * 0.8;
  const dipDepthOk = (start - min) / range > 0.25 && (end - min) / range > 0.25;
  if (midLo && dipDepthOk) return 3;

  return 0;
}

async function stopMicSession() {
  if (!micSession) return;
  try {
    if (micRaf) cancelAnimationFrame(micRaf);
  } catch {
    /* ignore */
  }
  micRaf = 0;

  try {
    micSession.stream?.getTracks?.().forEach((t) => t.stop());
  } catch {
    /* ignore */
  }

  try {
    await micSession.audioContext?.close?.();
  } catch {
    /* ignore */
  }

  micSession = null;
}

async function onMicDown(tone) {
  if (playing.value) return;
  if (recordingTone.value) return;
  if (!toneAvailable.value[tone]) return;
  recordingTone.value = tone;
  micPitchSamples = [];
  lastMicResult.value = "";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);

    micSession = { stream, audioContext, analyser, buf };

    const tick = () => {
      if (!micSession) return;
      micSession.analyser.getFloatTimeDomainData(micSession.buf);
      const hz = detectPitchHz(micSession.buf, micSession.audioContext.sampleRate);
      if (hz) micPitchSamples.push(hz);
      micRaf = requestAnimationFrame(tick);
    };
    micRaf = requestAnimationFrame(tick);
  } catch {
    recordingTone.value = 0;
    await stopMicSession();
  }
}

async function onMicUp() {
  const tone = recordingTone.value;
  if (!tone) return;
  recordingTone.value = 0;

  const samples = micPitchSamples.slice();
  micPitchSamples = [];
  await stopMicSession();

  const url = audioUrlForFinalTone(finalText.value, tone);
  if (!url) {
    lastMicResult.value = "No reference audio";
    return;
  }

  try {
    const refContour = await getReferenceContour(url);
    const a = normalizePitchContour(samples);
    const b = normalizePitchContour(refContour);
    if (!a.length || !b.length) {
      lastMicResult.value = "Too quiet";
      return;
    }

    const dist = dtwDistance(a, b, 14);
    const norm = dist / Math.max(1, a.length + b.length);
    const ok = norm < 0.22;

    lastMicResult.value = ok ? "OK" : "Try again";
    if (ok) speakEncourage(randomEncouragement());
  } catch {
    lastMicResult.value = "Compare failed";
  }
}

async function playTone(tone) {
  if (playing.value) return;
  if (!toneAvailable.value[tone]) return;
  playing.value = true;
  progress.markFinalLearned(finalText.value);
  await playOne(tone);
  playing.value = false;
}

async function playAll() {
  if (playing.value) return;
  playing.value = true;
  progress.markFinalLearned(finalText.value);
  const seq = toneOrder.filter((t) => toneAvailable.value[t]);
  for (let i = 0; i < seq.length; i++) {
    const t = seq[i];
    // eslint-disable-next-line no-await-in-loop
    await playOne(t);
    if (i < seq.length - 1) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(PAUSE_BETWEEN_TONES_MS);
    }
  }
  playing.value = false;
}

const toneSlots = computed(() =>
  toneOrder.map((t) => ({ tone: t, available: !!toneAvailable.value[t] }))
);

watch(finalText, refreshToneAvailability, { immediate: true });
</script>

<style scoped>
.page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  padding: 16px;
  overflow: auto;
}
.top {
  padding: 6px 4px 10px;
}
.title {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
  color: #2c3e50;
}
.desc {
  margin: 6px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: #7f8c8d;
}
.big {
  margin-top: 10px;
  border: none;
  width: 100%;
  border-radius: 24px;
  padding: 26px 18px;
  background: linear-gradient(135deg, rgba(66, 165, 245, 0.16), rgba(102, 187, 106, 0.10));
  border: 1px solid rgba(66, 165, 245, 0.18);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  cursor: pointer;
}
.big:active {
  transform: translateY(1px);
}
.big:disabled {
  opacity: 0.7;
  cursor: default;
}
.big-text {
  font-family: var(--sans);
  font-size: 72px;
  font-weight: 900;
  line-height: 1;
  color: #2c3e50;
  letter-spacing: 0.02em;
}
.big-sub {
  margin-top: 10px;
  font-size: 14px;
  font-weight: 900;
  color: #7f8c8d;
}
.tones {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.mic-result {
  margin-top: 10px;
  font-size: 12px;
  font-weight: 800;
  color: #7f8c8d;
}
.tone-empty {
  border-radius: 18px;
  border: 1px dashed #ededed;
  background: transparent;
  min-height: 64px;
}
.tone-btn {
  border-radius: 18px;
  border: 1px solid #e8e8e8;
  background: #fff;
  padding: 14px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  cursor: pointer;
}
.tone-btn:active {
  transform: translateY(1px);
}
.tone-btn:disabled {
  opacity: 0.7;
  cursor: default;
}
.tone-num {
  display: none;
}
.tone-text {
  font-family: var(--sans);
  font-size: 28px;
  font-weight: 900;
  color: #2c3e50;
}

.mic-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid #e8e8e8;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
}

.mic-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.mic-btn.recording {
  border-color: rgba(239, 68, 68, 0.45);
  background: rgba(239, 68, 68, 0.08);
  color: rgb(239, 68, 68);
}

.mic-ico {
  width: 18px;
  height: 18px;
}
.hint {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 167, 38, 0.3);
  background: rgba(255, 167, 38, 0.10);
  color: #2c3e50;
  font-size: 13px;
  font-weight: 800;
}
.audio-hint {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(66, 165, 245, 0.22);
  background: rgba(66, 165, 245, 0.08);
  color: #2c3e50;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.45;
}
.audio-hint-muted {
  border-color: #e8e8e8;
  background: #f7f9fb;
  color: #7f8c8d;
}
.code {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.06);
}
</style>

