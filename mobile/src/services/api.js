/**
 * API 封装 - 与 mobile__old（RN）行为一致，对接 backend
 */
import axios from "axios";
import Config from "../config";
import { safeLocalStorageGetItem } from "../utils/safeStorage";

const api = axios.create({
  baseURL: Config.API.BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// 请求时附带 token（从 localStorage 取，与 Capacitor 兼容）
api.interceptors.request.use(
  (config) => {
    const token = safeLocalStorageGetItem("authToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (import.meta.env.DEV) {
      console.warn("API Error:", err.response?.status, err.response?.data?.error || err.message);
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (username, email, password) =>
    api.post("/auth/register", { username, email, password }),
  login: (email, password) => api.post("/auth/login", { email, password }),
  getProfile: () => api.get("/auth/me"),
  changePassword: (oldPassword, newPassword) => {
    const payload = { newPassword };
    if (oldPassword != null) payload.oldPassword = oldPassword;
    return api.post("/auth/change-password", payload);
  },
  googleSignIn: (userInfo) => api.post("/auth/google", { userInfo }),
  facebookSignIn: (userInfo) => api.post("/auth/facebook", { userInfo }),
  appleSignIn: (userInfo) => api.post("/auth/apple", { userInfo }),
};

export const wordsAPI = {
  list: (params) => api.get("/words", { params }),
  stats: () => api.get("/words/stats"),
  get: (wordId) => api.get(`/words/${wordId}`),
  create: (body) => api.post("/words", body),
  batch: (words, sourceImage) => api.post("/words/batch", { words, sourceImage }),
  updateStatus: (wordId, status) => api.patch(`/words/${wordId}/status`, { status }),
  delete: (wordId) => api.delete(`/words/${wordId}`),
  generateDetails: (wordId, options) => api.post(`/words/${wordId}/generate-details`, options || {}),
  generateCongrats: () => api.post("/words/generate-congrats"),
};

export const usersAPI = {
  getLearningPlan: () => api.get("/users/learning-plan"),
  updateLearningPlan: (body) => api.patch("/users/learning-plan", body),
  updateProfile: (body) => api.patch("/users/profile", body),
  updateTheme: (theme) => api.patch("/users/theme", { theme }),
  deleteAccount: () => api.delete("/users/account"),
};

export const articlesAPI = {
  list: () => api.get("/articles"),
  generate: (wordCount = 10) => api.post("/articles/generate", { wordCount }),
  markRead: (articleId) => api.patch(`/articles/${articleId}/read`),
};

export const ocrAPI = {
  extract: (formData) => api.post("/ocr/extract", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  extractBase64: (imageBase64) => api.post("/ocr/extract-base64", { imageBase64 }),
  extractText: (imageBase64) => api.post("/ocr/extract-base64", { imageBase64 }),
};

export const speechAPI = {
  recognize: (formData) => api.post("/speech/recognize", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  recognizeBase64: (audioBase64, languageCode) => api.post("/speech/recognize-base64", { audioBase64, languageCode }),
  ttsVoices: () => api.get("/speech/tts/voices"),
  ttsSynthesize: (text, voiceId, lang) => api.post("/speech/tts/synthesize", { text, voiceId, lang }),
};

export default api;
