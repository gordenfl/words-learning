<template>
  <div class="learning-plan">
    <h1>Learning Plan</h1>
    <p v-if="loading">Loading...</p>
    <form v-else @submit.prevent="save" class="form">
      <label>Daily goal</label>
      <input v-model.number="plan.dailyWordGoal" type="number" min="1" />
      <label>Weekly goal</label>
      <input v-model.number="plan.weeklyWordGoal" type="number" min="1" />
      <label>Monthly goal</label>
      <input v-model.number="plan.monthlyWordGoal" type="number" min="1" />
      <label>Difficulty</label>
      <select v-model="plan.difficulty">
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
      <button type="submit" :disabled="saving">Save</button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { usersAPI } from "../services/api";
import Config from "../config";

const plan = ref({
  dailyWordGoal: Config.LEARNING.DEFAULT_DAILY_GOAL,
  weeklyWordGoal: Config.LEARNING.DEFAULT_WEEKLY_GOAL,
  monthlyWordGoal: Config.LEARNING.DEFAULT_MONTHLY_GOAL,
  difficulty: Config.LEARNING.DEFAULT_DIFFICULTY,
});
const loading = ref(true);
const saving = ref(false);

async function load() {
  try {
    const { data } = await usersAPI.getLearningPlan();
    if (data.learningPlan) {
      plan.value = { ...plan.value, ...data.learningPlan };
    }
  } catch (_) {}
  finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  try {
    await usersAPI.updateLearningPlan(plan.value);
  } catch (_) {}
  finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.learning-plan { padding: 1rem; max-width: 480px; margin: 0 auto; }
h1 { font-size: 1.25rem; margin-bottom: 1rem; }
.form label { display: block; margin-top: 0.75rem; }
.form input, .form select { width: 100%; padding: 0.5rem; margin-top: 0.25rem; box-sizing: border-box; }
.form button { margin-top: 1rem; padding: 0.5rem 1rem; background: #4A90E2; color: white; border: none; border-radius: 8px; cursor: pointer; }
.form button:disabled { opacity: 0.6; }
</style>
