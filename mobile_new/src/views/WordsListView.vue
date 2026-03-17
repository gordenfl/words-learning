<template>
  <div class="words-list">
    <div class="toolbar">
      <select v-model="statusFilter" @change="load">
        <option value="">All</option>
        <option value="unknown">Unknown</option>
        <option value="known">Known</option>
      </select>
    </div>
    <p v-if="loading">Loading...</p>
    <ul v-else class="list">
      <li v-for="w in words" :key="w.id">
        <router-link :to="{ name: 'WordDetail', params: { id: w.id } }" class="word-item">
          <span class="word">{{ w.word }}</span>
          <span class="meta">{{ w.pinyin }} · {{ w.status }}</span>
        </router-link>
      </li>
    </ul>
    <p v-if="!loading && words.length === 0" class="empty">No words yet. Add from Home or camera.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { wordsAPI } from "../services/api";

const words = ref([]);
const loading = ref(true);
const statusFilter = ref("");

async function load() {
  loading.value = true;
  try {
    const { data } = await wordsAPI.list(statusFilter ? { status: statusFilter } : {});
    words.value = data.words || [];
  } catch (_) {
    words.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.words-list { padding: 1rem; max-width: 480px; margin: 0 auto; }
.toolbar { margin-bottom: 1rem; }
.toolbar select { padding: 0.5rem; border-radius: 8px; }
.list { list-style: none; padding: 0; margin: 0; }
.word-item {
  display: block;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  text-decoration: none;
  color: #333;
}
.word { font-weight: 600; font-size: 1.1rem; }
.meta { display: block; font-size: 0.85rem; color: #666; margin-top: 0.25rem; }
.empty { color: #666; text-align: center; padding: 2rem; }
</style>
