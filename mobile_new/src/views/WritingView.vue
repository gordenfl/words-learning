<template>
  <div class="writing-page" :style="{ backgroundColor: theme.background }">
    <div v-if="loading" class="loader-container">
      <div class="spinner"></div>
      <p class="loader-text">Loading...</p>
    </div>
    <template v-else-if="word">
      <div class="content">
        <h2 class="title">Writing Practice</h2>
        <p class="subtitle">{{ word.word }} — Complete 10 rounds of practice</p>
        <div class="slots">
          <button
            v-for="i in 10"
            :key="i"
            type="button"
            class="slot"
            :class="{ done: completedIndices.has(i - 1) }"
            @click="openPractice(i - 1)"
          >
            {{ completedIndices.has(i - 1) ? "✓" : i }}
          </button>
        </div>
      </div>

      <Teleport to="body">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Practice {{ (currentIndex ?? 0) + 1 }}/10</h3>
              <button type="button" class="modal-close" @click="closeModal">×</button>
            </div>
            <div class="stroke-container">
              <div ref="strokeTarget" class="stroke-target"></div>
              <p class="stroke-status">{{ strokeStatus }}</p>
            </div>
          </div>
        </div>
      </Teleport>
    </template>
    <p v-else class="error-text">Word not found</p>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { wordsAPI } from "../services/api";
import { getRandomCongratsPhrase } from "../services/congratsService";
import {
  getWritingCompleted,
  setWritingCompleted,
  getWritingProgress,
  setWritingProgress,
} from "../utils/practiceStorage";

const route = useRoute();
const router = useRouter();
const theme = { background: "#E3F2FD", primary: "#42A5F5" };

const word = ref(null);
const loading = ref(true);
const completedIndices = ref(new Set());
const showModal = ref(false);
const currentIndex = ref(null);
const strokeTarget = ref(null);
const strokeStatus = ref("Ready");
const hanziWriter = ref(null);

const wordId = () => route.params.id;

function loadHanziWriter() {
  if (window.HanziWriter) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/hanzi-writer@3.5.0/dist/hanzi-writer.min.js";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function initWriter() {
  if (!strokeTarget.value || !word.value?.word) return;
  const char = word.value.word.charAt(0) || word.value.word;
  strokeTarget.value.innerHTML = "";
  hanziWriter.value = null;
  loadHanziWriter().then(() => {
    if (!strokeTarget.value || !word.value?.word) return;
    hanziWriter.value = window.HanziWriter.create(strokeTarget.value, char, {
      width: 200,
      height: 200,
      padding: 10,
      showOutline: true,
      strokeAnimationSpeed: 0.5,
      strokeColor: "#333",
      radicalColor: theme.primary,
      outlineColor: "#DDD",
      drawingColor: theme.primary,
      drawingWidth: 5,
      showCharacter: true,
    });
    nextTick(() => startPractice());
  });
}

function startPractice() {
  if (!hanziWriter.value) return;
  strokeStatus.value = "Trace the character...";
  hanziWriter.value.quiz({
    onMistake: () => { strokeStatus.value = "Try again! ❌"; },
    onCorrectStroke: (d) => { strokeStatus.value = `Good! Stroke ${d.strokeNum + 1}`; },
    onComplete: () => {
      strokeStatus.value = "Excellent! ✓";
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const phrase = getRandomCongratsPhrase();
        const u = new SpeechSynthesisUtterance(phrase);
        u.lang = "en-US";
        u.onend = () => completeCurrent();
        window.speechSynthesis.speak(u);
      } else {
        completeCurrent();
      }
    },
  });
}

function completeCurrent() {
  const idx = currentIndex.value;
  if (idx == null) return;
  const next = new Set(completedIndices.value);
  next.add(idx);
  completedIndices.value = next;
  const arr = Array.from(next).sort((a, b) => a - b);
  setWritingProgress(wordId(), arr);
  if (arr.length >= 10) {
    setWritingCompleted(wordId());
    closeModal();
    router.back();
    return;
  }
  closeModal();
}

function openPractice(index) {
  if (completedIndices.value.has(index)) return;
  currentIndex.value = index;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  currentIndex.value = null;
}

watch(showModal, (v) => {
  if (v) nextTick(() => initWriter());
});

async function load() {
  loading.value = true;
  try {
    const { data } = await wordsAPI.get(wordId());
    word.value = data.word;
    if (getWritingCompleted(wordId())) {
      completedIndices.value = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      return;
    }
    const progress = getWritingProgress(wordId());
    completedIndices.value = new Set(progress);
  } catch (_) {
    word.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.writing-page { min-height: 100vh; padding: 24px; }
.loader-container { display: flex; flex-direction: column; align-items: center; padding: 48px; }
.spinner { width: 40px; height: 40px; border: 3px solid #E8E8E8; border-top-color: #42A5F5; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loader-text { margin-top: 12px; color: #7F8C8D; }
.content { max-width: 400px; margin: 0 auto; }
.title { font-size: 24px; margin: 0 0 8px; color: #2C3E50; }
.subtitle { font-size: 16px; color: #7F8C8D; margin: 0 0 24px; }
.slots { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.slot { width: 100%; aspect-ratio: 1; font-size: 20px; font-weight: 600; border-radius: 16px; border: 2px solid #42A5F5; background: #fff; color: #42A5F5; cursor: pointer; }
.slot.done { background: #66BB6A; border-color: #66BB6A; color: #fff; }
.error-text { color: #EF5350; padding: 24px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-content { background: #fff; border-radius: 24px; max-width: 320px; width: 100%; overflow: hidden; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #E8E8E8; }
.modal-header h3 { margin: 0; font-size: 18px; }
.modal-close { width: 36px; height: 36px; font-size: 24px; border: none; background: none; cursor: pointer; color: #7F8C8D; }
.stroke-container { padding: 20px; display: flex; flex-direction: column; align-items: center; }
.stroke-target { width: 200px; height: 200px; }
.stroke-status { margin: 12px 0; font-size: 14px; color: #42A5F5; min-height: 20px; }
</style>
