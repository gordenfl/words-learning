<template>
  <div class="article-page" :style="{ backgroundColor: theme.background }">
    <!-- Loading (generating) -->
    <div v-if="loading && !article" class="loading-container">
      <div class="loading-card">
        <span class="loading-emoji">📚</span>
        <div class="spinner"></div>
        <p class="loading-title">Generating Article...</p>
        <p class="loading-subtitle">AI is creating a personalized Chinese reading article for you</p>
      </div>
    </div>

    <!-- Error (need more words or API error) -->
    <div v-else-if="error" class="loading-container">
      <div class="loading-card">
        <span class="loading-emoji">{{ error.type === 'needMoreWords' ? '🎉' : '😔' }}</span>
        <p class="loading-title">{{ error.message }}</p>
        <p class="loading-subtitle">{{ error.suggestion }}</p>
        <button
          type="button"
          class="retry-btn"
          :style="{ backgroundColor: theme.primary, color: theme.textInverse }"
          @click="handleErrorRetry"
        >
          {{ error.type === 'needMoreWords' ? 'Go Home' : 'Try Again' }}
        </button>
      </div>
    </div>

    <!-- Article content -->
    <template v-else-if="article">
      <header class="header" :style="{ backgroundColor: theme.primary }"></header>
      <div class="scroll-content">
        <div class="content">
          <div class="title-row">
            <h1 class="title">Reading</h1>
            <button
              type="button"
              class="read-aloud-btn"
              :style="{ backgroundColor: theme.primary }"
              @click="speakArticle"
              aria-label="Read aloud"
            >
              {{ isReading ? '⏸' : '🔊' }}
            </button>
          </div>
          <div class="meta-row">
            <span class="meta-text">Difficulty: {{ difficultyLabel(article.difficulty) }}</span>
            <span class="meta-text">Words: {{ (article.targetWords || []).length }}</span>
          </div>

          <div class="article-body">
            <div v-for="(para, paraIdx) in parsedParagraphs" :key="paraIdx" class="paragraph">
              <p class="chinese-text">
                <span
                  v-for="(part, i) in highlightParts(para.chinese)"
                  :key="i"
                  :class="{ highlight: part.isTarget }"
                  :style="part.isTarget ? { color: theme.primary } : {}"
                >{{ part.text }}</span>
              </p>
              <p v-if="para.english" class="english-text">{{ para.english }}</p>
            </div>
          </div>

          <div v-if="wordsInContent.length > 0" class="words-section">
            <h3 class="words-title">Target Words</h3>
            <div class="words-grid">
              <router-link
                v-for="(tw, idx) in wordsInContent"
                :key="idx"
                :to="{ name: 'WordDetail', params: { id: wordId(tw) } }"
                class="word-chip"
              >
                <span v-if="wordPinyin(tw)" class="chip-pinyin">{{ wordPinyin(tw) }}</span>
                <span class="chip-word">{{ wordText(tw) }}</span>
              </router-link>
            </div>
          </div>

          <button
            type="button"
            class="complete-btn"
            :style="{ backgroundColor: theme.primary, color: theme.textInverse }"
            @click="markAsRead"
          >
            Complete Article
          </button>
        </div>
      </div>
    </template>

    <!-- No article -->
    <div v-else class="loading-container">
      <p class="error-text">No article available</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { articlesAPI } from "../services/api";

const route = useRoute();
const router = useRouter();

const theme = {
  background: "#E3F2FD",
  primary: "#42A5F5",
  textInverse: "#FFFFFF",
};

const article = ref(null);
const loading = ref(true);
const error = ref(null);
const isReading = ref(false);

const articleId = () => route.params.id;
const isGenerateMode = () => articleId() === "new";

const targetWordTexts = computed(() => {
  const tw = article.value?.targetWords || [];
  return tw.map((t) => wordText(t)).filter(Boolean);
});

const wordsInContent = computed(() => {
  const content = article.value?.content || "";
  const tw = article.value?.targetWords || [];
  return tw.filter((t) => {
    const text = wordText(t);
    if (!text) return false;
    const clean = content.replace(/[\s\.,!?;:，。！？；：\n\r]/g, "");
    return clean.includes(text);
  });
});

