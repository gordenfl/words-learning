<template>
  <div class="article-page" :style="{ backgroundColor: theme.background }">
    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p class="loader-text">Loading articles...</p>
    </div>

    <template v-else>
      <header class="header" :style="{ backgroundColor: theme.primary }">
        <h2 class="header-title">Reading</h2>
        <button
          type="button"
          class="generate-btn"
          @click="goToGenerate"
          :disabled="generating"
          aria-label="Generate new article"
        >
          📖+
        </button>
      </header>

      <div class="scroll-content">
        <div v-if="articles.length === 0" class="empty-container">
          <span class="empty-emoji">📚</span>
          <h2 class="empty-title">No Articles Yet</h2>
          <p class="empty-subtext">Generate your first article to start reading!</p>
          <button
            type="button"
            class="generate-first-btn"
            :style="{ backgroundColor: theme.primary, color: theme.textInverse }"
            :disabled="generating"
            @click="goToGenerate"
          >
            Generate New Article
          </button>
        </div>

        <div v-else class="content">
          <router-link
            v-for="a in articles"
            :key="articleId(a)"
            :to="{ name: 'Article', params: { id: articleId(a) } }"
            class="article-card"
          >
            <div class="article-header">
              <span class="article-title">Reading</span>
              <span v-if="a.completed" class="completed-chip">Read</span>
            </div>
            <div class="article-meta">
              <div class="meta-row">
                <span class="meta-label">Generated:</span>
                <span class="meta-value">{{ formatCreatedDate(a.createdAt) }}</span>
              </div>
              <div v-if="a.readAt" class="meta-row">
                <span class="meta-label">Read:</span>
                <span class="meta-value">{{ formatReadDate(a.readAt) }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Words:</span>
                <span class="meta-value">{{ (a.targetWords || []).length }} target words</span>
              </div>
              <span
                class="difficulty-chip"
                :class="a.difficulty"
                :style="difficultyStyle(a.difficulty)"
              >
                {{ difficultyLabel(a.difficulty) }}
              </span>
            </div>
          </router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { articlesAPI } from "../services/api";

const router = useRouter();
const theme = {
  background: "#E3F2FD",
  primary: "#42A5F5",
  success: "#66BB6A",
  warning: "#FFA726",
  accent: "#9C27B0",
  textInverse: "#FFFFFF",
};

const articles = ref([]);
const loading = ref(true);
const generating = ref(false);

function articleId(a) {
  return a.id || a._id;
}

function formatCreatedDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatReadDate(dateString) {
  if (!dateString) return "Not read yet";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function difficultyLabel(d) {
  if (d === "beginner") return "Beginner";
  if (d === "intermediate") return "Intermediate";
  if (d === "advanced") return "Advanced";
  return d || "Intermediate";
}

function difficultyStyle(d) {
  const colors = {
    beginner: { bg: "rgba(102, 187, 106, 0.2)", color: "#66BB6A" },
    intermediate: { bg: "rgba(255, 167, 38, 0.2)", color: "#FFA726" },
    advanced: { bg: "rgba(156, 39, 176, 0.2)", color: "#9C27B0" },
  };
  return colors[d] || colors.intermediate;
}

function goToGenerate() {
  generating.value = true;
  router.push({ name: "Article", params: { id: "new" } });
  generating.value = false;
}

async function load() {
  loading.value = true;
  try {
    const { data } = await articlesAPI.list();
    articles.value = data.articles || [];
  } catch (_) {
    articles.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
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
  gap: 20px;
  background: #E3F2FD;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E8E8E8;
  border-top-color: #42A5F5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loader-text {
  font-size: 17px;
  color: #7F8C8D;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  padding-top: calc(10px + env(safe-area-inset-top, 0px));
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}
.header-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}
.generate-btn {
  padding: 8px 16px;
  font-size: 18px;
  border: none;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  border-radius: 12px;
  cursor: pointer;
}
.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.scroll-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 16px 24px;
  -webkit-overflow-scrolling: touch;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}
.empty-emoji {
  font-size: 64px;
  margin-bottom: 16px;
}
.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: #2C3E50;
  margin: 0 0 8px;
}
.empty-subtext {
  font-size: 16px;
  color: #7F8C8D;
  margin: 0 0 24px;
}
.generate-first-btn {
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 16px;
  cursor: pointer;
}
.generate-first-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.content {
  max-width: 480px;
  margin: 0 auto;
}
.article-card {
  display: block;
  background: #fff;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  text-decoration: none;
  color: inherit;
}
.article-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.article-title {
  font-size: 18px;
  font-weight: 700;
  color: #2C3E50;
}
.completed-chip {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(102, 187, 106, 0.2);
  color: #66BB6A;
}
.article-meta {
  margin-top: 4px;
}
.meta-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  font-size: 14px;
}
.meta-label {
  color: #7F8C8D;
  margin-right: 8px;
}
.meta-value {
  color: #2C3E50;
  font-weight: 500;
}
.difficulty-chip {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 12px;
}
</style>
