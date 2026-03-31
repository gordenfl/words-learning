import { createRouter, createWebHashHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const routes = [
  { path: "/login", name: "Login", component: () => import("../views/LoginView.vue"), meta: { guest: true } },
  { path: "/register", name: "Register", component: () => import("../views/RegisterView.vue"), meta: { guest: true } },
  { path: "/", name: "Home", component: () => import("../views/HomeView.vue"), meta: { requiresAuth: true } },
  { path: "/words", name: "WordsList", component: () => import("../views/WordsListView.vue"), meta: { requiresAuth: true } },
  { path: "/words/:id", name: "WordDetail", component: () => import("../views/WordDetailView.vue"), meta: { requiresAuth: true } },
  { path: "/words/:id/writing", name: "Writing", component: () => import("../views/WritingView.vue"), meta: { requiresAuth: true } },
  { path: "/words/:id/compound-practice", name: "CompoundPractice", component: () => import("../views/CompoundPracticeView.vue"), meta: { requiresAuth: true } },
  { path: "/articles", name: "ArticleList", component: () => import("../views/ArticleListView.vue"), meta: { requiresAuth: true } },
  { path: "/articles/:id", name: "Article", component: () => import("../views/ArticleView.vue"), meta: { requiresAuth: true } },
  { path: "/profile", name: "Profile", component: () => import("../views/ProfileView.vue"), meta: { requiresAuth: true } },
  { path: "/learning-plan", name: "LearningPlan", component: () => import("../views/LearningPlanView.vue"), meta: { requiresAuth: true } },
  { path: "/image-view", name: "ImageView", component: () => import("../views/ImageView.vue"), meta: { requiresAuth: true } },
];

const router = createRouter({
  // Capacitor / 原生 WebView 下本地加载时，使用 hash history 更稳，避免白屏/空路由
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: "Login" });
    return;
  }
  if (to.meta.guest && auth.isAuthenticated) {
    next({ name: "Home" });
    return;
  }
  next();
});

export default router;
