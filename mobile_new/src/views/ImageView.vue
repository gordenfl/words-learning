<template>
  <div class="image-view-page" :style="{ backgroundColor: theme.background }">
    <!-- Flying words layer (viewport overlay) -->
    <div ref="flyLayer" class="fly-layer" aria-hidden="true"></div>

    <template v-if="!imageDataUrl">
      <div class="no-image">
        <p>No image available</p>
        <router-link to="/" class="back-link">Back to Home</router-link>
      </div>
    </template>

    <template v-else>
      <div class="scroll-content">
        <div class="content">
          <!-- Photo -->
          <div class="image-container">
            <div ref="imageSurface" class="image-surface">
              <img :src="imageDataUrl" alt="Scanned" class="preview-image" />
              <div v-if="processingOCR" class="image-overlay">
                <div class="spinner"></div>
                <p class="overlay-text">Extracting text...</p>
              </div>
            </div>
          </div>

          <!-- Processing card -->
          <div v-if="processingOCR" class="progress-card">
            <div class="spinner large"></div>
            <p class="progress-title">Analyzing Image...</p>
            <p class="progress-text">Extracting characters from the image</p>
          </div>

          <!-- Extracted words (new) -->
          <section
            v-if="ocrCompleted && extractedWords.length > 0"
            ref="extractedSection"
            class="section-card"
          >
            <h2 class="section-title">Extracted Words ({{ extractedWords.length }})</h2>
            <p class="section-hint">Tap to select words you want to learn ({{ selectedWords.length }} selected)</p>
            <div class="words-list">
              <button
                v-for="item in extractedWords"
                :key="item.id"
                type="button"
                class="word-chip"
                :class="{ selected: selectedWords.includes(item.word) }"
                @click="toggleWord(item.word)"
              >
                <span v-if="item.pinyin" class="word-pinyin">{{ item.pinyin }}</span>
                <span class="word-text">{{ item.word }}</span>
              </button>
            </div>
          </section>

          <!-- Already learned -->
          <section v-if="ocrCompleted && knownWords.length > 0" class="section-card">
            <h2 class="section-title known-title">✓ Already Learned ({{ knownWords.length }})</h2>
            <div class="words-list">
              <span
                v-for="item in knownWords"
                :key="item.id"
                class="word-chip known"
              >
                <span v-if="item.pinyin" class="word-pinyin known-pinyin">{{ item.pinyin }}</span>
                <span class="word-text known-text">✓ {{ item.word }}</span>
              </span>
            </div>
          </section>

          <!-- Error / info message -->
          <p v-if="ocrCompleted && errorMessage" class="error-msg">{{ errorMessage }}</p>

          <!-- Add button -->
          <div v-if="ocrCompleted && selectedWords.length > 0" class="action-card">
            <button
              type="button"
              class="add-btn"
              :disabled="addingWords"
              @click="addWords"
            >
              {{ addingWords ? "Adding..." : `Add ${selectedWords.length} word${selectedWords.length > 1 ? "s" : ""} to my list` }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useScanStore } from "../stores/scan";
import { ocrAPI, wordsAPI } from "../services/api";

const theme = {
  background: "#E3F2FD",
  primary: "#42A5F5",
  success: "#66BB6A",
  card: "#FFFFFF",
  text: "#2C3E50",
  textLight: "#7F8C8D",
};

const router = useRouter();
const scanStore = useScanStore();
const imageDataUrl = computed(() => scanStore.imageDataUrl);

const extractedWords = ref([]);
const knownWords = ref([]);
const processingOCR = ref(false);
const ocrCompleted = ref(false);
const selectedWords = ref([]);
const addingWords = ref(false);
const errorMessage = ref("");

const imageSurface = ref(null);
const extractedSection = ref(null);
const flyLayer = ref(null);

function normalizeWords(list, prefix) {
  return (list || []).map((item, index) => {
    if (typeof item === "string") {
      return { word: item, pinyin: "", id: `${prefix}-${index}` };
    }
    return {
      word: item.word || item.character || item.text || item.value || "",
      pinyin: item.pinyin || "",
      id: `${prefix}-${index}`,
    };
  });
}

function animateWordsIntoExtracted(list) {
  // In some iOS WKWebView cases, animations can be janky during heavy OCR; keep it lightweight.
  if (!flyLayer.value || !imageSurface.value || !extractedSection.value) return;
  if (!Array.isArray(list) || list.length === 0) return;

  const sourceRect = imageSurface.value.getBoundingClientRect();
  const targetRect = extractedSection.value.getBoundingClientRect();

  // Start near the bottom edge of the photo; end near the top of the extracted section.
  const startY = sourceRect.bottom - 24;
  const endY = Math.min(window.innerHeight - 24, targetRect.top + 48);

  // Cap number of animated tokens to keep perf stable on older devices.
  const tokens = list.slice(0, 60);

  tokens.forEach((item, idx) => {
    const text = (item?.word || "").trim();
    if (!text) return;

    const el = document.createElement("span");
    el.className = "fly-token";
    el.textContent = text;
    flyLayer.value.appendChild(el);

    const startX = sourceRect.left + 16 + Math.random() * Math.max(16, sourceRect.width - 32);
    const endX = targetRect.left + 24 + Math.random() * Math.max(16, targetRect.width - 48);

    el.style.left = `${startX}px`;
    el.style.top = `${startY}px`;

    const duration = 650 + Math.random() * 350;
    const delay = idx * 55;

    const anim = el.animate(
      [
        { transform: "translate(-50%, -50%) scale(1)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: 0.1 },
        { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.9)`, opacity: 1, offset: 0.9 },
        { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.75)`, opacity: 0 },
      ],
      {
        duration,
        delay,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        fill: "forwards",
      }
    );
    anim.onfinish = () => {
      el.remove();
    };
  });
}

