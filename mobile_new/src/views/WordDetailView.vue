<template>
  <div class="word-detail" :style="{ backgroundColor: theme.background }">
    <div v-if="loading" class="loader-container">
      <div class="spinner"></div>
      <p class="loader-text">Loading word...</p>
    </div>

    <template v-else-if="word">
      <div class="scroll-wrap">
        <div class="content">
          <!-- Main Card -->
          <div class="main-card">
            <span
              class="status-chip"
              :class="{
                learned: word.status === 'learned',
                new: word.status === 'new',
              }"
            >
              {{ word.status === "learned" ? "Learned" : "New" }}
            </span>
            <div class="main-card-actions">
              <button
                type="button"
                class="speaker-btn"
                aria-label="Speak"
                @click="speakWord(word.word)"
              >
                🔊
              </button>
            </div>
            <p v-if="word.pinyin" class="pinyin">{{ word.pinyin }}</p>
            <div class="word-row" role="button" tabindex="0" @click="showStrokeOrder = true" @keydown.enter="showStrokeOrder = true">
              <span class="word-text">{{ word.word }}</span>
            </div>
            <p v-if="word.translation" class="translation">{{ word.translation }}</p>
            <button
              type="button"
              class="delete-btn"
              aria-label="Delete word"
              @click="deleteWord"
            >
              🗑
            </button>
          </div>

          <!-- Progress hint -->
          <div v-if="word.status === 'new'" class="progress-hint">
            Complete Writing practice and view Example Sentences to mark as Learned.
          </div>
          <div v-else class="actions-row">
            <button type="button" class="action-btn refresh" @click="updateStatus('new')">
              ↻ Mark as New
            </button>
          </div>

          <!-- Writing -->
          <div class="section-card">
            <router-link :to="{ name: 'Writing', params: { id: word.id } }" class="writing-progress-link">
              <div class="writing-progress-bar">
                <div
                  class="writing-progress-fill"
                  :class="{ complete: writingProgress.done >= writingProgress.total }"
                  :style="{ width: `${(writingProgress.done / writingProgress.total) * 100}%` }"
                ></div>
              </div>
              <span class="writing-progress-text">
                {{ isWritingDone ? "✓ " : "" }}✏️ Writing Practice {{ writingProgress.done }}/{{ writingProgress.total }}
              </span>
            </router-link>
          </div>

          <!-- Word Compounds -->
          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title">📚 Word Compounds</h3>
              <button
                v-if="word.compounds?.length"
                type="button"
                class="refresh-icon"
                :disabled="generatingCompounds"
                @click="generateDetails(true, 'compounds')"
              >
                ↻
              </button>
            </div>
            <div v-if="generatingDetails || generatingCompounds" class="generating">
              <div class="spinner small"></div>
            </div>
            <div v-else-if="word.compounds?.length" class="compound-list">
              <div
                v-for="(c, i) in word.compounds"
                :key="i"
                class="compound-item"
                @click="speakCompound(c.word, c.meaning)"
              >
                <div class="compound-left">
                  <span class="compound-word">{{ c.word }}</span>
                  <span v-if="c.pinyin" class="compound-pinyin">[{{ c.pinyin }}]</span>
                </div>
                <span v-if="c.meaning" class="compound-meaning">{{ c.meaning }}</span>
              </div>
            </div>
            <p v-else class="empty-text">No compounds yet. Generate below.</p>
          </div>

          <!-- Example Sentences -->
          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title">💬 Example Sentences</h3>
              <button
                v-if="word.examples?.length"
                type="button"
                class="refresh-icon"
                :disabled="generatingExamples"
                @click="generateDetails(true, 'examples')"
              >
                ↻
              </button>
            </div>
            <div v-if="generatingDetails || generatingExamples" class="generating">
              <div class="spinner small"></div>
            </div>
            <div v-else-if="word.examples?.length" class="example-list">
              <div
                v-for="(e, i) in word.examples"
                :key="i"
                class="example-item"
                @click="speakExample(typeof e === 'string' ? e : e.chinese, typeof e === 'string' ? '' : e.english)"
              >
                <template v-if="typeof e === 'string'">
                  <span class="example-text">{{ e }}</span>
                </template>
                <template v-else>
                  <div class="example-line1">
                    <ruby v-for="(pair, j) in charPinyinPairs(e)" :key="j">
                      <span>{{ pair.char }}</span>
                      <rt v-if="pair.pinyin">{{ pair.pinyin }}</rt>
                    </ruby>
                  </div>
                  <div v-if="e.english" class="example-line2">{{ e.english }}</div>
                </template>
              </div>
            </div>
            <p v-else class="empty-text">No examples yet. Generate below.</p>
          </div>

          <!-- Definition -->
          <div v-if="word.definition" class="section-card">
            <h3 class="section-title">Definition</h3>
            <p class="definition">{{ word.definition }}</p>
          </div>

          <!-- Generate details -->
          <div class="section-card">
            <button
              type="button"
              class="generate-btn"
              :disabled="generatingDetails"
              @click="generateDetails(true, 'both')"
            >
              {{ generatingDetails ? "Generating..." : "✨ Generate details (AI)" }}
            </button>
          </div>
        </div>
      </div>

      <!-- Stroke Order Modal -->
      <Teleport to="body">
        <div v-if="showStrokeOrder" class="modal-overlay" @click.self="showStrokeOrder = false">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Stroke Order</h3>
              <button type="button" class="modal-close" @click="showStrokeOrder = false">×</button>
            </div>
            <div class="stroke-container">
              <div ref="strokeTarget" class="stroke-target"></div>
              <div class="stroke-controls">
                <button type="button" class="stroke-ctrl-btn" @click="animateStroke">▶️ Animate</button>
                <button type="button" class="stroke-ctrl-btn" @click="practiceStroke">✏️ Practice</button>
              </div>
              <p class="stroke-status">{{ strokeStatus }}</p>
            </div>
          </div>
        </div>
      </Teleport>
    </template>

    <div v-else class="error-wrap">
      <p class="error-text">Word not found</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { wordsAPI } from "../services/api";
