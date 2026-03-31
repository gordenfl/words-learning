<template>
  <div class="home-page" :style="{ backgroundColor: theme.background }">
    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p class="loading-text">Loading...</p>
    </div>

    <template v-else>
      <!-- Header（与 mobile 一致：primary 色条 + icon + 欢迎语 + 相机） -->
      <header class="header" :style="{ backgroundColor: theme.primary }">
        <div class="header-left">
          <img :src="iconUrl" alt="" class="welcome-icon" />
          <div class="welcome-text-wrap">
            <h1 class="welcome-text">{{ timeGreeting }}, {{ displayName }}!</h1>
            <p class="welcome-subtext">{{ welcomeGreeting }}</p>
          </div>
        </div>
        <div class="header-right">
          <button type="button" class="camera-btn" @click="handleScanBook" aria-label="Scan">
            <img :src="cameraUrl" alt="" class="camera-img" />
          </button>
        </div>
      </header>

      <!-- Hidden file inputs for camera / gallery -->
      <input
        ref="inputCapture"
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden-input"
        @change="onImageSelected"
      />
      <input
        ref="inputGallery"
        type="file"
        accept="image/*"
        class="hidden-input"
        @change="onImageSelected"
      />
      <!-- Scan modal: Take Photo / Choose from Gallery -->
      <div v-if="showScanModal" class="scan-modal-overlay" @click.self="showScanModal = false">
        <div class="scan-modal">
          <p class="scan-modal-title">Scan Book 📸</p>
          <p class="scan-modal-desc">Choose how to import words from your image</p>
          <button type="button" class="scan-modal-btn" @click="triggerTakePhoto">Take Photo</button>
          <button type="button" class="scan-modal-btn" @click="triggerChooseGallery">Choose from Gallery</button>
          <button type="button" class="scan-modal-btn cancel" @click="showScanModal = false">Cancel</button>
        </div>
      </div>

      <div class="scroll-content">
        <!-- Quick Stats 三张卡片 -->
        <div class="quick-stats">
          <router-link :to="{ name: 'WordsList', query: { filter: 'all' } }" class="quick-stat-card">
            <span class="quick-stat-value">{{ stats?.total ?? 0 }}</span>
            <span class="quick-stat-label">Vocabulary</span>
          </router-link>
          <router-link :to="{ name: 'WordsList', query: { filter: 'new' } }" class="quick-stat-card">
            <span class="quick-stat-value stat-warning">{{ stats?.new ?? stats?.unknown ?? 0 }}</span>
            <span class="quick-stat-label">Learning</span>
          </router-link>
          <router-link :to="{ name: 'WordsList', query: { filter: 'learned' } }" class="quick-stat-card">
            <span class="quick-stat-value stat-success">{{ stats?.learned ?? stats?.known ?? 0 }}</span>
            <span class="quick-stat-label">Mastered</span>
          </router-link>
        </div>

        <!-- Center: 中心角色 + 6 个功能图标 -->
        <div class="character-section">
          <div class="character-container">
            <div class="center-character">
              <img :src="iconUrl" alt="" class="center-icon" />
            </div>
            <a
              v-for="(item, idx) in featureItems"
              :key="item.route"
              :href="item.href"
              :style="getFeaturePosition(idx)"
              class="feature-icon feature-icon-float"
              @click.prevent="go(item.route, item.query)"
            >
              <span class="feature-icon-bg" :style="{ backgroundImage: 'url(' + circleUrl + ')' }"></span>
              <span class="feature-label">{{ item.label }}</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Bottom Nav -->
      <nav class="bottom-nav" :style="{ '--primary': theme.primary }">
        <router-link to="/pinyin" class="nav-item" active-class="nav-item-active">
          <span class="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 4h9a4 4 0 0 1 0 8H5z" />
              <path d="M5 12v8" />
            </svg>
          </span>
          <span class="nav-label">PinYin</span>
        </router-link>
        <router-link to="/words" class="nav-item" active-class="nav-item-active">
          <span class="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8"/><path d="M8 11h8"/></svg>
          </span>
          <span class="nav-label">Words</span>
        </router-link>
        <router-link to="/articles" class="nav-item" active-class="nav-item-active">
          <span class="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/><path d="M6 8h2"/><path d="M6 12h2"/><path d="M16 8h2"/><path d="M16 12h2"/></svg>
          </span>
          <span class="nav-label">Reading</span>
        </router-link>
        <router-link to="/learning-plan" class="nav-item" active-class="nav-item-active">
          <span class="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </span>
          <span class="nav-label">Plan</span>
        </router-link>
        <router-link to="/profile" class="nav-item" active-class="nav-item-active">
          <span class="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </span>
          <span class="nav-label">Profile</span>
        </router-link>
      </nav>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { getRandomGreeting } from "../utils/homeGreetings";