function wordId(tw) {
  const w = tw.word;
  if (!w) return null;
  return typeof w === "object" ? (w.id || w._id) : w;
}
function wordText(tw) {
  return tw.word?.word ?? tw.wordText ?? "";
}
function wordPinyin(tw) {
  return tw.word?.pinyin ?? "";
}

function difficultyLabel(d) {
  if (d === "beginner") return "Beginner";
  if (d === "intermediate") return "Intermediate";
  if (d === "advanced") return "Advanced";
  return d || "Intermediate";
}

const ENCOURAGEMENT_KEYWORDS = [
  "great job", "keep exploring", "keep practicing", "great work", "well done",
  "excellent", "congratulations", "keep up", "keep learning", "chinese stories",
  "keep reading", "good job", "nice work",
];

function isEncouragement(text) {
  if (!text || text.length < 5) return false;
  const lower = text.toLowerCase();
  return ENCOURAGEMENT_KEYWORDS.some((k) => lower.includes(k));
}

function parseContent(content) {
  if (!content) return [];
  const lines = content.split("\n");
  const paragraphs = [];
  let currentChinese = [];
  let currentEnglish = null;
  let foundFirstChinese = false;
  let skipTitle = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (currentChinese.length > 0 && currentEnglish) {
        paragraphs.push({ chinese: currentChinese.join("\n"), english: currentEnglish });
        currentChinese = [];
        currentEnglish = null;
      }
      continue;
    }
    if (isEncouragement(line)) continue;
    if (skipTitle && !/[\u4e00-\u9fa5]/.test(line)) {
      skipTitle = false;
      continue;
    }
    const englishMatch = line.match(/^English:\s*(.+)$/i);
    if (englishMatch) {
      let eng = englishMatch[1].trim();
      if (isEncouragement(eng)) continue;
      if (currentChinese.length > 0) {
        paragraphs.push({ chinese: currentChinese.join("\n"), english: eng });
        currentChinese = [];
        currentEnglish = null;
      } else currentEnglish = eng;
    } else if (/[\u4e00-\u9fa5]/.test(line)) {
      foundFirstChinese = true;
      skipTitle = false;
      if (currentChinese.length > 0 && currentEnglish) {
        paragraphs.push({ chinese: currentChinese.join("\n"), english: currentEnglish });
        currentChinese = [];
        currentEnglish = null;
      }
      currentChinese.push(line);
    } else if (
      foundFirstChinese &&
      /[a-zA-Z]/.test(line) &&
      (line.match(/[a-zA-Z]/g) || []).length / line.length > 0.5 &&
      line.length > 8 &&
      currentChinese.length > 0
    ) {
      currentEnglish = currentEnglish ? currentEnglish + " " + line : line;
    }
  }
  if (currentChinese.length > 0) {
    paragraphs.push({
      chinese: currentChinese.join("\n"),
      english: currentEnglish && !isEncouragement(currentEnglish) ? currentEnglish : "",
    });
  }
  if (paragraphs.length === 0) {
    const chineseOnly = lines
      .filter((l) => /[\u4e00-\u9fa5]/.test(l) && !isEncouragement(l))
      .join("\n");
    return [{ chinese: chineseOnly || content, english: "" }];
  }
  return paragraphs;
}

const parsedParagraphs = computed(() => parseContent(article.value?.content || ""));

function highlightParts(text) {
  const words = [...targetWordTexts.value].sort((a, b) => b.length - a.length);
  if (words.length === 0) return [{ text, isTarget: false }];
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isTarget: false });
    }
    parts.push({ text: match[0], isTarget: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isTarget: false });
  }
  return parts.length > 0 ? parts : [{ text, isTarget: false }];
}

function speakWord(text) {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.4;
    window.speechSynthesis.speak(u);
  }
}

function speakArticle() {
  if (!article.value?.content) return;
  if (isReading.value) {
    window.speechSynthesis?.cancel();
    isReading.value = false;
    return;
  }
  const lines = article.value.content.split("\n");
  const chineseLines = lines.filter((l) => l.trim() && /[\u4e00-\u9fa5]/.test(l));
  const chineseContent = chineseLines.join(" ");
  if (typeof window !== "undefined" && window.speechSynthesis) {
    isReading.value = true;
    const u = new SpeechSynthesisUtterance(chineseContent);
    u.lang = "zh-CN";
    u.rate = 0.3;
    u.onend = () => (isReading.value = false);
    u.onerror = () => (isReading.value = false);
    window.speechSynthesis.speak(u);
  }
}

