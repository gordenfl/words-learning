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
      <button
        v-for="t in toneOrder"
        :key="t"
        type="button"
        class="tone-btn"
        @click="playTone(t)"
        :disabled="playing"
      >
        <div class="tone-text">{{ toned(t) }}</div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
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

let activeDemoAudio = null;

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

async function playTone(tone) {
  playing.value = true;
  progress.markFinalLearned(finalText.value);
  await playOne(tone);
  playing.value = false;
}

async function playAll() {
  playing.value = true;
  progress.markFinalLearned(finalText.value);
  for (let i = 0; i < toneOrder.length; i++) {
    const t = toneOrder[i];
    // eslint-disable-next-line no-await-in-loop
    await playOne(t);
    if (i < toneOrder.length - 1) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(PAUSE_BETWEEN_TONES_MS);
    }
  }
  playing.value = false;
}
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
.tone-btn {
  border-radius: 18px;
  border: 1px solid #e8e8e8;
  background: #fff;
  padding: 14px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
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

