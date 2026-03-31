<template>
  <div class="page">
    <header class="top">
      <h1 class="title">Initials</h1>
      <p class="desc">声母（shēngmǔ）— the starting consonant sound of a syllable.</p>
    </header>

    <div class="section">
      <div class="chips">
        <button
          v-for="item in initials"
          :key="item"
          type="button"
          class="chip"
          @click="selected = item"
        >
          {{ item }}
        </button>
      </div>
    </div>

    <div v-if="selected" class="detail">
      <div class="detail-title">{{ selected }}</div>
      <div class="detail-subtitle">Tip: pair it with a final, e.g. {{ example(selected) }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const initials = [
  "b","p","m","f",
  "d","t","n","l",
  "g","k","h",
  "j","q","x",
  "zh","ch","sh","r",
  "z","c","s",
];

const selected = ref("");

function example(initial) {
  const pool = ["a", "ai", "an", "ang", "ao", "e", "ei", "en", "eng", "i", "ia", "ie", "iao", "ian", "in", "ing", "iong", "o", "ong", "ou", "u", "ua", "uo", "uai", "ui", "uan", "un", "uang"];
  const f = pool[Math.floor(Math.random() * pool.length)];
  return `${initial}${f}`;
}
</script>

<style scoped>
.page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  padding: 16px;
  overflow: auto;
}
.top {
  padding: 6px 4px 10px;
}
.title {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
  color: #2c3e50;
}
.desc {
  margin: 6px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: #7f8c8d;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}
.chip {
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid #e8e8e8;
  background: #fff;
  font-size: 14px;
  font-weight: 900;
  color: #2c3e50;
}
.chip:active {
  transform: translateY(1px);
}
.detail {
  margin-top: 14px;
  border-radius: 18px;
  padding: 14px;
  border: 1px solid rgba(66, 165, 245, 0.25);
  background: rgba(66, 165, 245, 0.07);
}
.detail-title {
  font-size: 20px;
  font-weight: 900;
  color: #2c3e50;
}
.detail-subtitle {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #2c3e50;
  opacity: 0.75;
}
</style>

