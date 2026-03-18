<template>
  <div class="plan-page" :style="{ backgroundColor: theme.background }">
    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p class="loader-text">Loading plan...</p>
    </div>

    <template v-else>
      <!-- Header strip（与 mobile 一致：主色窄条） -->
      <header class="header" :style="{ backgroundColor: theme.primary }"></header>

      <div class="scroll-content">
        <div class="content">
          <!-- Learning Goals Card -->
          <section class="section-card">
            <h2 class="section-title">🎯 Learning Goals</h2>
            <p class="section-desc">Set your Chinese learning goals to stay motivated</p>

            <div class="goal-section">
              <h3 class="goal-label">Daily Goal</h3>
              <div class="options-row">
                <button
                  v-for="g in DAILY_GOALS"
                  :key="g"
                  type="button"
                  class="chip"
                  :class="{ selected: plan.dailyWordGoal === g }"
                  @click="setDailyGoal(g)"
                >
                  {{ g }}
                </button>
              </div>
              <p class="helper-text">{{ plan.dailyWordGoal }} words per day</p>
            </div>

            <div class="goal-section">
              <h3 class="goal-label">Weekly Goal</h3>
              <div class="options-row">
                <button
                  v-for="g in WEEKLY_GOALS"
                  :key="g"
                  type="button"
                  class="chip"
                  :class="{ selected: plan.weeklyWordGoal === g }"
                  @click="setWeeklyGoal(g)"
                >
                  {{ g }}
                </button>
              </div>
              <p class="helper-text">{{ plan.weeklyWordGoal }} words per week</p>
            </div>

            <div class="goal-section">
              <h3 class="goal-label">Monthly Goal</h3>
              <div class="options-row">
                <button
                  v-for="g in MONTHLY_GOALS"
                  :key="g"
                  type="button"
                  class="chip"
                  :class="{ selected: plan.monthlyWordGoal === g }"
                  @click="setMonthlyGoal(g)"
                >
                  {{ g }}
                </button>
              </div>
              <p class="helper-text">{{ plan.monthlyWordGoal }} words per month</p>
            </div>
          </section>

          <!-- Difficulty Level Card -->
          <section class="section-card">
            <h2 class="section-title">📊 Difficulty Level</h2>
            <p class="section-desc">Choose your Chinese proficiency level</p>

            <button
              v-for="level in DIFFICULTY_LEVELS"
              :key="level.value"
              type="button"
              class="difficulty-card"
              :class="{ active: plan.difficulty === level.value }"
              @click="setDifficulty(level.value)"
            >
              <div class="difficulty-header">
                <span class="difficulty-icon">{{ level.icon }}</span>
                <span class="difficulty-label" :class="{ active: plan.difficulty === level.value }">{{ level.label }}</span>
                <span v-if="plan.difficulty === level.value" class="check-chip">Selected</span>
              </div>
              <p class="difficulty-desc">{{ level.description }}</p>
            </button>
          </section>

          <!-- Preferred Study Time Card -->
          <section class="section-card">
            <h2 class="section-title">⏰ Preferred Study Time</h2>
            <p class="section-desc">When do you prefer to study? (Select all that apply)</p>

            <div class="time-grid">
              <button
                v-for="t in STUDY_TIMES"
                :key="t.value"
                type="button"
                class="time-card"
                :class="{ active: plan.preferredStudyTime.includes(t.value) }"
                @click="toggleStudyTime(t.value)"
              >
                <span class="time-icon">{{ t.icon }}</span>
                <span class="time-label" :class="{ active: plan.preferredStudyTime.includes(t.value) }">{{ t.label }}</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      <!-- Save success snackbar -->
      <Transition name="snack">
        <div v-if="showSavedToast" class="snackbar">✓ Saved</div>
      </Transition>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { usersAPI } from "../services/api";
import Config from "../config";

const DAILY_GOALS = [5, 10, 15, 20, 30];
const WEEKLY_GOALS = [30, 50, 70, 100, 150];
const MONTHLY_GOALS = [100, 200, 300, 500, 800];

const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner (初级)", description: "Simple words and basic sentence patterns", icon: "📖" },
  { value: "intermediate", label: "Intermediate (中级)", description: "Everyday vocabulary and common expressions", icon: "📚" },
  { value: "advanced", label: "Advanced (高级)", description: "Complex words and sophisticated usage", icon: "🎓" },
];

const STUDY_TIMES = [
  { value: "morning", label: "Morning (早上)", icon: "🌅" },
  { value: "afternoon", label: "Afternoon (下午)", icon: "☀️" },
  { value: "evening", label: "Evening (晚上)", icon: "🌙" },
  { value: "night", label: "Night (深夜)", icon: "🌃" },
];

const theme = reactive({
  background: "#E3F2FD",
  primary: "#42A5F5",
  text: "#2C3E50",
  textLight: "#7F8C8D",
  card: "#FFFFFF",
  border: "#E8E8E8",
  textInverse: "#FFFFFF",
});