import { useAuthStore } from "../stores/auth";
import { useScanStore } from "../stores/scan";
import { wordsAPI, usersAPI } from "../services/api";
import iconUrl from "../assets/icon.png";
import cameraUrl from "../assets/camera.png";
import circleUrl from "../assets/circle_green.png";

const theme = reactive({
  background: "#E3F2FD",
  primary: "#42A5F5",
  success: "#66BB6A",
  warning: "#FFA726",
  card: "#FFFFFF",
  textLight: "#7F8C8D",
  textInverse: "#FFFFFF",
});

const router = useRouter();
const auth = useAuthStore();
const scanStore = useScanStore();
const stats = ref(null);
const welcomeGreeting = ref("");
const loading = ref(true);
const showScanModal = ref(false);
const inputCapture = ref(null);
const inputGallery = ref(null);

const displayName = computed(() => {
  const u = auth.user;
  return u?.profile?.displayName || u?.username || u?.email || "friend";
});

const timeGreeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
});

const featureItems = [
  { label: "Words", route: "WordsList", query: { filter: "all" }, href: "/words?filter=all" },
  { label: "Reading", route: "ArticleList", query: {}, href: "/articles" },
  { label: "Scan", route: null, query: {}, href: "#" },
  { label: "Writing", route: "WordsList", query: { filter: "new" }, href: "/words?filter=new" },
  { label: "Plan", route: "LearningPlan", query: {}, href: "/learning-plan" },
  { label: "Profile", route: "Profile", query: {}, href: "/profile" },
];

function go(routeName, query) {
  if (routeName === null) {
    handleScanBook();
    return;
  }
  router.push({ name: routeName, query });
}

function getFeaturePosition(index) {
  const total = 6;
  const radius = 130;
  const angleStep = 360 / total;
  const angle = -90 + index * angleStep;
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;
  const size = 110;
  const center = 150;
  const left = center + x - size / 2;
  const top = center + y - size / 2;
  const durations = [2.2, 2.6, 2.4, 2.8, 2.3, 2.5];
  const delays = [0, 0.5, 1, 0.3, 0.8, 1.2];
  return {
    position: "absolute",
    left: left + "px",
    top: top + "px",
    width: size + "px",
    height: size + "px",
    "--float-duration": durations[index] + "s",
    "--float-delay": delays[index] + "s",
  };
}

async function loadData() {
  try {
    const [statsRes, planRes] = await Promise.all([
      wordsAPI.stats().catch(() => ({ data: { total: 0, new: 0, learned: 0, todayLearned: 0 } })),
      usersAPI.getLearningPlan().catch(() => ({ data: { learningPlan: {} } })),
    ]);
    stats.value = statsRes.data;
  } catch (_) {}
  finally {
    loading.value = false;
  }
}

function handleScanBook() {
  showScanModal.value = true;
}

function triggerTakePhoto() {
  showScanModal.value = false;
  inputCapture.value?.click();
}

function triggerChooseGallery() {
  showScanModal.value = false;
  inputGallery.value?.click();
}

function onImageSelected(ev) {
  const file = ev.target.files?.[0];
  ev.target.value = "";
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    scanStore.setImage(dataUrl);
    router.push({ name: "ImageView" });
  };
  reader.readAsDataURL(file);
}

