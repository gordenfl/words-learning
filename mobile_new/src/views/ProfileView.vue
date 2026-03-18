<template>
  <div class="profile-page" :style="{ backgroundColor: theme.background }">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p class="loader-text">Loading profile...</p>
    </div>

    <template v-else>
      <header class="page-header" :style="{ backgroundColor: theme.primary }"></header>

      <div class="scroll-content">
        <div class="content">
          <!-- Profile Header Card -->
          <section class="card profile-card">
            <div class="profile-card-inner">
              <button
                type="button"
                class="avatar-wrap"
                :disabled="uploadingAvatar"
                @click="handleAvatarPress"
              >
                <div class="avatar">
                  <img v-if="avatarSrc" :src="avatarSrc" alt="" class="avatar-img" />
                  <span v-else class="avatar-letter">{{ (user?.username || user?.email || "?")[0].toUpperCase() }}</span>
                </div>
                <div v-if="uploadingAvatar" class="avatar-overlay">
                  <div class="spinner small"></div>
                </div>
              </button>
              <div class="user-info">
                <h2 class="username">{{ user?.username || "User" }}</h2>
                <p class="email">{{ user?.email || "" }}</p>
              </div>
              <button type="button" class="delete-account-btn" aria-label="Delete account" @click="handleDeleteAccount">
                🗑️
              </button>
            </div>
          </section>

          <!-- Edit Profile Card -->
          <section class="card form-card">
            <h3 class="section-title">Edit Profile</h3>
            <div class="input-wrap">
              <label class="label">Display Name</label>
              <input v-model="displayName" type="text" class="input" placeholder="Display name" />
            </div>
            <div class="input-wrap">
              <label class="label">Bio</label>
              <textarea v-model="bio" class="input textarea" placeholder="Bio" rows="4"></textarea>
            </div>
            <button type="button" class="btn primary" :disabled="saving" @click="handleUpdateProfile">
              {{ saving ? "Saving..." : "Update Profile" }}
            </button>
          </section>

          <!-- Voice Card -->
          <section class="card settings-card">
            <h3 class="section-title">Voice · 语音</h3>
            <p class="section-hint">Choose TTS voice for reading aloud (ChatTTS)</p>
            <div class="voice-grid">
              <button
                v-for="v in ttsVoices"
                :key="v.id"
                type="button"
                class="voice-btn"
                :class="{ active: ttsVoice === v.id }"
                :style="ttsVoice === v.id ? { background: theme.primary, color: '#fff' } : {}"
                @click="setVoice(v.id)"
              >
                <span class="voice-name">{{ v.name }}</span>
                <span class="voice-gender">{{ v.gender === 'male' ? '♂' : '♀' }}</span>
              </button>
            </div>
          </section>

          <!-- Theme Card -->
          <section class="card settings-card">
            <h3 class="section-title">Theme</h3>
            <p class="section-hint">Choose your favorite color theme</p>
            <div class="theme-buttons">
              <button
                v-for="t in themeVariants"
                :key="t.name"
                type="button"
                class="theme-btn"
                :class="{ active: currentThemeName === t.name }"
                :style="currentThemeName === t.name ? { background: t.colors.primary, color: '#fff' } : {}"
                @click="setTheme(t.name)"
              >
                {{ t.displayName }}
              </button>
            </div>
          </section>

          <!-- Account Settings Card -->
          <section class="card settings-card">
            <h3 class="section-title">Account Settings</h3>
            <button type="button" class="setting-row" @click="showPasswordModal = true">
              <span class="setting-icon">🔒</span>
              <span class="setting-text">Change Password</span>
              <span class="setting-arrow">›</span>
            </button>
            <div class="divider"></div>
            <button type="button" class="setting-row logout-row" @click="handleLogout">
              <span class="setting-icon">🚪</span>
              <span class="setting-text">Logout</span>
              <span class="setting-arrow">›</span>
            </button>
          </section>
        </div>
      </div>

      <!-- Change Password Modal -->
      <div v-if="showPasswordModal" class="modal-overlay" @click.self="closePasswordModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Change Password</h3>
            <button type="button" class="modal-close" @click="closePasswordModal">×</button>
          </div>
          <div class="modal-body">
            <p v-if="isOAuthUser" class="helper-text">
              You're using {{ oauthProviderName }} login. You can set a password without entering your current password.
            </p>
            <div class="input-wrap">
              <label class="label">{{ isOAuthUser ? "Current Password (Optional)" : "Current Password" }}</label>
              <input
                v-model="currentPassword"
                type="password"
                class="input"
                :placeholder="isOAuthUser ? 'Leave empty if setting for first time' : ''"
                autocomplete="current-password"
              />
            </div>
            <div class="input-wrap">
              <label class="label">New Password</label>
              <input v-model="newPassword" type="password" class="input" autocomplete="new-password" />
            </div>
            <div class="input-wrap">
              <label class="label">Confirm New Password</label>
              <input v-model="confirmPassword" type="password" class="input" autocomplete="new-password" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn secondary" :disabled="changingPassword" @click="closePasswordModal">
              Cancel
            </button>
            <button type="button" class="btn primary" :disabled="changingPassword" @click="handleConfirmPasswordChange">
              {{ changingPassword ? "Changing..." : "Change" }}
            </button>
          </div>
        </div>
      </div>

      <!-- Avatar source modal -->
      <div v-if="showAvatarModal" class="modal-overlay" @click.self="showAvatarModal = false">
        <div class="modal-card avatar-modal">
          <p class="modal-title">Change Avatar</p>
          <p class="section-hint">Choose how to update your avatar</p>
          <button type="button" class="btn primary full" @click="triggerTakePhoto">Take Photo</button>
          <button type="button" class="btn primary full" @click="triggerChooseGallery">Choose from Gallery</button>
          <button type="button" class="btn secondary full" @click="showAvatarModal = false">Cancel</button>
        </div>
      </div>

      <!-- Hidden file inputs for avatar -->
      <input
        ref="inputCapture"
        type="file"
        accept="image/*"
        capture="user"
        class="hidden-input"
        @change="onAvatarFileSelected"
      />
      <input ref="inputGallery" type="file" accept="image/*" class="hidden-input" @change="onAvatarFileSelected" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { authAPI, usersAPI, speechAPI } from "../services/api";