async function generateArticle() {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await articlesAPI.generate(10);
    if (data.needMoreWords) {
      error.value = {
        type: "needMoreWords",
        message: data.message || "Great job! 🎉",
        suggestion: data.suggestion || "Add some new Chinese words to continue your learning journey.",
      };
    } else {
      article.value = data.article;
    }
  } catch (err) {
    error.value = {
      type: "error",
      message: "Oops!",
      suggestion: err.response?.data?.message || err.response?.data?.error || "Failed to generate article",
    };
  } finally {
    loading.value = false;
  }
}

async function loadArticle() {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await articlesAPI.list();
    const list = data.articles || [];
    const id = articleId();
    article.value = list.find((a) => String(a.id || a._id) === id) || null;
  } catch (_) {
    article.value = null;
  } finally {
    loading.value = false;
  }
}

function handleErrorRetry() {
  if (error.value?.type === "needMoreWords") {
    router.push({ name: "Home" });
  } else {
    generateArticle();
  }
}

async function markAsRead() {
  const id = article.value?.id || article.value?._id;
  if (!id) return;
  try {
    await articlesAPI.markRead(id);
    router.push({ name: "ArticleList" });
  } catch (_) {
    router.push({ name: "ArticleList" });
  }
}

onMounted(() => {
  if (isGenerateMode()) {
    generateArticle();
  } else {
    loadArticle();
  }
});

watch(() => route.params.id, (newId) => {
  if (newId === "new") {
    generateArticle();
  } else {
    loadArticle();
  }
});
</script>

<style scoped>
.article-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
}
.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.loading-card {
  background: #fff;
  border-radius: 24px;
  padding: 32px;
  max-width: 360px;
  width: 100%;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.loading-emoji {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}
.spinner {
  width: 40px;
  height: 40px;
  margin: 16px auto;
  border: 3px solid #E8E8E8;
  border-top-color: #42A5F5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-title {
  font-size: 20px;
  font-weight: 700;
  color: #2C3E50;
  margin: 0 0 8px;
}
.loading-subtitle {
  font-size: 16px;
  color: #7F8C8D;
  margin: 0 0 24px;
}
.retry-btn {
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 16px;
  cursor: pointer;
}
.error-text {
  font-size: 18px;
  color: #7F8C8D;
}

.header {
  padding-top: calc(10px + env(safe-area-inset-top, 0px));
  padding-bottom: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}
.scroll-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.content {
  padding: 20px;
  max-width: 480px;
  margin: 0 auto;
  padding-bottom: 48px;
}
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.title {
  font-size: 24px;
  font-weight: 700;
  color: #2C3E50;
  margin: 0;
}
.read-aloud-btn {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  border: none;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.meta-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8E8E8;
}
.meta-text {
  font-size: 14px;
  color: #7F8C8D;
}
.paragraph {
  margin-bottom: 20px;
}
.chinese-text {
  font-size: 18px;
  line-height: 1.8;
  color: #2C3E50;
  margin: 0 0 8px;
}
.highlight {
  font-weight: 700;
  font-size: 20px;
}
.english-text {
  font-size: 15px;
  line-height: 1.6;
  color: #7F8C8D;
  font-style: italic;
  margin: 0 0 0 10px;
  padding-left: 10px;
  border-left: 3px solid #42A5F5;
}
.words-section {
  background: rgba(66, 165, 245, 0.08);
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 24px;
}
.words-title {
  font-size: 18px;
  font-weight: 700;
  color: #2C3E50;
  margin: 0 0 12px;
}
.words-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.word-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 14px;
  background: #fff;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.chip-pinyin {
  font-size: 11px;
  color: #42A5F5;
  margin-bottom: 2px;
}
.chip-word {
  font-size: 18px;
  font-weight: 700;
  color: #2C3E50;
}
.complete-btn {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 16px;
  cursor: pointer;
}
</style>