onMounted(() => {
  welcomeGreeting.value = getRandomGreeting();
  loadData();
});
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0;
}

/* Keep bottom content visible above the fixed bottom nav */
.scroll-content {
  padding-bottom: calc(24px + 52px + env(safe-area-inset-bottom, 0px));
}
.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  gap: 20px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E8E8E8;
  border-top-color: #42A5F5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-text {
  font-size: 17px;
  color: #7F8C8D;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 20px 20px;
  padding-top: calc(10px + env(safe-area-inset-top, 0px));
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.header-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}
.welcome-icon {
  width: 60px;
  height: 60px;
  margin-right: 12px;
  border-radius: 16px;
  overflow: hidden;
  flex-shrink: 0;
}
.welcome-text-wrap { min-width: 0; }
.welcome-text {
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
  color: #fff;
  margin: 0 0 4px;
}
.welcome-subtext {
  font-size: 17px;
  color: rgba(255,255,255,0.9);
  margin: 0;
}
.header-right { flex-shrink: 0; }
.camera-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.camera-img {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

/* Scroll content */
.scroll-content {
  flex: 1;
  /* leave room for fixed bottom nav + safe-area */
  padding: 20px 20px calc(96px + env(safe-area-inset-bottom, 0px));
  overflow: auto;
}

/* Quick stats */
.quick-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 28px;
}
.quick-stat-card {
  flex: 1;
  background: #fff;
  border-radius: 24px;
  padding: 20px;
  text-align: center;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.quick-stat-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: #42A5F5;
  margin-bottom: 6px;
  line-height: 1.2;
}
.quick-stat-value.stat-success { color: #66BB6A; }
.quick-stat-value.stat-warning { color: #FFA726; }
.quick-stat-label {
  font-size: 17px;
  color: #7F8C8D;
}

/* Center character + feature icons */
.character-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px 0;
  min-height: 400px;
}
.character-container {
  width: 300px;
  height: 300px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.center-character {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}
.center-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  text-decoration: none;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 3px 8px rgba(0,0,0,0.12);
  position: absolute;
}
.feature-icon-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}
.feature-label {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 0 4px;
}
.feature-icon:hover .feature-icon-bg { opacity: 0.95; }
.feature-icon-float {
  animation: feature-float var(--float-duration, 2.5s) ease-in-out var(--float-delay, 0s) infinite;
}
@keyframes feature-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Bottom nav - 与主题色系协调的简洁设计 */
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: stretch;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(66, 165, 245, 0.15);
  padding: 4px 4px;
  height: calc(52px + env(safe-area-inset-bottom, 0px));
  padding-bottom: calc(4px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -4px 20px rgba(66, 165, 245, 0.08);
}
.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 2px 4px;
  min-height: 44px;
  text-decoration: none;
  color: #7F8C8D;
  border-radius: 12px;
  transition: color 0.2s, background 0.2s;
}
.nav-item:hover,
.nav-item:active,
.nav-item-active {
  color: var(--primary, #42A5F5);
  background: rgba(66, 165, 245, 0.08);
}
.nav-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-icon svg {
  width: 28px;
  height: 28px;
}
.nav-label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.hidden-input {
  /* iOS WKWebView may ignore programmatic click() when input is 0x0 or non-interactive */
  position: fixed;
  left: -10000px;
  top: -10000px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: auto;
}
.scan-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.scan-modal {
  background: #fff;
  border-radius: 24px;
  padding: 24px;
  max-width: 320px;
  width: 100%;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.scan-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2C3E50;
  margin: 0 0 8px;
}
.scan-modal-desc {
  font-size: 0.95rem;
  color: #7F8C8D;
  margin: 0 0 20px;
}
.scan-modal-btn {
  display: block;
  width: 100%;
  padding: 14px 20px;
  margin-bottom: 10px;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background: #42A5F5;
  border: none;
  border-radius: 16px;
  cursor: pointer;
}
.scan-modal-btn.cancel {
  background: #E8E8E8;
  color: #2C3E50;
  margin-bottom: 0;
}
</style>