const themeVariants = [
  { name: "blue", displayName: "天蓝色 / Blue", colors: { primary: "#42A5F5", background: "#E3F2FD" } },
  { name: "green", displayName: "草绿色 / Green", colors: { primary: "#7CB342", background: "#F1F8E9" } },
  { name: "pink", displayName: "粉红色 / Pink", colors: { primary: "#FF6B9D", background: "#FFF8F0" } },
];

const theme = ref({ background: "#E3F2FD", primary: "#42A5F5" });

const router = useRouter();
const auth = useAuthStore();
const user = computed(() => auth.user);
const loading = ref(true);
const saving = ref(false);
const displayName = ref("");
const bio = ref("");
const showPasswordModal = ref(false);
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const changingPassword = ref(false);
const uploadingAvatar = ref(false);
const inputCapture = ref(null);
const inputGallery = ref(null);
const showAvatarModal = ref(false);
const ttsVoice = ref("xiaoming");
const ttsVoices = ref([
  { id: "xiaoming", name: "小明", gender: "male" },
  { id: "xiaoli", name: "小李", gender: "male" },
  { id: "laowang", name: "老王", gender: "male" },
  { id: "xiaomei", name: "小美", gender: "female" },
  { id: "xiaofang", name: "小芳", gender: "female" },
  { id: "xiaohong", name: "小红", gender: "female" },
  { id: "laoli", name: "老李", gender: "male" },
  { id: "xiaoling", name: "小玲", gender: "female" },
]);

const currentThemeName = ref((() => {
  try {
    return localStorage.getItem("appTheme") || user.value?.theme || "blue";
  } catch (_) {
    return "blue";
  }
})());

function applyTheme(name) {
  const t = themeVariants.find((x) => x.name === name);
  if (t) {
    theme.value = { background: t.colors.background, primary: t.colors.primary };
  }
}

const avatarSrc = computed(() => {
  const av = user.value?.profile?.avatar;
  if (!av) return "";
  if (typeof av === "string" && (av.startsWith("data:") || av.startsWith("http"))) return av;
  return `data:image/jpeg;base64,${av}`;
});