import { speakChinese, speakChineseThenEnglish, speakEnglish } from "../services/speechService";
import {
  isWritingCompleted,
  isAllPracticesCompleted,
  getWritingProgress,
} from "../utils/practiceStorage";

const route = useRoute();
const router = useRouter();

const theme = {
  background: "#E3F2FD",
  primary: "#42A5F5",
  success: "#66BB6A",
  warning: "#FFA726",
  error: "#EF5350",
};

const word = ref(null);
const loading = ref(true);
const generatingDetails = ref(false);
const generatingCompounds = ref(false);
const generatingExamples = ref(false);
const showStrokeOrder = ref(false);
const strokeTarget = ref(null);
const strokeStatus = ref("Ready");
const hanziWriter = ref(null);

const wordId = () => route.params.id;

const isWritingDone = computed(() => word.value && isWritingCompleted(wordId()));
const writingProgress = computed(() => {
  if (!word.value) return { done: 0, total: 10 };
  if (isWritingCompleted(wordId())) return { done: 10, total: 10 };
  const arr = getWritingProgress(wordId());
  return { done: Math.min(arr.length, 10), total: 10 };
});
async function load() {
  loading.value = true;
  try {
    const { data } = await wordsAPI.get(wordId());
    word.value = data.word;
    if (word.value && (!word.value.compounds?.length || !word.value.examples?.length)) {
      generateDetails(false, "both");
    }
    if (word.value?.status === "new" && isAllPracticesCompleted(wordId(), word.value)) {
      await updateStatus("learned");
    }
  } catch (_) {
    word.value = null;
  } finally {
    loading.value = false;
  }
}

function speakWord(text, slow = false) {
  speakChinese(text, slow ? 0.4 : 0.8);
}

function charPinyinPairs(ex) {
  const chinese = ex.chinese || "";
  const pinyin = (ex.pinyin || "").trim().split(/\s+/).filter(Boolean);
  const chars = [...chinese];
  let si = 0;
  return chars.map((c) => {
    const isCjk = /[\u4e00-\u9fa5]/.test(c);
    return {
      char: c,
      pinyin: isCjk && pinyin[si] ? pinyin[si++] : "",
    };
  });
}

function speakCompound(chinese, english) {
  speakChineseThenEnglish(chinese, english, 400, true); // slowest for compounds
}

