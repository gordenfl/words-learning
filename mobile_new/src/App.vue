<template>
  <div id="app">
    <header v-if="showBackBar" class="back-bar">
      <button type="button" class="back-btn" aria-label="Back" @click="goBack">
        <span class="back-icon">←</span>
      </button>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const noBackRoutes = ["Home", "Login", "Register"];
const showBackBar = computed(() => !noBackRoutes.includes(route.name));

function goBack() {
  router.back();
}
</script>

<style>
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
}
.back-bar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  min-height: 48px;
  padding-left: 8px;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: 8px;
  background: #fff;
  border-bottom: 1px solid #E8E8E8;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #42A5F5;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}
.back-btn:hover {
  background: rgba(66, 165, 245, 0.1);
}
.back-btn:active {
  opacity: 0.8;
}
.back-icon {
  font-weight: 700;
}
.main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
