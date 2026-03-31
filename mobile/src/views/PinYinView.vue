<template>
  <div class="page">
    <div class="hero">
      <div class="hero-title">PinYin</div>
      <div class="hero-subtitle">Initial + Final + Tone</div>
    </div>

    <div class="grid">
      <router-link :to="{ name: 'PinYinInitials' }" class="card">
        <div class="card-title">Initials</div>
        <div class="card-subtitle">声母（shēngmǔ）</div>
      </router-link>
      <router-link :to="{ name: 'PinYinFinals' }" class="card">
        <div class="card-title">Finals</div>
        <div class="card-subtitle">韵母（yùnmǔ）</div>
      </router-link>
      <router-link :to="{ name: 'PinYinTones' }" class="card">
        <div class="card-title">Tones</div>
        <div class="card-subtitle">声调（shēngdiào）</div>
      </router-link>
      <router-link :to="{ name: 'PinYinPractice' }" class="card card-primary">
        <div class="card-title">Practice</div>
        <div class="card-subtitle">Quick drills</div>
      </router-link>
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  padding: 16px;
  overflow: auto;
}
.hero {
  border-radius: 20px;
  padding: 18px 16px;
  background: linear-gradient(135deg, rgba(66, 165, 245, 0.18), rgba(102, 187, 106, 0.12));
  border: 1px solid rgba(66, 165, 245, 0.18);
}
.hero-title {
  font-size: 28px;
  font-weight: 900;
  color: #2c3e50;
  letter-spacing: 0.02em;
}
.hero-subtitle {
  margin-top: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #7f8c8d;
}
.grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.card {
  display: block;
  padding: 16px 14px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid #e8e8e8;
  text-decoration: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  color: inherit;
}
.card:active {
  transform: translateY(1px);
}
.card-primary {
  border-color: rgba(66, 165, 245, 0.35);
  background: rgba(66, 165, 245, 0.08);
}
.card-title {
  font-size: 18px;
  font-weight: 900;
  color: #2c3e50;
}
.card-subtitle {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #7f8c8d;
}
</style>