function speakExample(chinese, english) {
  speakChineseThenEnglish(chinese, english, 0, true); // 读完中文立即读英文
}

async function generateDetails(force, updateType) {
  if (updateType === "compounds") generatingCompounds.value = true;
  else if (updateType === "examples") generatingExamples.value = true;
  else generatingDetails.value = true;
  try {
    const { data } = await wordsAPI.generateDetails(wordId(), { force, updateType });
    word.value = data.word;
  } catch (_) {
    if (force) alert("Failed to generate details");
  } finally {
    generatingDetails.value = false;
    generatingCompounds.value = false;
    generatingExamples.value = false;
  }
}

async function updateStatus(status) {
  try {
    await wordsAPI.updateStatus(wordId(), status);
    word.value = { ...word.value, status };
  } catch (_) {
    alert("Failed to update status");
  }
}

async function deleteWord() {
  if (!confirm("Are you sure you want to delete this word?")) return;
  try {
    await wordsAPI.delete(wordId());
    router.replace({ name: "WordsList", query: { filter: "all" } });
  } catch (_) {
    alert("Failed to delete word");
  }
}

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

function initStrokeWriter() {
  if (!strokeTarget.value || !word.value?.word) return;
  const char = word.value.word.length > 0 ? word.value.word.charAt(0) : "";
  if (!char) return;
  strokeStatus.value = "Initializing...";
  hanziWriter.value = null;
  strokeTarget.value.innerHTML = "";
  loadHanziWriter()
    .then(() => {
      if (!strokeTarget.value || !word.value?.word) return;
      hanziWriter.value = window.HanziWriter.create(strokeTarget.value, char, {
        width: 280,
        height: 280,
        padding: 15,
        showOutline: true,
        strokeAnimationSpeed: 0.5,
        delayBetweenStrokes: 600,
        strokeColor: "#333",
        radicalColor: theme.primary,
        outlineColor: "#DDD",
        drawingColor: theme.primary,
        drawingWidth: 6,
        showCharacter: true,
      });
      strokeStatus.value = "Ready!";
    })
    .catch(() => {
      strokeStatus.value = "Failed to load HanziWriter";
    });
}

function animateStroke() {
  if (!hanziWriter.value) return;
  strokeStatus.value = "Playing...";
  hanziWriter.value.animateCharacter({ onComplete: () => { strokeStatus.value = "Done!"; } });
}

function practiceStroke() {
  if (!hanziWriter.value) return;
  strokeStatus.value = "Practice mode...";
  hanziWriter.value.quiz({
    onMistake: () => { strokeStatus.value = "Try again! ❌"; },
    onCorrectStroke: (d) => { strokeStatus.value = `Good! ✓ Stroke ${d.strokeNum + 1}`; },
    onComplete: () => {
      strokeStatus.value = "Perfect! 完成！🎉";
      speakEnglish("Excellent");
    },
  });
}

watch(showStrokeOrder, (v) => {
  if (v) nextTick(() => initStrokeWriter());
});

onMounted(load);
</script>

<style scoped>
.word-detail {
  min-height: 100vh;
  padding-bottom: 24px;
}
.loader-container,
.error-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  padding: 24px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E8E8E8;
  border-top-color: #42A5F5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spinner.small {
  width: 24px;
  height: 24px;
  border-width: 2px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loader-text {
  margin-top: 12px;
  color: #7F8C8D;
  font-size: 16px;
}
.error-text {
  font-size: 18px;
  color: #7F8C8D;
}

.scroll-wrap {
  overflow-y: auto;
  max-height: calc(100vh - 60px);
  padding-bottom: 100px;
}
.content {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px 20px;
}

.status-chip {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 5;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  animation: status-float 2.5s ease-in-out infinite;
}
@keyframes status-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.status-chip.learned {
  background: #66BB6A;
  color: #fff;
}
.status-chip.new {
  background: #EF5350;
  color: #fff;
}

