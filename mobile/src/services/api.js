import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../../config';

// 从配置文件读取API地址
// 如需修改IP地址，请编辑 mobile/config.js 文件
const API_BASE_URL = Config.API.BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (__DEV__) {
      console.log('🔐 API Request:', config.method.toUpperCase(), config.url);
      console.log('   Token exists:', !!token);
      if (token) {
        console.log('   Token preview:', token.substring(0, 20) + '...');
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 只在开发时打印简洁的错误信息（不显示堆栈）
    if (__DEV__) {
      const status = error.response?.status;
      const message = error.response?.data?.error || error.message;
      console.log(`❌ API Error (${status}):`, message);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
  
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  
  getProfile: () =>
    api.get('/auth/me'),
  
  changePassword: (oldPassword, newPassword) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),
};

// Words API
export const wordsAPI = {
  getWords: (status) =>
    api.get('/words', { params: { status } }),
  
  getAll: () =>
    api.get('/words'),
  
  getStats: () =>
    api.get('/words/stats'),
  
  addWord: (word, definition, examples, sourceImage) =>
    api.post('/words', { word, definition, examples, sourceImage }),
  
  addWords: (words, sourceImage) =>
    api.post('/words/batch', { words, sourceImage }),
  
  updateStatus: (wordId, status) =>
    api.patch(`/words/${wordId}/status`, { status }),
  
  updateWordStatus: (wordId, status) =>
    api.patch(`/words/${wordId}/status`, { status }),
  
  delete: (wordId) =>
    api.delete(`/words/${wordId}`),
  
  deleteWord: (wordId) =>
    api.delete(`/words/${wordId}`),
  
  generateDetails: (wordId) =>
    api.post(`/words/${wordId}/generate-details`),
};

// Articles API
export const articlesAPI = {
  getArticles: () =>
    api.get('/articles'),
  
  generateArticle: (wordCount) =>
    api.post('/articles/generate', { wordCount }),
  
  markAsRead: (articleId) =>
    api.patch(`/articles/${articleId}/read`),
};

// Users API
export const usersAPI = {
  getUser: (userId) =>
    api.get(`/users/${userId}`),
  
  updateProfile: (displayName, avatar, bio) =>
    api.patch('/users/profile', { displayName, avatar, bio }),
  
  followUser: (userId) =>
    api.post(`/users/${userId}/follow`),
  
  unfollowUser: (userId) =>
    api.delete(`/users/${userId}/follow`),
  
  searchUsers: (query) =>
    api.get('/users/search/query', { params: { q: query } }),
  
  deleteAccount: () =>
    api.delete('/users/account'),
  
  // Learning Plan APIs
  getLearningPlan: () =>
    api.get('/users/learning-plan'),
  
  updateLearningPlan: (plan) =>
    api.patch('/users/learning-plan', plan),
};

// OCR API
export const ocrAPI = {
  extractText: (imageBase64) =>
    api.post('/ocr/extract-base64', { imageBase64 }),
};

export default api;

