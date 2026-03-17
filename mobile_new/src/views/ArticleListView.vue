<template>
  <div class="article-list">
    <button @click="generateArticle" :disabled="generating">Generate new article</button>
    <p v-if="loading">Loading...</p>
    <ul v-else class="list">
      <li v-for="a in articles" :key="a.id">
        <router-link :to="{ name: 'Article', params: { id: a.id } }" class="article-item">
          {{ a.title || "Reading" }}
        </router-link>
      </li>
    </ul>
    <p v-if="!loading && articles.length === 0" class="empty">No articles yet. Generate one above.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { articlesAPI } from "../services/api";

const articles = ref([]);
const loading = ref(true);
const generating = ref(false);

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

async function generateArticle() {
  generating.value = true;
  try {
    await articlesAPI.generate();
    await load();
  } catch (_) {}
  finally {
    generating.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.article-list { padding: 1rem; max-width: 480px; margin: 0 auto; }
button { margin-bottom: 1rem; padding: 0.5rem 1rem; background: #4A90E2; color: white; border: none; border-radius: 8px; cursor: pointer; }
button:disabled { opacity: 0.6; }
.list { list-style: none; padding: 0; margin: 0; }
.article-item { display: block; padding: 0.75rem; border-bottom: 1px solid #eee; text-decoration: none; color: #333; }
.empty { color: #666; text-align: center; padding: 2rem; }
</style>
