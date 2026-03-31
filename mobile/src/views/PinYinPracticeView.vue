<template>
  <div class="page">
    <header class="top">
      <h1 class="title">Practice</h1>
      <p class="desc">Quick drills: generate random syllables and tone marks.</p>
    </header>

    <div class="panel">
      <div class="syllable">{{ current.pretty }}</div>
      <div class="raw">{{ current.raw }}</div>
      <button type="button" class="btn" @click="next()">Next</button>
    </div>

    <div class="notes">
      <div class="note-title">Tip</div>
      <div class="note-body">This mimics common pinyin charts: click through lots of combinations and get used to the tone marks.</div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import { applyToneMark } from "../utils/pinyinTone";

const INITIALS = ["", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "zh", "ch", "sh", "r", "z", "c", "s"];
const FINALS = ["a","o","e","i","u","ü","ai","ei","ao","ou","an","en","ang","eng","ong","er","ia","ie","iao","iu","ian","in","iang","ing","iong","ua","uo","uai","ui","uan","un","uang","ueng","üe","üan","ün"];
const TONES = [1, 2, 3, 4, 5];

const current = reactive({ raw: "", pretty: "" });

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function next() {
  const i = pick(INITIALS);
  const f = pick(FINALS);
  const t = pick(TONES);
  const raw = `${i}${f}${t === 5 ? "" : t}`;
  const pretty = applyToneMark(`${i}${f}`, t);
  current.raw = raw;
  current.pretty = pretty;
}

next();
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
.panel {
  margin-top: 12px;
  border-radius: 20px;
  padding: 18px 16px;
  background: rgba(66, 165, 245, 0.08);
  border: 1px solid rgba(66, 165, 245, 0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.syllable {
  font-size: 44px;
  font-weight: 900;
  color: #2c3e50;
  letter-spacing: 0.02em;
}
.raw {
  font-size: 13px;
  font-weight: 800;
  color: #7f8c8d;
}
.btn {
  margin-top: 6px;
  width: 100%;
  max-width: 320px;
  padding: 14px 18px;
  border: none;
  border-radius: 16px;
  background: #42a5f5;
  color: #fff;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
}
.btn:active {
  transform: translateY(1px);
}
.notes {
  margin-top: 12px;
  border-radius: 18px;
  padding: 14px;
  border: 1px solid #e8e8e8;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}
.note-title {
  font-size: 14px;
  font-weight: 900;
  color: #2c3e50;
}
.note-body {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #7f8c8d;
  line-height: 1.4;
}
</style>

