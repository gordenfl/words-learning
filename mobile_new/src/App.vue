<template>
  <div id="app">
    <nav v-if="auth.isAuthenticated" class="nav">
      <router-link to="/">Home</router-link>
      <router-link to="/words">Words</router-link>
      <router-link to="/articles">Reading</router-link>
      <router-link to="/profile">Profile</router-link>
    </nav>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from "./stores/auth";
const auth = useAuthStore();
</script>

<style>
#app {
  min-height: 100vh;
  background: #fff;
}
.nav {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #4A90E2;
}
.nav a {
  color: #fff;
  text-decoration: none;
}
.nav a.router-link-active { font-weight: bold; }
.main { padding-bottom: 2rem; }
</style>
