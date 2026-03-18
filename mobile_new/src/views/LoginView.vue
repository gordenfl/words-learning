<template>
  <div class="login-page" :style="{ backgroundColor: theme.background }">
    <div class="scroll-content">
      <div class="content">
        <!-- Welcome Header（与 mobile 一致） -->
        <div class="header-surface">
          <img :src="iconUrl" alt="App" class="logo" />
          <h1 class="title">👋 Welcome Back!</h1>
          <p class="subtitle">Let's learn Chinese characters together!</p>
        </div>

        <!-- Login Card -->
        <div class="card card-elevated">
          <div class="card-content">
            <div class="input-wrap">
              <label class="input-label">📧 Email</label>
              <input
                v-model="email"
                type="email"
                class="input outlined"
                placeholder="Email"
                autocomplete="email"
              />
            </div>
            <div class="input-wrap">
              <label class="input-label">🔒 Password</label>
              <div class="password-row">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="input outlined"
                  placeholder="Password"
                  autocomplete="current-password"
                />
                <button type="button" class="eye-btn" @click="showPassword = !showPassword" aria-label="Toggle password">
                  {{ showPassword ? "🙈" : "👁" }}
                </button>
              </div>
            </div>
            <p v-if="error" class="error-msg">{{ error }}</p>
            <button
              type="button"
              class="login-btn"
              :disabled="loading"
              @click="onSubmit"
            >
              {{ loading ? "Logging in..." : "Login" }}
            </button>
          </div>
        </div>

        <!-- Divider: or -->
        <div class="divider-row">
          <span class="divider-line"></span>
          <span class="divider-text">or</span>
          <span class="divider-line"></span>
        </div>

        <!-- Social Login Card -->
        <div class="card card-outlined social-card">
          <div class="card-content">
            <p class="social-title">Sign in with</p>
            <div class="social-buttons">
              <button type="button" class="social-btn apple" @click="onSocialClick('apple')" title="Sign in with Apple">
                <span class="social-icon">🍎</span>
                <span>Apple</span>
              </button>
              <button type="button" class="social-btn google" @click="onSocialClick('google')" title="Sign in with Google">
                <span class="social-icon">G</span>
                <span>Google</span>
              </button>
              <button type="button" class="social-btn facebook" @click="onSocialClick('facebook')" title="Sign in with Facebook">
                <span class="social-icon">f</span>
                <span>Facebook</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Register Link -->
        <router-link to="/register" class="register-link">
          Don't have an account? Sign up
        </router-link>

        <!-- Version -->
        <p class="version-text">v1.0.1(1)</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import iconUrl from "../assets/icon.png";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

// 与 mobile childrenTheme + blueTheme 一致
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
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const showPassword = ref(false);

async function onSubmit() {
  error.value = "";
  if (!email.value || !password.value) {
    error.value = "Please fill in all fields";
    return;
  }
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    router.replace({ name: "Home" });
  } catch (e) {
    error.value = e.response?.data?.error || "Login failed";
  } finally {
    loading.value = false;
  }
}

function onSocialClick(provider) {
  error.value = "Use email to sign in, or use the native app for " + provider + " sign-in.";
}
</script>

<style scoped>
.login-page {
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

/* Header（与 mobile headerSurface + logo + title + subtitle） */
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

/* Card */
.card {
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 28px;
}
.card-elevated {
  background: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.card-outlined {
  background: #FFFFFF;
  border: 1px solid #E8E8E8;
}
.card-content {
  padding: 20px;
}

/* Input（与 mobile TextInput outlined） */
.input-wrap {
  margin-bottom: 20px;
}
.input-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #2C3E50;
  margin-bottom: 6px;
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

/* Error */
.error-msg {
  color: #EF5350;
  font-size: 0.9rem;
  margin: -8px 0 12px;
}

/* Login button */
.login-btn {
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
.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Divider */
.divider-row {
  display: flex;
  align-items: center;
  margin: 28px 20px;
  gap: 12px;
}
.divider-line {
  flex: 1;
  height: 1px;
  background: #F0F0F0;
}
.divider-text {
  font-size: 0.95rem;
  color: #7F8C8D;
}

/* Social card */
.social-card {
  margin-bottom: 28px;
}
.social-title {
  text-align: center;
  font-size: 0.95rem;
  color: #2C3E50;
  margin: 0 0 16px;
}
.social-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 20px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 16px;
  border: 1px solid #E8E8E8;
  background: #fff;
  cursor: pointer;
  color: #2C3E50;
}
.social-btn.apple {
  background: #000;
  color: #fff;
  border-color: #000;
}
.social-btn.google {
  background: #fff;
  border-color: #ddd;
}
.social-btn.facebook {
  background: #1877F2;
  color: #fff;
  border-color: #1877F2;
}
.social-icon {
  font-size: 1.2rem;
  font-weight: 700;
}

/* Register link */
.register-link {
  display: block;
  text-align: center;
  margin-top: 12px;
  font-size: 1rem;
  color: #42A5F5;
  text-decoration: none;
}

/* Version */
.version-text {
  font-size: 12px;
  color: #7F8C8D;
  text-align: center;
  margin-top: 36px;
  margin-bottom: 28px;
  opacity: 0.6;
}
</style>
