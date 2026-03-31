<template>
  <div class="page">
    <header class="top">
      <h1 class="title">Finals</h1>
      <p class="desc">韵母（yùnmǔ）— everything after the initial (vowel + ending).</p>
    </header>

    <div class="section">
      <div class="group" v-for="g in groups" :key="g.title">
        <div class="group-title">{{ g.title }}</div>
        <div class="chips">
          <router-link
            v-for="item in g.items"
            :key="item"
            class="chip chip-link"
            :to="{ name: 'PinYinFinalLearn', params: { final: item } }"
          >
            {{ item }}
          </router-link>
        </div>
      </div>
    </div>

    <div class="detail">
      <div class="detail-title">Learn a final</div>
      <div class="detail-subtitle">Tap any final above to open the learning screen with tones.</div>
    </div>
  </div>
</template>

<script setup>
// finals list only; learning happens in PinYinFinalLearnView

const groups = [
  { title: "Simple", items: ["a", "o", "e", "i", "u", "ü", "er"] },
  { title: "Diphthongs", items: ["ai", "ei", "ao", "ou"] },
  { title: "Nasal", items: ["an", "en", "ang", "eng", "ong"] },
  { title: "i- finals", items: ["ia", "ie", "iao", "iu", "ian", "in", "iang", "ing", "iong"] },
  { title: "u- finals", items: ["ua", "uo", "uai", "ui", "uan", "un", "uang", "ueng"] },
  { title: "ü- finals", items: ["üe", "üan", "ün"] },
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
.group {
  margin-top: 12px;
}
.group-title {
  font-size: 13px;
  font-weight: 900;
  color: #2c3e50;
  opacity: 0.75;
  margin: 0 0 8px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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
.chip-link {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.chip:active {
  transform: translateY(1px);
}
.detail {
  margin-top: 14px;
  border-radius: 18px;
  padding: 14px;
  border: 1px solid rgba(102, 187, 106, 0.25);
  background: rgba(102, 187, 106, 0.10);
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

