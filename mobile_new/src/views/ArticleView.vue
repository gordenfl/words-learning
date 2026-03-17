<template>
  <div class="article-view">
    <p v-if="loading">Loading...</p>
    <template v-else-if="article">
      <h1>{{ article.title || "Reading" }}</h1>
      <div class="content" v-html="contentHtml"></div>
    </template>
    <p v-else>Article not found.</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { articlesAPI } from "../services/api";

const route = useRoute();
const article = ref(null);
const loading = ref(true);

const contentHtml = computed(() => {
  if (!article.value?.content) return "";
  return article.value.content.replace(/\n/g, "<br/>");
});

onMounted(async () => {
  try {
    const { data } = await articlesAPI.list();
    const list = data.articles || [];
    article.value = list.find((a) => String(a.id) === route.params.id) || null;
    if (article.value) {
      await articlesAPI.markRead(article.value.id);
    }
  } catch (_) {
    article.value = null;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.article-view { padding: 1rem; max-width: 480px; margin: 0 auto; }
h1 { font-size: 1.25rem; margin-bottom: 1rem; }
.content { line-height: 1.6; white-space: pre-wrap; }
</style>
