import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  StatusBar,
} from "react-native";
import {
  Text,
  Card,
  Button,
  Chip,
  useTheme,
  Snackbar,
  Surface,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usersAPI } from "../services/api";
import ChildrenTheme from "../theme/childrenTheme";

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
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const [dailyGoal, setDailyGoal] = useState(10);
  const [weeklyGoal, setWeeklyGoal] = useState(50);
  const [monthlyGoal, setMonthlyGoal] = useState(200);
  const [difficulty, setDifficulty] = useState("intermediate");
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
      console.log('Error loading learning plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoSave = async (updates) => {
    try {
      await usersAPI.updateLearningPlan(updates);
      
      // 显示保存成功的toast提示
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 1500);
    } catch (error) {
      console.log('Auto-save failed:', error);
    }
  };

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    autoSave({ difficulty: newDifficulty });
  };

  const handleDailyGoalChange = (goal) => {
    setDailyGoal(goal);
    autoSave({ dailyWordGoal: goal });
  };

  const handleWeeklyGoalChange = (goal) => {
    setWeeklyGoal(goal);
    autoSave({ weeklyWordGoal: goal });
  };

  const handleMonthlyGoalChange = (goal) => {
    setMonthlyGoal(goal);
    autoSave({ monthlyWordGoal: goal });
  };

  const toggleStudyTime = (time) => {
    const newStudyTimes = studyTimes.includes(time)
      ? studyTimes.filter(t => t !== time)
      : [...studyTimes, time];
    
    setStudyTimes(newStudyTimes);
    autoSave({ preferredStudyTime: newStudyTimes });
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyMedium" style={styles.loaderText}>
          Loading plan...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: ChildrenTheme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={ChildrenTheme.colors.primary} />
      <View
        style={[
          styles.header,
          {
            paddingTop: (insets.top + 10) / 2,
            backgroundColor: ChildrenTheme.colors.primary,
          },
        ]}
      >
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.content}>
          {/* Learning Goals Card */}
          <Card style={styles.sectionCard} mode="elevated" elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                🎯 Learning Goals
              </Text>
              <Text variant="bodyMedium" style={styles.sectionDesc}>
                Set your Chinese learning goals to stay motivated
              </Text>

              {/* Daily Goal */}
              <View style={styles.goalSection}>
                <Text variant="titleMedium" style={styles.goalLabel}>
                  Daily Goal
                </Text>
                <View style={styles.optionsRow}>
                  {DAILY_GOALS.map((goal) => (
                    <Chip
                      key={goal}
                      selected={dailyGoal === goal}
                      onPress={() => handleDailyGoalChange(goal)}
                      style={styles.optionChip}
                      selectedColor={ChildrenTheme.colors.textInverse}
                      mode={dailyGoal === goal ? "flat" : "outlined"}
                    >
                      {goal}
                    </Chip>
                  ))}
                </View>
                <Text variant="bodySmall" style={styles.helperText}>
                  {dailyGoal} words per day
                </Text>
              </View>

              {/* Weekly Goal */}
              <View style={styles.goalSection}>
                <Text variant="titleMedium" style={styles.goalLabel}>
                  Weekly Goal
                </Text>
                <View style={styles.optionsRow}>
                  {WEEKLY_GOALS.map((goal) => (
                    <Chip
                      key={goal}
                      selected={weeklyGoal === goal}
                      onPress={() => handleWeeklyGoalChange(goal)}
                      style={styles.optionChip}
                      selectedColor={ChildrenTheme.colors.textInverse}
                      mode={weeklyGoal === goal ? "flat" : "outlined"}
                    >
                      {goal}
                    </Chip>
                  ))}
                </View>
                <Text variant="bodySmall" style={styles.helperText}>
                  {weeklyGoal} words per week
                </Text>
              </View>

              {/* Monthly Goal */}
              <View style={styles.goalSection}>
                <Text variant="titleMedium" style={styles.goalLabel}>
                  Monthly Goal
                </Text>
                <View style={styles.optionsRow}>
                  {MONTHLY_GOALS.map((goal) => (
                    <Chip
                      key={goal}
                      selected={monthlyGoal === goal}
                      onPress={() => handleMonthlyGoalChange(goal)}
                      style={styles.optionChip}
                      selectedColor={ChildrenTheme.colors.textInverse}
                      mode={monthlyGoal === goal ? "flat" : "outlined"}
                    >
                      {goal}
                    </Chip>
                  ))}
                </View>
                <Text variant="bodySmall" style={styles.helperText}>
                  {monthlyGoal} words per month
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Difficulty Level Card */}
          <Card style={styles.sectionCard} mode="elevated" elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                📊 Difficulty Level
              </Text>
              <Text variant="bodyMedium" style={styles.sectionDesc}>
                Choose your Chinese proficiency level
              </Text>

              {DIFFICULTY_LEVELS.map((level) => (
                <Surface
                  key={level.value}
                  style={[
                    styles.difficultyCard,
                    difficulty === level.value && styles.difficultyCardActive,
                  ]}
                  elevation={difficulty === level.value ? 2 : 0}
                  onTouchEnd={() => handleDifficultyChange(level.value)}
                >
                  <View style={styles.difficultyHeader}>
                    <Text style={styles.difficultyIcon}>{level.icon}</Text>
                    <Text
                      variant="titleMedium"
                      style={[
                        styles.difficultyLabel,
                        difficulty === level.value &&
                          styles.difficultyLabelActive,
                      ]}
                    >
                      {level.label}
                    </Text>
                    {difficulty === level.value && (
                      <Chip
                        icon="check-circle"
                        style={styles.checkmarkChip}
                        textStyle={styles.checkmarkText}
                      >
                        Selected
                      </Chip>
                    )}
                  </View>
                  <Text variant="bodyMedium" style={styles.difficultyDesc}>
                    {level.description}
                  </Text>
                </Surface>
              ))}
            </Card.Content>
          </Card>

          {/* Preferred Study Time Card */}
          <Card style={styles.sectionCard} mode="elevated" elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                ⏰ Preferred Study Time
              </Text>
              <Text variant="bodyMedium" style={styles.sectionDesc}>
                When do you prefer to study? (Select all that apply)
              </Text>

              <View style={styles.timeGrid}>
                {STUDY_TIMES.map((time) => (
                  <Surface
                    key={time.value}
                    style={[
                      styles.timeCard,
                      studyTimes.includes(time.value) &&
                        styles.timeCardActive,
                    ]}
                    elevation={studyTimes.includes(time.value) ? 2 : 0}
                    onTouchEnd={() => toggleStudyTime(time.value)}
                  >
                    <Text style={styles.timeIcon}>{time.icon}</Text>
                    <Text
                      variant="bodyMedium"
                      style={[
                        styles.timeLabel,
                        studyTimes.includes(time.value) &&
                          styles.timeLabelActive,
                      ]}
                    >
                      {time.label}
                    </Text>
                  </Surface>
                ))}
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      {/* Save Success Snackbar */}
      <Snackbar
        visible={showSavedToast}
        onDismiss={() => setShowSavedToast(false)}
        duration={1500}
        style={styles.snackbar}
      >
        ✓ Saved
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildrenTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: ChildrenTheme.spacing.xl,
  },
  loaderText: {
    color: ChildrenTheme.colors.textLight,
    marginTop: ChildrenTheme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: ChildrenTheme.spacing.sm,
    backgroundColor: ChildrenTheme.colors.primary,
    ...ChildrenTheme.shadows.medium,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: ChildrenTheme.spacing.md,
  },
  sectionCard: {
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  sectionTitle: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    marginBottom: ChildrenTheme.spacing.xs,
  },
  sectionDesc: {
    color: ChildrenTheme.colors.textLight,
    marginBottom: ChildrenTheme.spacing.md,
  },
  goalSection: {
    marginBottom: ChildrenTheme.spacing.lg,
  },
  goalLabel: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    marginBottom: ChildrenTheme.spacing.sm,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: ChildrenTheme.spacing.xs,
    gap: ChildrenTheme.spacing.xs,
  },
  optionChip: {
    marginRight: ChildrenTheme.spacing.xs,
    marginBottom: ChildrenTheme.spacing.xs,
  },
  helperText: {
    color: ChildrenTheme.colors.textLight,
    fontStyle: "italic",
    marginTop: ChildrenTheme.spacing.xs,
  },
  difficultyCard: {
    padding: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.medium,
    marginBottom: ChildrenTheme.spacing.sm,
    borderWidth: 2,
    borderColor: ChildrenTheme.colors.border,
    backgroundColor: ChildrenTheme.colors.card,
  },
  difficultyCardActive: {
    borderColor: ChildrenTheme.colors.primary,
    backgroundColor: ChildrenTheme.colors.primary + "20",
  },
  difficultyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: ChildrenTheme.spacing.xs,
  },
  difficultyIcon: {
    fontSize: 24,
    marginRight: ChildrenTheme.spacing.sm,
  },
  difficultyLabel: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    flex: 1,
  },
  difficultyLabelActive: {
    color: ChildrenTheme.colors.primary,
  },
  checkmarkChip: {
    backgroundColor: ChildrenTheme.colors.primary,
    height: 28,
  },
  checkmarkText: {
    color: ChildrenTheme.colors.textInverse,
    fontSize: 12,
  },
  difficultyDesc: {
    color: ChildrenTheme.colors.textLight,
    marginLeft: 34,
    marginTop: ChildrenTheme.spacing.xs,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: ChildrenTheme.spacing.sm,
    gap: ChildrenTheme.spacing.sm,
  },
  timeCard: {
    width: "48%",
    padding: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.medium,
    alignItems: "center",
    borderWidth: 2,
    borderColor: ChildrenTheme.colors.border,
    backgroundColor: ChildrenTheme.colors.card,
  },
  timeCardActive: {
    borderColor: ChildrenTheme.colors.primary,
    backgroundColor: ChildrenTheme.colors.primary + "20",
  },
  timeIcon: {
    fontSize: 32,
    marginBottom: ChildrenTheme.spacing.xs,
  },
  timeLabel: {
    color: ChildrenTheme.colors.text,
    fontWeight: "600",
    textAlign: "center",
  },
  timeLabelActive: {
    color: ChildrenTheme.colors.primary,
  },
  snackbar: {
    marginBottom: ChildrenTheme.spacing.xl,
  },
});

