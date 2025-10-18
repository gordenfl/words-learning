import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { usersAPI } from '../services/api';

const DIFFICULTY_LEVELS = [
  { 
    value: 'beginner', 
    label: 'Beginner (初级)', 
    description: 'Simple words and basic sentence patterns',
    icon: '📖'
  },
  { 
    value: 'intermediate', 
    label: 'Intermediate (中级)', 
    description: 'Everyday vocabulary and common expressions',
    icon: '📚'
  },
  { 
    value: 'advanced', 
    label: 'Advanced (高级)', 
    description: 'Complex words and sophisticated usage',
    icon: '🎓'
  },
];

const DAILY_GOALS = [5, 10, 15, 20, 30];
const WEEKLY_GOALS = [30, 50, 70, 100, 150];
const MONTHLY_GOALS = [100, 200, 300, 500, 800];

const STUDY_TIMES = [
  { value: 'morning', label: 'Morning (早上)', icon: '🌅' },
  { value: 'afternoon', label: 'Afternoon (下午)', icon: '☀️' },
  { value: 'evening', label: 'Evening (晚上)', icon: '🌙' },
  { value: 'night', label: 'Night (深夜)', icon: '🌃' },
];

export default function LearningPlanScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [dailyGoal, setDailyGoal] = useState(10);
  const [weeklyGoal, setWeeklyGoal] = useState(50);
  const [monthlyGoal, setMonthlyGoal] = useState(200);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [studyTimes, setStudyTimes] = useState([]);

  useEffect(() => {
    loadLearningPlan();
  }, []);

  const loadLearningPlan = async () => {
    try {
      const response = await usersAPI.getLearningPlan();
      const plan = response.data.learningPlan;
      
      setDailyGoal(plan.dailyWordGoal || 10);
      setWeeklyGoal(plan.weeklyWordGoal || 50);
      setMonthlyGoal(plan.monthlyWordGoal || 200);
      setDifficulty(plan.difficulty || 'intermediate');
      setStudyTimes(plan.preferredStudyTime || []);
    } catch (error) {
      console.error('Error loading learning plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await usersAPI.updateLearningPlan({
        dailyWordGoal: dailyGoal,
        weeklyWordGoal: weeklyGoal,
        monthlyWordGoal: monthlyGoal,
        difficulty,
        preferredStudyTime: studyTimes
      });
      
      Alert.alert('Saved! ✅', 'Your learning plan has been updated successfully!');
    } catch (error) {
      Alert.alert('Oops!', 'Could not save your learning plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStudyTime = (time) => {
    if (studyTimes.includes(time)) {
      setStudyTimes(studyTimes.filter(t => t !== time));
    } else {
      setStudyTimes([...studyTimes, time]);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>🎯 Learning Goals</Text>
        <Text style={styles.sectionDesc}>
          Set your Chinese learning goals to stay motivated
        </Text>

        {/* Daily Goal */}
        <View style={styles.goalSection}>
          <Text style={styles.goalLabel}>Daily Goal</Text>
          <View style={styles.optionsRow}>
            {DAILY_GOALS.map(goal => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.optionButton,
                  dailyGoal === goal && styles.optionButtonActive
                ]}
                onPress={() => setDailyGoal(goal)}
              >
                <Text style={[
                  styles.optionText,
                  dailyGoal === goal && styles.optionTextActive
                ]}>
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helperText}>{dailyGoal} words per day</Text>
        </View>

        {/* Weekly Goal */}
        <View style={styles.goalSection}>
          <Text style={styles.goalLabel}>Weekly Goal</Text>
          <View style={styles.optionsRow}>
            {WEEKLY_GOALS.map(goal => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.optionButton,
                  weeklyGoal === goal && styles.optionButtonActive
                ]}
                onPress={() => setWeeklyGoal(goal)}
              >
                <Text style={[
                  styles.optionText,
                  weeklyGoal === goal && styles.optionTextActive
                ]}>
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helperText}>{weeklyGoal} words per week</Text>
        </View>

        {/* Monthly Goal */}
        <View style={styles.goalSection}>
          <Text style={styles.goalLabel}>Monthly Goal</Text>
          <View style={styles.optionsRow}>
            {MONTHLY_GOALS.map(goal => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.optionButton,
                  monthlyGoal === goal && styles.optionButtonActive
                ]}
                onPress={() => setMonthlyGoal(goal)}
              >
                <Text style={[
                  styles.optionText,
                  monthlyGoal === goal && styles.optionTextActive
                ]}>
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helperText}>{monthlyGoal} words per month</Text>
        </View>

        {/* Difficulty Level */}
        <Text style={styles.sectionTitle}>📊 Difficulty Level</Text>
        <Text style={styles.sectionDesc}>
          Choose your Chinese proficiency level
        </Text>

        {DIFFICULTY_LEVELS.map(level => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.difficultyCard,
              difficulty === level.value && styles.difficultyCardActive
            ]}
            onPress={() => setDifficulty(level.value)}
          >
            <View style={styles.difficultyHeader}>
              <Text style={styles.difficultyIcon}>{level.icon}</Text>
              <Text style={[
                styles.difficultyLabel,
                difficulty === level.value && styles.difficultyLabelActive
              ]}>
                {level.label}
              </Text>
              {difficulty === level.value && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.difficultyDesc}>{level.description}</Text>
          </TouchableOpacity>
        ))}

        {/* Preferred Study Time */}
        <Text style={styles.sectionTitle}>⏰ Preferred Study Time</Text>
        <Text style={styles.sectionDesc}>
          When do you prefer to study? (Select all that apply)
        </Text>

        <View style={styles.timeGrid}>
          {STUDY_TIMES.map(time => (
            <TouchableOpacity
              key={time.value}
              style={[
                styles.timeCard,
                studyTimes.includes(time.value) && styles.timeCardActive
              ]}
              onPress={() => toggleStudyTime(time.value)}
            >
              <Text style={styles.timeIcon}>{time.icon}</Text>
              <Text style={[
                styles.timeLabel,
                studyTimes.includes(time.value) && styles.timeLabelActive
              ]}>
                {time.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Learning Plan</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  goalSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    marginBottom: 10,
  },
  optionButtonActive: {
    backgroundColor: '#4A90E2',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  optionTextActive: {
    color: '#fff',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  difficultyCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  difficultyCardActive: {
    borderColor: '#4A90E2',
    backgroundColor: '#E3F2FD',
  },
  difficultyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  difficultyIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  difficultyLabelActive: {
    color: '#4A90E2',
  },
  checkmark: {
    fontSize: 20,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  difficultyDesc: {
    fontSize: 14,
    color: '#666',
    marginLeft: 34,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  timeCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginRight: '2%',
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  timeCardActive: {
    borderColor: '#4A90E2',
    backgroundColor: '#E3F2FD',
  },
  timeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  timeLabelActive: {
    color: '#4A90E2',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