.main-card {
  background: #fff;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  position: relative;
}
.main-card-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
}
.main-card-actions .speaker-btn {
  padding: 8px;
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
}
.pinyin {
  font-size: 22px;
  font-style: italic;
  color: #42A5F5;
  text-align: center;
  margin: 0 0 8px;
}
.word-row {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
  cursor: pointer;
}
.word-text {
  font-size: 72px;
  font-weight: 700;
  color: #2C3E50;
  line-height: 1.2;
}
.translation {
  font-size: 18px;
  color: #2C3E50;
  text-align: center;
  margin: 0 0 4px;
}
.delete-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  padding: 6px 12px;
  font-size: 14px;
  color: #EF5350;
  background: rgba(239, 83, 80, 0.1);
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.progress-hint {
  font-size: 14px;
  color: #7F8C8D;
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(66, 165, 245, 0.08);
  border-radius: 12px;
}
.section-btn-link {
  display: block;
  text-decoration: none;
}
.writing-progress-link {
  display: block;
  text-decoration: none;
  padding: 4px 0;
}
.writing-progress-bar {
  height: 36px;
  background: #E0E0E0;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
}
.writing-progress-fill {
  height: 100%;
  background: #42A5F5;
  border-radius: 12px 0 0 12px;
  transition: width 0.3s ease;
}
.writing-progress-fill.complete {
  border-radius: 12px;
}
.writing-progress-text {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #2C3E50;
  text-align: center;
}
.actions-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.action-btn {
  flex: 1;
  padding: 10px 16px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
}
.action-btn.learned {
  background: rgba(102, 187, 106, 0.2);
  color: #66BB6A;
}
.action-btn.refresh {
  background: rgba(255, 167, 38, 0.2);
  color: #FFA726;
}

.section-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.section-title {
  font-size: 17px;
  font-weight: 700;
  color: #2C3E50;
  margin: 0;
}
.refresh-icon {
  padding: 4px 8px;
  font-size: 18px;
  background: none;
  border: none;
  color: #42A5F5;
  cursor: pointer;
}
.refresh-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.generating {
  display: flex;
  justify-content: center;
  padding: 16px;
}
.compound-list,
.example-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.compound-item,
.example-item {
  padding: 12px 16px;
  background: #F5F5F5;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.compound-left {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.compound-word {
  font-size: 24px;
  font-weight: 600;
  color: #2C3E50;
}
.compound-pinyin {
  font-size: 14px;
  font-style: italic;
  color: #42A5F5;
}
.compound-meaning {
  font-size: 15px;
  color: #7F8C8D;
  flex-shrink: 0;
}
.example-item {
  flex-direction: column;
  align-items: flex-start;
}
.example-line1 {
  font-size: 18px;
  font-weight: 500;
  color: #2C3E50;
  line-height: 1.8;
  margin-bottom: 4px;
}
.example-line1 ruby {
  ruby-position: over;
  ruby-align: center;
}
.example-line1 rt {
  font-size: 10px;
  color: #42A5F5;
  font-style: italic;
}
.example-line2 {
  font-size: 13px;
  color: #7F8C8D;
}
.example-text {
  font-size: 16px;
  color: #2C3E50;
}
.empty-text {
  font-size: 15px;
  color: #7F8C8D;
  font-style: italic;
  margin: 0;
}
.definition {
  font-size: 16px;
  line-height: 1.5;
  color: #2C3E50;
  margin: 8px 0 0;
}

.section-btn {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
}
.section-btn.primary {
  background: #42A5F5;
  color: #fff;
}
.section-btn.secondary {
  background: #66BB6A;
  color: #fff;
}
.section-btn.accent {
  background: #FFA726;
  color: #fff;
}
.section-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.generate-btn {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #42A5F5, #66BB6A);
  color: #fff;
  cursor: pointer;
}
.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Stroke modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.modal-content {
  background: #fff;
  border-radius: 24px;
  max-width: 360px;
  width: 100%;
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #E8E8E8;
}
.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #2C3E50;
}
.modal-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  line-height: 1;
  border: none;
  background: none;
  color: #7F8C8D;
  cursor: pointer;
}
.stroke-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stroke-target {
  width: 280px;
  height: 280px;
  margin: 0 auto;
}
.stroke-controls {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
.stroke-ctrl-btn {
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 20px;
  border: none;
  background: #42A5F5;
  color: #fff;
  cursor: pointer;
}
.stroke-status {
  margin-top: 12px;
  font-size: 14px;
  color: #42A5F5;
  min-height: 20px;
}
</style>
