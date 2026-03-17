<template>
  <div class="home">
    <header class="header">
      <h1>Chinese Words Learning</h1>
      <p class="user">{{ auth.user?.username || auth.user?.email }}</p>
    </header>
    <nav class="nav">
      <router-link to="/words" class="nav-card">
        <span class="icon">📚</span>
        <span>My Words</span>
      </router-link>
      <router-link to="/articles" class="nav-card">
        <span class="icon">📖</span>
        <span>Reading</span>
      </router-link>
      <router-link to="/learning-plan" class="nav-card">
        <span class="icon">🎯</span>
        <span>Learning Plan</span>
      </router-link>
      <router-link to="/profile" class="nav-card">
        <span class="icon">👤</span>
        <span>Profile</span>
      </router-link>
    </nav>
    <div v-if="stats" class="stats">
      <p>Total: {{ stats.total }} · Known: {{ stats.known }} · Today: {{ stats.todayLearned }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { wordsAPI } from "../services/api";

const auth = useAuthStore();
const stats = ref(null);

onMounted(async () => {
  try {
    const { data } = await wordsAPI.stats();
    stats.value = data;
  } catch (_) {}
});
</script>

<style scoped>
.home { padding: 1rem; max-width: 480px; margin: 0 auto; }
.header { margin-bottom: 1.5rem; }
.header h1 { font-size: 1.5rem; margin: 0; }
.user { color: #666; margin: 0.25rem 0 0; font-size: 0.9rem; }
.nav { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.nav-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.25rem;
  background: #f5f5f5;
  border-radius: 12px;
  text-decoration: none;
  color: #333;
}
.nav-card .icon { font-size: 2rem; margin-bottom: 0.5rem; }
.stats { margin-top: 1.5rem; padding: 0.75rem; background: #eee; border-radius: 8px; font-size: 0.9rem; color: #555; }
</style>
