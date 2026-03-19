<template>
  <div class="compound-page" :style="{ backgroundColor: theme.background }">
    <div v-if="loading" class="loader-container">
      <div class="spinner"></div>
    </div>
    <template v-else-if="word">
      <div class="content">
        <h2 class="title">Compound Practice</h2>
        <p class="hint">Enter 3 compound words containing 「{{ word.word }}」</p>
        <div class="completed-list">
          <div v-for="(w, i) in completedWords" :key="i" class="completed-item">
            <span class="num">{{ i + 1 }}.</span>
            <span class="word">{{ w.word }}</span>
          </div>
        </div>
        <div v-if="completedWords.length < 3" class="input-row">
          <input
            v-model="inputText"
            type="text"
            class="input"
            placeholder="Enter a word containing this character..."
            @keydown.enter="submit"
          />
          <button type="button" class="submit-btn" @click="submit">Add</button>
        </div>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { wordsAPI } from "../services/api";
import { getCompoundPractice, setCompoundPractice } from "../utils/practiceStorage";

const route = useRoute();
const theme = { background: "#E3F2FD" };

const word = ref(null);
const loading = ref(true);
const completedWords = ref([]);
const inputText = ref("");
const errorMsg = ref("");

const wordId = () => route.params.id;

function submit() {
  const text = (inputText.value || "").trim().replace(/\s/g, "");
  if (!text) return;
  const mainChar = word.value?.word || "";
  if (!mainChar || !text.includes(mainChar)) {
    errorMsg.value = `The word must contain 「${mainChar}」`;
    return;
  }
  if (text === mainChar) {
    errorMsg.value = "Please enter a compound word, not just the character.";
    return;
  }
  errorMsg.value = "";
  completedWords.value = [...completedWords.value, { word: text, chars: text.split("") }];
  setCompoundPractice(wordId(), completedWords.value);
  inputText.value = "";
}

async function load() {
  loading.value = true;
  try {
    const { data } = await wordsAPI.get(wordId());
    word.value = data.word;
    completedWords.value = getCompoundPractice(wordId());
  } catch (_) {
    word.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.compound-page { min-height: 100vh; padding: 24px; }
.loader-container { display: flex; justify-content: center; padding: 48px; }
.spinner { width: 40px; height: 40px; border: 3px solid #E8E8E8; border-top-color: #42A5F5; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.content { max-width: 400px; margin: 0 auto; }
.title { font-size: 24px; margin: 0 0 8px; color: #2C3E50; }
.hint { font-size: 16px; color: #7F8C8D; margin: 0 0 24px; }
.completed-list { margin-bottom: 24px; }
.completed-item { padding: 12px; background: #fff; border-radius: 12px; margin-bottom: 8px; display: flex; gap: 8px; }
.completed-item .num { color: #42A5F5; font-weight: 600; }
.completed-item .word { font-size: 18px; }
.input-row { display: flex; gap: 8px; }
.input { flex: 1; padding: 12px 16px; font-size: 18px; border-radius: 12px; border: 2px solid #E8E8E8; }
.submit-btn { padding: 12px 24px; font-size: 16px; font-weight: 600; border-radius: 12px; border: none; background: #42A5F5; color: #fff; cursor: pointer; }
.error { color: #EF5350; margin-top: 8px; font-size: 14px; }
</style>
