import { defineStore } from "pinia";
import { authAPI } from "../services/api";
import { safeLocalStorageGetItem, safeLocalStorageRemoveItem, safeLocalStorageSetItem } from "../utils/safeStorage";

const TOKEN_KEY = "authToken";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    // iOS WKWebView 有时会禁用 localStorage（file/capacitor scheme 下），这里必须兜底避免白屏崩溃
    token: safeLocalStorageGetItem(TOKEN_KEY) || null,
    user: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    setToken(token) {
      this.token = token;
      if (token) safeLocalStorageSetItem(TOKEN_KEY, token);
      else safeLocalStorageRemoveItem(TOKEN_KEY);
    },

    setUser(user) {
      this.user = user;
    },

    async fetchProfile() {
      const { data } = await authAPI.getProfile();
      this.user = data.user;
      return data.user;
    },

    async login(email, password) {
      const { data } = await authAPI.login(email, password);
      this.setToken(data.token);
      this.setUser(data.user);
      return data;
    },

    async register(username, email, password) {
      const { data } = await authAPI.register(username, email, password);
      this.setToken(data.token);
      this.setUser(data.user);
      return data;
    },

    logout() {
      this.setToken(null);
      this.setUser(null);
    },

    async initFromStorage() {
      if (!this.token) return false;
      try {
        await this.fetchProfile();
        return true;
      } catch {
        this.logout();
        return false;
      }
    },
  },
});
