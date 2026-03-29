<template>
  <div class="register-page" :style="{ backgroundColor: theme.background }">
    <div class="scroll-content">
      <div class="content">
        <!-- Header -->
        <div class="header-surface">
          <img :src="iconUrl" alt="App" class="logo" />
          <h1 class="title">✨ Create Account</h1>
          <p class="subtitle">{{ registerSubtitle }}</p>
        </div>

        <!-- Register Card -->
        <div class="card card-elevated">
          <div class="card-content">
            <div class="input-wrap">
              <input
                v-model="username"
                type="text"
                class="input outlined"
                placeholder="Username"
                autocomplete="username"
              />
            </div>
            <div class="input-wrap">
              <input
                v-model="email"
                type="email"
                class="input outlined"
                placeholder="Email"
                autocomplete="email"
              />
            </div>
            <div class="input-wrap">
              <div class="password-row">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="input outlined"
                  placeholder="Password"
                  autocomplete="new-password"
                />
                <button type="button" class="eye-btn" @click="showPassword = !showPassword" aria-label="Toggle password">
                  {{ showPassword ? "🙈" : "👁" }}
                </button>
              </div>
            </div>
            <p v-if="error" class="error-msg">{{ error }}</p>
            <button
              type="button"
              class="register-btn"
              :disabled="loading"
              @click="onSubmit"
            >
              {{ loading ? "Creating account..." : "Sign Up" }}
            </button>
          </div>
        </div>

        <!-- Login Link -->
        <router-link to="/login" class="login-link">
          Already have an account? Sign in
        </router-link>

        <!-- Version -->
        <p class="version-text">v{{ appVersion }} ({{ appBuild }})</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import iconUrl from "../assets/icon.png";
import { getRandomGreeting } from "../utils/homeGreetings";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const theme = reactive({
  background: "#E3F2FD",
  primary: "#42A5F5",
  text: "#2C3E50",
  textLight: "#7F8C8D",
  card: "#FFFFFF",
  border: "#E8E8E8",
});

const router = useRouter();
const auth = useAuthStore();
const username = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const showPassword = ref(false);
const registerSubtitle = ref(getRandomGreeting());
const appVersion = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "1.0.1";
const appBuild = typeof __APP_BUILD__ !== "undefined" ? __APP_BUILD__ : "0";

async function onSubmit() {
  error.value = "";
  if (!username.value?.trim() || !email.value?.trim() || !password.value) {
    error.value = "Please fill in all fields";
    return;
  }
  loading.value = true;
  try {
    await auth.register(username.value.trim(), email.value.trim(), password.value);
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
  min-height: 100vh;
  padding: 0;
}
.scroll-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 28px 20px 36px;
  box-sizing: border-box;
}
.content {
  width: 100%;
  max-width: 420px;
}

.header-surface {
  text-align: center;
  padding: 28px;
  margin-bottom: 36px;
}
.logo {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  border-radius: 24px;
  overflow: hidden;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #42A5F5;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}
.subtitle {
  font-size: 1rem;
  color: #7F8C8D;
  margin: 8px 0 0;
}

.card {
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 28px;
}
.card-elevated {
  background: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.card-content {
  padding: 20px;
}

.input-wrap {
  margin-bottom: 16px;
}
.input {
  width: 100%;
  padding: 14px 16px;
  font-size: 19px;
  line-height: 1.4;
  color: #2C3E50;
  background: #fff;
  border: 1px solid #E8E8E8;
  border-radius: 12px;
  box-sizing: border-box;
}
.input::placeholder {
  color: #9E9E9E;
}
.input:focus {
  outline: none;
  border-color: #42A5F5;
}
.password-row {
  position: relative;
  display: flex;
  align-items: center;
}
.password-row .input {
  flex: 1;
  padding-right: 48px;
}
.eye-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  font-size: 1.2rem;
}

.error-msg {
  color: #EF5350;
  font-size: 0.9rem;
  margin: -8px 0 12px;
}

.register-btn {
  width: 100%;
  margin-top: 20px;
  padding: 16px 24px;
  min-height: 68px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  background: #42A5F5;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(0,0,0,0.12);
}
.register-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-link {
  display: block;
  text-align: center;
  margin-top: 12px;
  font-size: 1rem;
  color: #42A5F5;
  text-decoration: none;
}

.version-text {
  font-size: 12px;
  color: #7F8C8D;
  text-align: center;
  margin-top: 36px;
  margin-bottom: 28px;
  opacity: 0.6;
}
</style>
