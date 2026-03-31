<template>
  <div class="login-page" :style="{ backgroundColor: theme.background }">
    <div class="scroll-content">
      <div class="content">
        <!-- Welcome Header（与 mobile 一致） -->
        <div class="header-surface">
          <img :src="iconUrl" alt="App" class="logo" />
          <h1 class="title">👋 Welcome Back!</h1>
          <p class="subtitle">{{ loginSubtitle }}</p>
        </div>

        <!-- Login Card -->
        <div class="card card-elevated">
          <div class="card-content">
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
            <div class="social-icons">
              <button type="button" class="social-icon-btn social-icon-apple" @click="onSocialClick('apple')" title="Sign in with Apple" aria-label="Apple">
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              </button>
              <button type="button" class="social-icon-btn" @click="onSocialClick('google')" title="Sign in with Google" aria-label="Google">
                <svg viewBox="0 0 24 24" width="22" height="22"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              </button>
              <button type="button" class="social-icon-btn" @click="onSocialClick('facebook')" title="Sign in with Facebook" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="#1877F2" width="22" height="22"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Register Link -->
        <router-link to="/register" class="register-link">
          Don't have an account? Sign up
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
import { Capacitor } from "@capacitor/core";

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
const email = ref("gordenfl@gmail.com");
const password = ref("gordenfl");
const error = ref("");
const loading = ref(false);
const showPassword = ref(false);
const loginSubtitle = ref(getRandomGreeting());
const appVersion = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "1.0.1";
const appBuild = typeof __APP_BUILD__ !== "undefined" ? __APP_BUILD__ : "0";

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

async function onSocialClick(provider) {
  if (provider === "apple") {
    await handleAppleSignIn();
    return;
  }
  error.value = "Use email to sign in, or use the native app for " + provider + " sign-in.";
}

async function handleAppleSignIn() {
  if (Capacitor.getPlatform() !== "ios") {
    error.value = "Apple Sign In is only available on iOS. Use email to sign in.";
    return;
  }
  try {
    const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
    const result = await SignInWithApple.authorize({
      clientId: "com.gordenfl.wordslearning",
      redirectURI: "https://gordenfl.com/auth/apple/callback",
      scopes: "email name",
    });
    const r = result.response;
    if (!r?.identityToken) {
      error.value = "Apple Sign In failed: no identity token";
      return;
    }
    const userInfo = {
      identityToken: r.identityToken,
      userId: r.user,
      email: r.email,
      fullName: r.givenName || r.familyName
        ? { givenName: r.givenName, familyName: r.familyName }
        : null,
    };
    loading.value = true;
    error.value = "";
    const { authAPI } = await import("../services/api");
    const { data } = await authAPI.appleSignIn(userInfo);
    if (data?.token) {
      auth.setToken(data.token);
      auth.setUser(data.user);
      router.replace({ name: "Home" });
    } else {
      error.value = "Apple Sign In failed";
    }
  } catch (e) {
    if (e?.message?.includes("cancel") || e?.code === "ERR_CANCELED") return;
    error.value = e.response?.data?.message || e.message || "Apple Sign In failed";
  } finally {
    loading.value = false;
  }
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

/* Social icons row */
.social-icons {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 20px;
}
.social-icon-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #F5F5F5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.social-icon-btn:hover {
  background: #EEEEEE;
}
.social-icon-btn svg {
  display: block;
}
.social-icon-apple {
  color: #000;
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
