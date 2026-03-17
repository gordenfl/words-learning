<template>
  <div class="profile">
    <h1>Profile</h1>
    <p v-if="auth.user">{{ auth.user.username }} · {{ auth.user.email }}</p>
    <button @click="logout" class="logout">Sign out</button>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();

function logout() {
  auth.logout();
  router.replace({ name: "Login" });
}
</script>

<style scoped>
.profile { padding: 1rem; max-width: 480px; margin: 0 auto; }
h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
.logout { margin-top: 1rem; padding: 0.5rem 1rem; background: #c00; color: white; border: none; border-radius: 8px; cursor: pointer; }
</style>
