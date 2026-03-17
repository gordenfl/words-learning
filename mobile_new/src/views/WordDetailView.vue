<template>
  <div class="word-detail">
    <p v-if="loading">Loading...</p>
    <template v-else-if="word">
      <h1 class="word">{{ word.word }}</h1>
      <p class="pinyin">{{ word.pinyin }}</p>
      <p class="translation">{{ word.translation || word.definition }}</p>
      <p class="status">Status: {{ word.status }}</p>
      <div v-if="word.compounds?.length" class="section">
        <h3>Compounds</h3>
        <ul>
          <li v-for="(c, i) in word.compounds" :key="i">{{ c.word }} — {{ c.meaning }}</li>
        </ul>
      </div>
      <div v-if="word.examples?.length" class="section">
        <h3>Examples</h3>
        <ul>
          <li v-for="(e, i) in word.examples" :key="i">{{ e.chinese }} ({{ e.english }})</li>
        </ul>
      </div>
      <button @click="generateDetails" :disabled="generating">Generate details (AI)</button>
    </template>
    <p v-else>Word not found.</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { wordsAPI } from "../services/api";

const route = useRoute();
const word = ref(null);
const loading = ref(true);
const generating = ref(false);

const wordId = computed(() => route.params.id);

async function load() {
  loading.value = true;
  try {
    const { data } = await wordsAPI.get(wordId.value);
    word.value = data.word;
  } catch (_) {
    word.value = null;
  } finally {
    loading.value = false;
  }
}

async function generateDetails() {
  generating.value = true;
  try {
    const { data } = await wordsAPI.generateDetails(wordId.value, {});
    word.value = data.word;
  } catch (_) {}
  finally {
    generating.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.word-detail { padding: 1rem; max-width: 480px; margin: 0 auto; }
.word { font-size: 2rem; margin: 0; }
.pinyin { color: #666; margin: 0.25rem 0; }
.translation { margin: 0.5rem 0; }
.status { font-size: 0.9rem; color: #888; }
.section { margin-top: 1rem; }
.section h3 { font-size: 1rem; margin-bottom: 0.5rem; }
.section ul { margin: 0; padding-left: 1.25rem; }
button { margin-top: 1rem; padding: 0.5rem 1rem; background: #4A90E2; color: white; border: none; border-radius: 8px; cursor: pointer; }
button:disabled { opacity: 0.6; }
</style>
