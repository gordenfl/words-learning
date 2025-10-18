import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 使用电脑的局域网IP地址，手机才能访问
// 如果在iOS模拟器中运行，可以使用 localhost
// 如果在Android模拟器中运行，可以使用 10.0.2.2
// 如果在物理设备上运行，必须使用电脑的局域网IP
const API_BASE_URL = 'http://192.168.101.95:3000/api';

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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
  
  getStats: () =>
    api.get('/words/stats'),
  
  addWord: (word, definition, examples, sourceImage) =>
    api.post('/words', { word, definition, examples, sourceImage }),
  
  addWords: (words, sourceImage) =>
    api.post('/words/batch', { words, sourceImage }),
  
  updateWordStatus: (wordId, status) =>
    api.patch(`/words/${wordId}/status`, { status }),
  
  deleteWord: (wordId) =>
    api.delete(`/words/${wordId}`),
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

export default api;

