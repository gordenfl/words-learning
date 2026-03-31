import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { safeLocalStorageGetItem, safeLocalStorageSetItem } from "../utils/safeStorage";
import { useAuthStore } from "./auth";

function _key(userId) {
  return `pinyinProgress_${userId || "anon"}`;
}

function _load(userId) {
  try {
    const raw = safeLocalStorageGetItem(_key(userId));
    if (!raw) return { initials: [], finals: [] };
    const parsed = JSON.parse(raw);
    return {
      initials: Array.isArray(parsed?.initials) ? parsed.initials : [],
      finals: Array.isArray(parsed?.finals) ? parsed.finals : [],
    };
  } catch {
    return { initials: [], finals: [] };
  }
}

function _save(userId, state) {
  safeLocalStorageSetItem(_key(userId), JSON.stringify(state));
}

export const usePinyinProgressStore = defineStore("pinyinProgress", () => {
  const auth = useAuthStore();
  const userId = computed(() => auth.user?.id || auth.user?._id || null);

  const initials = ref([]);
  const finals = ref([]);

  function init() {
    const data = _load(userId.value);
    initials.value = data.initials;
    finals.value = data.finals;
  }

  function markFinalLearned(final) {
    const f = (final || "").trim();
    if (!f) return;
    if (!finals.value.includes(f)) finals.value = [...finals.value, f];
    _save(userId.value, { initials: initials.value, finals: finals.value });
  }

  function markInitialLearned(initial) {
    const i = (initial || "").trim();
    if (!i) return;
    if (!initials.value.includes(i)) initials.value = [...initials.value, i];
    _save(userId.value, { initials: initials.value, finals: finals.value });
  }

  function isFinalLearned(final) {
    const f = (final || "").trim();
    return !!f && finals.value.includes(f);
  }

  function isInitialLearned(initial) {
    const i = (initial || "").trim();
    return !!i && initials.value.includes(i);
  }

  // Load immediately on first use
  init();

  return {
    initials,
    finals,
    isFinalLearned,
    isInitialLearned,
    markFinalLearned,
    markInitialLearned,
    init,
  };
});