async function runOCR() {
  if (!imageDataUrl.value || processingOCR.value) return;
  processingOCR.value = true;
  ocrCompleted.value = false;
  extractedWords.value = [];
  knownWords.value = [];
  selectedWords.value = [];
  errorMessage.value = "";
  try {
    const res = await ocrAPI.extractText(imageDataUrl.value);
    const data = res.data;
    const newList = normalizeWords(data.newWords, "new");
    const knownList = normalizeWords(data.knownWords, "known");
    extractedWords.value = newList;
    knownWords.value = knownList;
    ocrCompleted.value = true;
    await nextTick();
    animateWordsIntoExtracted(newList);
    if (newList.length === 0 && knownList.length === 0) {
      errorMessage.value = "No Chinese characters detected in the image.";
    } else if (newList.length === 0 && knownList.length > 0) {
      errorMessage.value = `All ${knownList.length} characters detected are already in your vocabulary list.`;
    }
  } catch (err) {
    ocrCompleted.value = true;
    errorMessage.value = err.response?.data?.message || err.response?.data?.error || "Failed to extract text. Please try again.";
  } finally {
    processingOCR.value = false;
  }
}

function toggleWord(word) {
  const i = selectedWords.value.indexOf(word);
  if (i >= 0) {
    selectedWords.value = selectedWords.value.filter((w) => w !== word);
  } else {
    selectedWords.value = [...selectedWords.value, word];
  }
}

async function addWords() {
  if (selectedWords.value.length === 0) return;
  addingWords.value = true;
  try {
    await wordsAPI.batch(selectedWords.value, imageDataUrl.value || "");
    scanStore.clear();
    alert(`Success! ✨ Added ${selectedWords.value.length} new word(s) to your list!`);
    router.replace({ name: "Home" });
  } catch (err) {
    alert(err.response?.data?.error || "Failed to add words. Please try again.");
  } finally {
    addingWords.value = false;
  }
}

onMounted(() => {
  if (!imageDataUrl.value) return;
  runOCR();
});

watch(imageDataUrl, (url) => {
  if (!url) return;
  runOCR();
});
</script>

<style scoped>
.image-view-page {
  min-height: 100vh;
  padding: 0;
}

.fly-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 200;
}

.fly-token {
  position: fixed;
  transform: translate(-50%, -50%);
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #2C3E50;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.02em;
  box-shadow: 0 6px 16px rgba(0,0,0,0.14);
  border: 1px solid rgba(66, 165, 245, 0.22);
  will-change: transform, opacity;
}
.no-image {
  padding: 40px 20px;
  text-align: center;
  color: #7F8C8D;
}
.back-link {
  display: inline-block;
  margin-top: 16px;
  color: #42A5F5;
  text-decoration: none;
}

.scroll-content {
  flex: 1;
  overflow: auto;
  padding-bottom: 24px;
}
.content {
  padding: 20px;
  max-width: 480px;
  margin: 0 auto;
}

.image-container {
  margin-bottom: 20px;
}
.image-surface {
  background: #fff;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.preview-image {
  width: 100%;
  height: 300px;
  object-fit: contain;
  display: block;
}
.image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.overlay-text {
  color: #fff;
  margin: 0;
  font-size: 1rem;
}
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spinner.large {
  width: 48px;
  height: 48px;
  border-top-color: #42A5F5;
  border-color: #E8E8E8;
  margin-bottom: 12px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-card {
  background: #fff;
  border-radius: 24px;
  padding: 28px;
  margin-bottom: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.progress-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2C3E50;
  margin: 0 0 8px;
}
.progress-text {
  font-size: 0.95rem;
  color: #7F8C8D;
  margin: 0;
}

.section-card {
  background: #fff;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2C3E50;
  margin: 0 0 6px;
}
.section-title.known-title {
  color: #66BB6A;
}
.section-hint {
  font-size: 0.9rem;
  color: #7F8C8D;
  font-style: italic;
  margin: 0 0 12px;
}
.words-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.word-chip {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  min-width: 56px;
  padding: 8px 12px;
  border-radius: 16px;
  border: 2px solid #CCCCCC;
  background: #F5F5F5;
  cursor: pointer;
  font: inherit;
}
.word-chip.selected {
  border-color: #42A5F5;
  background: rgba(66, 165, 245, 0.12);
}
.word-chip.known {
  cursor: default;
  border-color: #66BB6A;
  background: rgba(102, 187, 106, 0.12);
}
.word-pinyin {
  font-size: 11px;
  color: #999;
  margin-bottom: 2px;
}
.word-pinyin.known-pinyin {
  color: #66BB6A;
}
.word-text {
  font-size: 18px;
  font-weight: 700;
  color: #999;
}
.word-chip.selected .word-text {
  color: #2C3E50;
}
.word-text.known-text {
  color: #66BB6A;
}

.action-card {
  margin-top: 20px;
}
.add-btn {
  width: 100%;
  padding: 16px 24px;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  background: #42A5F5;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(0,0,0,0.12);
}
.add-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.error-msg {
  color: #7F8C8D;
  font-size: 0.95rem;
  margin: 0 0 16px;
  text-align: center;
}
</style>