const isOAuthUser = computed(() => {
  const p = user.value?.authProvider;
  return p === "google" || p === "facebook" || p === "apple";
});
const oauthProviderName = computed(() => {
  const p = user.value?.authProvider;
  if (p === "google") return "Google";
  if (p === "facebook") return "Facebook";
  if (p === "apple") return "Apple";
  return "";
});

async function loadVoices() {
  try {
    const { data } = await speechAPI.ttsVoices();
    if (data?.voices?.length) ttsVoices.value = data.voices;
  } catch (_) {}
}

function setVoice(id) {
  ttsVoice.value = id;
  handleUpdateTtsVoice(id);
}

async function handleUpdateTtsVoice(voiceId) {
  try {
    await usersAPI.updateProfile({ ttsVoice: voiceId });
    await auth.fetchProfile();
  } catch (_) {}
}

watch(user, (u) => {
  if (u?.profile) {
    displayName.value = u.profile.displayName || "";
    bio.value = u.profile.bio || "";
    ttsVoice.value = u.profile.ttsVoice || "xiaoming";
  }
  const name = u?.theme || currentThemeName.value;
  if (name) {
    currentThemeName.value = name;
    applyTheme(name);
  }
}, { immediate: true });

async function loadProfile() {
  try {
    await auth.fetchProfile();
    loadVoices();
    const u = auth.user;
    if (u?.profile) {
      displayName.value = u.profile.displayName || "";
      bio.value = u.profile.bio || "";
      ttsVoice.value = u.profile.ttsVoice || "xiaoming";
    }
    const name = u?.theme || "blue";
    currentThemeName.value = name;
    applyTheme(name);
  } catch (_) {}
  finally {
    loading.value = false;
  }
}

async function handleUpdateProfile() {
  saving.value = true;
  try {
    await usersAPI.updateProfile({ displayName: displayName.value, bio: bio.value, ttsVoice: ttsVoice.value });
    await auth.fetchProfile();
    alert("Profile updated successfully");
  } catch (_) {
    alert("Failed to update profile");
  } finally {
    saving.value = false;
  }
}

function handleAvatarPress() {
  if (uploadingAvatar.value) return;
  showAvatarModal.value = true;
}
function triggerTakePhoto() {
  showAvatarModal.value = false;
  inputCapture.value?.click();
}
function triggerChooseGallery() {
  showAvatarModal.value = false;
  inputGallery.value?.click();
}

function onAvatarFileSelected(ev) {
  const file = ev.target.files?.[0];
  ev.target.value = "";
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = async () => {
    let dataUrl = reader.result;
    let base64 = dataUrl;
    if (typeof dataUrl === "string" && dataUrl.includes(",")) base64 = dataUrl.split(",", 1)[1] || dataUrl;
    uploadingAvatar.value = true;
    try {
      await usersAPI.updateProfile({ displayName: displayName.value, bio: bio.value, avatar: base64 });
      await auth.fetchProfile();
    } catch (_) {
      alert("Failed to upload avatar");
    } finally {
      uploadingAvatar.value = false;
    }
  };
  reader.readAsDataURL(file);
}

function setTheme(name) {
  currentThemeName.value = name;
  applyTheme(name);
  try {
    localStorage.setItem("appTheme", name);
  } catch (_) {}
  usersAPI.updateTheme(name).catch(() => {});
}

function closePasswordModal() {
  showPasswordModal.value = false;
  currentPassword.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
}

async function handleConfirmPasswordChange() {
  const needCurrent = !isOAuthUser.value;
  if (needCurrent && !currentPassword.value.trim()) {
    alert("Please enter your current password");
    return;
  }
  if (!newPassword.value || !confirmPassword.value) {
    alert("Please fill in new password fields");
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    alert("New passwords do not match");
    return;
  }
  if (newPassword.value.length < 6) {
    alert("New password must be at least 6 characters");
    return;
  }
  changingPassword.value = true;
  try {
    await authAPI.changePassword(needCurrent ? currentPassword.value : null, newPassword.value);
    alert(isOAuthUser.value ? "Password set successfully" : "Password changed successfully");
    closePasswordModal();
  } catch (e) {
    alert(e.response?.data?.error || "Failed to change password");
  } finally {
    changingPassword.value = false;
  }
}

