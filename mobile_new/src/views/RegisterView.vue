<template>
  <div class="register-page">
    <h1>Create Account</h1>
    <form @submit.prevent="onSubmit" class="form">
      <input v-model="username" type="text" placeholder="Username" required />
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="loading">Register</button>
    </form>
    <p class="links">
      <router-link to="/login">Already have an account? Sign in</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();
const username = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function onSubmit() {
  error.value = "";
  loading.value = true;
  try {
    await auth.register(username.value, email.value, password.value);
    router.replace({ name: "Home" });
  } catch (e) {
    error.value = e.response?.data?.error || "Registration failed";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.register-page {
  max-width: 360px;
  margin: 2rem auto;
  padding: 1rem;
  text-align: center;
}
h1 { font-size: 1.5rem; margin-bottom: 1.5rem; }
.form input {
  display: block;
  width: 100%;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-sizing: border-box;
}
.form button {
  width: 100%;
  padding: 0.75rem;
  background: #4A90E2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}
.form button:disabled { opacity: 0.6; }
.error { color: #c00; margin-top: 0.5rem; font-size: 0.9rem; }
.links { margin-top: 1rem; }
.links a { color: #4A90E2; }
</style>