const plan = ref({
  dailyWordGoal: Config.LEARNING.DEFAULT_DAILY_GOAL,
  weeklyWordGoal: Config.LEARNING.DEFAULT_WEEKLY_GOAL,
  monthlyWordGoal: Config.LEARNING.DEFAULT_MONTHLY_GOAL,
  difficulty: Config.LEARNING.DEFAULT_DIFFICULTY,
  preferredStudyTime: [],
});
const loading = ref(true);
const showSavedToast = ref(false);
let toastTimer = null;

async function load() {
  try {
    const { data } = await usersAPI.getLearningPlan();
    const lp = data.learningPlan;
    if (lp) {
      plan.value = {
        dailyWordGoal: lp.dailyWordGoal ?? plan.value.dailyWordGoal,
        weeklyWordGoal: lp.weeklyWordGoal ?? plan.value.weeklyWordGoal,
        monthlyWordGoal: lp.monthlyWordGoal ?? plan.value.monthlyWordGoal,
        difficulty: lp.difficulty ?? plan.value.difficulty,
        preferredStudyTime: Array.isArray(lp.preferredStudyTime) ? lp.preferredStudyTime : [],
      };
    }
  } catch (_) {}
  finally {
    loading.value = false;
  }
}

async function autoSave(updates) {
  try {
    await usersAPI.updateLearningPlan(updates);
    showSavedToast.value = true;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { showSavedToast.value = false; }, 1500);
  } catch (_) {}
}

function setDailyGoal(g) {
  plan.value.dailyWordGoal = g;
  autoSave({ dailyWordGoal: g });
}
function setWeeklyGoal(g) {
  plan.value.weeklyWordGoal = g;
  autoSave({ weeklyWordGoal: g });
}
function setMonthlyGoal(g) {
  plan.value.monthlyWordGoal = g;
  autoSave({ monthlyWordGoal: g });
}
function setDifficulty(v) {
  plan.value.difficulty = v;
  autoSave({ difficulty: v });
}
function toggleStudyTime(time) {
  const arr = plan.value.preferredStudyTime.includes(time)
    ? plan.value.preferredStudyTime.filter((t) => t !== time)
    : [...plan.value.preferredStudyTime, time];
  plan.value.preferredStudyTime = arr;
  autoSave({ preferredStudyTime: arr });
}

onMounted(load);
</script>

<style scoped>
.plan-page {
  min-height: 100vh;
  padding: 0;
}
.loading-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
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
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loader-text {
  font-size: 17px;
  color: #7F8C8D;
}

.header {
  padding-top: calc(10px + env(safe-area-inset-top, 0px));
  padding-bottom: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

.scroll-content {
  flex: 1;
  overflow: auto;
  padding-bottom: 24px;
}
.content {
  padding: 20px;
  max-width: 480px;
  margin: 0 auto;
}

.section-card {
  background: #fff;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2C3E50;
  margin: 0 0 6px;
}
.section-desc {
  font-size: 0.95rem;
  color: #7F8C8D;
  margin: 0 0 20px;
}

.goal-section {
  margin-bottom: 28px;
}
.goal-section:last-of-type {
  margin-bottom: 0;
}
.goal-label {
  font-size: 1rem;
  font-weight: 700;
  color: #2C3E50;
  margin: 0 0 12px;
}
.options-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}
.chip {
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #E8E8E8;
  background: #fff;
  color: #2C3E50;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}
.chip.selected {
  background: #42A5F5;
  border-color: #42A5F5;
  color: #fff;
}
.helper-text {
  font-size: 15px;
  color: #7F8C8D;
  font-style: italic;
  margin: 6px 0 0;
}

.difficulty-card {
  width: 100%;
  text-align: left;
  padding: 20px;
  border-radius: 16px;
  border: 2px solid #E8E8E8;
  background: #fff;
  margin-bottom: 12px;
  cursor: pointer;
}
.difficulty-card:last-child {
  margin-bottom: 0;
}
.difficulty-card.active {
  border-color: #42A5F5;
  background: rgba(66, 165, 245, 0.12);
}
.difficulty-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}
.difficulty-icon {
  font-size: 24px;
  margin-right: 12px;
}
.difficulty-label {
  flex: 1;
  font-size: 1rem;
  font-weight: 700;
  color: #2C3E50;
}
.difficulty-label.active {
  color: #42A5F5;
}
.check-chip {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 14px;
  background: #42A5F5;
  color: #fff;
  font-weight: 600;
}
.difficulty-desc {
  font-size: 0.95rem;
  color: #7F8C8D;
  margin: 6px 0 0 34px;
}

.time-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}
.time-card {
  padding: 20px;
  border-radius: 16px;
  border: 2px solid #E8E8E8;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}
.time-card.active {
  border-color: #42A5F5;
  background: rgba(66, 165, 245, 0.12);
}
.time-icon {
  font-size: 32px;
  margin-bottom: 6px;
}
.time-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2C3E50;
  text-align: center;
}
.time-label.active {
  color: #42A5F5;
}

.snackbar {
  position: fixed;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: #2C3E50;
  color: #fff;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 100;
}
.snack-enter-active,
.snack-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.snack-enter-from,
.snack-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