function handleLogout() {
  if (!confirm("Are you sure you want to logout?")) return;
  auth.logout();
  router.replace({ name: "Login" });
}

async function handleDeleteAccount() {
  if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
  try {
    await usersAPI.deleteAccount();
    auth.logout();
    router.replace({ name: "Login" });
  } catch (_) {
    alert("Failed to delete account");
  }
}

onMounted(loadProfile);
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: 0;
}
.loading-container {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #E3F2FD;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E8E8E8;
  border-top-color: #42A5F5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spinner.small {
  width: 28px;
  height: 28px;
  border-width: 2px;
  border-top-color: #fff;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loader-text { font-size: 17px; color: #7F8C8D; margin: 0; }

.page-header {
  padding-top: calc(10px + env(safe-area-inset-top, 0px));
  padding-bottom: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

.scroll-content {
  overflow: auto;
  padding-bottom: 24px;
}
.content {
  padding: 20px;
  max-width: 480px;
  margin: 0 auto;
}

.card {
  background: #fff;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.profile-card-inner {
  display: flex;
  align-items: center;
}
.avatar-wrap {
  position: relative;
  margin-right: 16px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}
.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #42A5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-letter {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
}
.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-info {
  flex: 1;
  min-width: 0;
}
.username {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2C3E50;
  margin: 0 0 4px;
}
.email {
  font-size: 0.95rem;
  color: #7F8C8D;
  margin: 0;
}
.delete-account-btn {
  padding: 8px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1.2rem;
  opacity: 0.8;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2C3E50;
  margin: 0 0 12px;
}
.section-hint {
  font-size: 0.9rem;
  color: #7F8C8D;
  margin: -4px 0 12px;
}

.input-wrap { margin-bottom: 16px; }
.label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #2C3E50;
  margin-bottom: 6px;
}
.input {
  width: 100%;
  padding: 12px 16px;
  font-size: 1rem;
  border: 1px solid #E8E8E8;
  border-radius: 12px;
  box-sizing: border-box;
}
.input:focus {
  outline: none;
  border-color: #42A5F5;
}
.textarea {
  min-height: 88px;
  resize: vertical;
}

.btn {
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 16px;
  cursor: pointer;
  border: none;
}
.btn.primary {
  background: #42A5F5;
  color: #fff;
  margin-top: 8px;
}
.btn.primary:disabled { opacity: 0.7; cursor: not-allowed; }
.btn.secondary {
  background: #E8E8E8;
  color: #2C3E50;
}

.theme-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}
.theme-btn {
  padding: 10px 18px;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 14px;
  border: 2px solid #E8E8E8;
  background: #fff;
  color: #2C3E50;
  cursor: pointer;
}
.theme-btn.active {
  border-color: transparent;
  color: #fff;
}
.voice-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.voice-btn {
  padding: 10px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 12px;
  border: 2px solid #E8E8E8;
  background: #fff;
  color: #2C3E50;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.voice-btn.active {
  border-color: transparent;
  color: #fff;
}
.voice-name { font-weight: 600; }
.voice-gender { font-size: 0.85rem; opacity: 0.9; }

.setting-row {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-size: 1rem;
  color: #2C3E50;
}
.setting-icon { margin-right: 10px; font-size: 1.2rem; }
.setting-text { flex: 1; }
.setting-arrow { color: #7F8C8D; font-size: 1.2rem; }
.logout-row .setting-icon { opacity: 0.9; }
.divider {
  height: 1px;
  background: #F0F0F0;
  margin: 4px 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-card {
  background: #fff;
  border-radius: 24px;
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 12px;
}
.modal-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: #2C3E50; }
.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  font-size: 1.5rem;
  color: #7F8C8D;
  cursor: pointer;
}
.modal-body { padding: 0 20px; }
.modal-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
}
.modal-actions .btn { flex: 1; }
.btn.full { width: 100%; margin-top: 8px; }
.btn.full:first-of-type { margin-top: 0; }
.avatar-modal .section-hint { margin-top: 0; }
.helper-text {
  font-size: 12px;
  color: #7F8C8D;
  font-style: italic;
  margin: 0 0 12px;
}

.hidden-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
</style>
