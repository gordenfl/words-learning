<template>
  <div class="words-page" :style="{ backgroundColor: theme.background }">
    <!-- Filter bar -->
    <div class="filter-bar">
      <button
        type="button"
        class="filter-chip"
        :class="{ active: statusFilter === '' }"
        @click="setFilter('')"
      >
        All
      </button>
      <button
        type="button"
        class="filter-chip new"
        :class="{ active: statusFilter === 'new' }"
        @click="setFilter('new')"
      >
        New
      </button>
      <button
        type="button"
        class="filter-chip learned"
        :class="{ active: statusFilter === 'learned' }"
        @click="setFilter('learned')"
      >
        Learned
      </button>
    </div>

    <div v-if="loading" class="loader-container">
      <div class="spinner"></div>
      <p class="loader-text">Loading words...</p>
    </div>

    <div v-else class="list-wrap">
      <div v-if="words.length === 0" class="empty-container">
        <span class="empty-emoji">📚</span>
        <h2 class="empty-title">No words found</h2>
        <p class="empty-subtext">Start by scanning books or adding words manually</p>
      </div>

      <router-link
        v-for="w in words"
        :key="w.id"
        :to="{ name: 'WordDetail', params: { id: w.id } }"
        class="word-card"
      >
        <div class="card-header">
          <span
            class="status-chip"
            :class="{
              learned: w.status === 'learned',
              new: w.status === 'new',
            }"
          >
            {{ w.status === "learned" ? "Learned" : "New" }}
          </span>
        </div>
        <div class="word-info">
          <div v-if="w.pinyin" class="pinyin-row">
            <span class="pinyin">{{ w.pinyin }}</span>
            <button
              type="button"
              class="speaker-btn"
              aria-label="Speak"
              @click.prevent="speakWord(w.word)"
            >
              🔊
            </button>
          </div>
          <div class="word-row">
            <span class="word-text">{{ w.word }}</span>
            <div class="actions">
              <template v-if="w.status === 'new'">
                <button
                  type="button"
                  class="action-btn"
                  aria-label="Mark learned"
                  @click.prevent="updateStatus(w.id, 'learned')"
                >
                  ✓
                </button>
              </template>
              <template v-else-if="w.status === 'learned'">
                <button
                  type="button"
                  class="action-btn refresh"
                  aria-label="Mark new"
                  @click.prevent="updateStatus(w.id, 'new')"
                >
                  ↻
                </button>
              </template>
              <button
                type="button"
                class="action-btn delete"
                aria-label="Delete"
                @click.prevent="deleteWord(w.id)"
              >
                🗑
              </button>
            </div>
          </div>
          <p v-if="w.translation" class="translation">{{ w.translation }}</p>
          <p v-if="w.definition" class="definition">{{ w.definition }}</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { wordsAPI } from "../services/api";

const route = useRoute();
const router = useRouter();

const theme = {
  background: "#E3F2FD",
  primary: "#42A5F5",
  success: "#66BB6A",
  warning: "#FFA726",
  error: "#EF5350",
};

const words = ref([]);
const loading = ref(true);
const statusFilter = ref("");

function setFilter(f) {
  statusFilter.value = f;
  router.replace({ path: "/words", query: { filter: f || "all" } });
  load();
}

function syncFilterFromRoute() {
  const q = route.query.filter;
  if (q === "learned" || q === "new") statusFilter.value = q;
  else statusFilter.value = "";
}

async function load() {
  loading.value = true;
  try {
    const { data } = await wordsAPI.list(statusFilter.value ? { status: statusFilter.value } : {});
    const list = data.words || [];
    words.value = list.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
  } catch (_) {
    words.value = [];
  } finally {
    loading.value = false;
  }
}

function speakWord(word) {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "zh-CN";
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  }
}

async function updateStatus(wordId, status) {
  try {
    await wordsAPI.updateStatus(wordId, status);
    const w = words.value.find((x) => x.id === wordId);
    if (w) {
      if ((statusFilter.value === "learned" && status !== "learned") || (statusFilter.value === "new" && status !== "new")) {
        words.value = words.value.filter((x) => x.id !== wordId);
      } else {
        w.status = status;
      }
    }
  } catch (_) {
    alert("Failed to update status");
  }
}

async function deleteWord(wordId) {
  if (!confirm("Are you sure you want to delete this word?")) return;
  try {
    await wordsAPI.delete(wordId);
    words.value = words.value.filter((x) => x.id !== wordId);
  } catch (_) {
    alert("Failed to delete word");
  }
}

onMounted(() => {
  syncFilterFromRoute();
  load();
});
watch(() => route.query.filter, () => {
  syncFilterFromRoute();
  load();
});
</script>

<style scoped>
.words-page {
  min-height: 100vh;
  padding-bottom: 24px;
}
.filter-bar {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #E8E8E8;
}
.filter-chip {
  flex: 1;
  padding: 10px 16px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 20px;
  border: 2px solid #E8E8E8;
  background: #fff;
  color: #7F8C8D;
  cursor: pointer;
}
.filter-chip.active {
  border-color: #42A5F5;
  background: #42A5F5;
  color: #fff;
}
.filter-chip.new.active {
  border-color: #FFA726;
  background: #FFA726;
}
.filter-chip.learned.active {
  border-color: #66BB6A;
  background: #66BB6A;
}

.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  gap: 16px;
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
  margin: 0;
}

.list-wrap {
  padding: 16px 20px;
  max-width: 480px;
  margin: 0 auto;
}
.word-card {
  display: block;
  background: #fff;
  border-radius: 24px;
  padding: 16px 20px;
  margin-bottom: 12px;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.card-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
.status-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 14px;
}
.status-chip.learned {
  background: rgba(102, 187, 106, 0.2);
  color: #66BB6A;
}
.status-chip.new {
  background: rgba(239, 83, 80, 0.2);
  color: #EF5350;
}
.word-info {
  margin: 0;
}
.pinyin-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.pinyin {
  font-size: 20px;
  font-style: italic;
  color: #42A5F5;
}
.speaker-btn {
  padding: 4px 8px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 18px;
}
.word-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.word-text {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
  color: #2C3E50;
  flex: 1;
}
.actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(66, 165, 245, 0.15);
  color: #66BB6A;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
}
.action-btn.refresh {
  color: #FFA726;
  background: rgba(255, 167, 38, 0.15);
}
.action-btn.delete {
  color: #EF5350;
  background: rgba(239, 83, 80, 0.15);
}
.translation {
  font-size: 18px;
  color: #2C3E50;
  margin: 4px 0 0;
}
.definition {
  font-size: 14px;
  color: #7F8C8D;
  margin: 2px 0 0;
}

.empty-container {
  text-align: center;
  padding: 48px 24px;
}
.empty-emoji {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}
.empty-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2C3E50;
  margin: 0 0 8px;
}
.empty-subtext {
  font-size: 1rem;
  color: #7F8C8D;
  margin: 0;
}
</style>
