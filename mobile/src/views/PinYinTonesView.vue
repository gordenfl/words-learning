<template>
  <div class="page">
    <header class="top">
      <h1 class="title">Tones</h1>
      <p class="desc">声调（shēngdiào）— the pitch contour. Mandarin has 4 tones + neutral.</p>
    </header>

    <div class="cards">
      <div class="tone-card" v-for="t in tones" :key="t.num">
        <div class="tone-num">Tone {{ t.num }}{{ t.num === 5 ? " (neutral)" : "" }}</div>
        <div class="tone-mark">{{ t.mark }}</div>
        <div class="tone-desc">{{ t.desc }}</div>
        <div class="examples">
          <span class="ex" v-for="ex in t.examples" :key="ex">{{ ex }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const tones = [
  { num: 1, mark: "ˉ", desc: "High level", examples: ["mā", "bā", "shī"] },
  { num: 2, mark: "ˊ", desc: "Rising", examples: ["má", "bá", "shí"] },
  { num: 3, mark: "ˇ", desc: "Falling-rising", examples: ["mǎ", "bǎ", "shǐ"] },
  { num: 4, mark: "ˋ", desc: "Falling", examples: ["mà", "bà", "shì"] },
  { num: 5, mark: "·", desc: "Neutral (light)", examples: ["ma", "ba", "shi"] },
];
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
.cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 10px;
}
.tone-card {
  border-radius: 18px;
  padding: 14px;
  border: 1px solid #e8e8e8;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}
.tone-num {
  font-size: 14px;
  font-weight: 900;
  color: #2c3e50;
}
.tone-mark {
  margin-top: 8px;
  font-size: 34px;
  font-weight: 900;
  color: #42a5f5;
}
.tone-desc {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #7f8c8d;
}
.examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.ex {
  padding: 8px 10px;
  border-radius: 14px;
  background: rgba(66, 165, 245, 0.08);
  border: 1px solid rgba(66, 165, 245, 0.18);
  font-size: 13px;
  font-weight: 900;
  color: #2c3e50;
}
</style>

