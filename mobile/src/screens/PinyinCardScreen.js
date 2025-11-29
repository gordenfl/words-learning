import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import {
  Text,
  Card,
  Button,
  IconButton,
  useTheme,
  Chip,
  Surface,
} from "react-native-paper";
import * as Speech from "expo-speech";
import { pinyinAPI } from "../services/api";
import ChildrenTheme from "../theme/childrenTheme";
import { useThemeContext } from "../context/ThemeContext";
import { useScrollDragHandler } from "../utils/touchHandler";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PinyinCardScreen({ route, navigation }) {
  const theme = useTheme();
  const { currentTheme } = useThemeContext();
  const dynamicTheme = currentTheme;
  const { lessonId } = route.params;
  const { scrollHandlers, createPressHandler } = useScrollDragHandler();

  const [lesson, setLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, lessonId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lessonResponse, progressResponse] = await Promise.all([
        pinyinAPI.getLesson(lessonId),
        pinyinAPI.getProgressForLesson(lessonId),
      ]);

      setLesson(lessonResponse.data.lesson);
      setProgress(progressResponse.data.progress);
    } catch (error) {
      console.error("Error loading pinyin lesson:", error);
      Alert.alert("Error", "Failed to load lesson");
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (!lesson) return;
    
    setPlaying(true);
    Speech.speak(lesson.pinyin, {
      language: "zh-CN",
      pitch: 1.0,
      rate: 0.8,
      onDone: () => setPlaying(false),
      onStopped: () => setPlaying(false),
      onError: () => {
        setPlaying(false);
        Alert.alert("Error", "Failed to play audio");
      },
    });
  };

  const createStyles = (theme) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      content: {
        padding: ChildrenTheme.spacing.md,
      },
      mainCard: {
        marginBottom: ChildrenTheme.spacing.lg,
        backgroundColor: theme.colors.surface,
        elevation: 4,
      },
      mainCardContent: {
        padding: ChildrenTheme.spacing.xl,
        alignItems: "center",
      },
      pinyinDisplay: {
        fontSize: 64,
        fontWeight: "bold",
        color: dynamicTheme.colors.primary,
        marginBottom: ChildrenTheme.spacing.md,
      },
      displayName: {
        fontSize: 20,
        color: theme.colors.text,
        marginBottom: ChildrenTheme.spacing.lg,
      },
      playButton: {
        marginBottom: ChildrenTheme.spacing.lg,
      },
      mouthAnimationPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: dynamicTheme.colors.primary + "20",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: ChildrenTheme.spacing.md,
      },
      sectionCard: {
        marginBottom: ChildrenTheme.spacing.md,
        backgroundColor: theme.colors.surface,
      },
      sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: theme.colors.text,
        marginBottom: ChildrenTheme.spacing.sm,
      },
      examplesContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: ChildrenTheme.spacing.xs,
      },
      exampleChip: {
        marginRight: ChildrenTheme.spacing.xs,
        marginBottom: ChildrenTheme.spacing.xs,
      },
      mistakeItem: {
        marginBottom: ChildrenTheme.spacing.sm,
        padding: ChildrenTheme.spacing.sm,
        backgroundColor: theme.colors.errorContainer,
        borderRadius: 8,
      },
      practiceButton: {
        marginBottom: ChildrenTheme.spacing.md,
        padding: ChildrenTheme.spacing.md,
      },
      practiceButtonContent: {
        paddingVertical: ChildrenTheme.spacing.sm,
      },
      progressIndicator: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: ChildrenTheme.spacing.md,
      },
      progressText: {
        marginLeft: ChildrenTheme.spacing.xs,
        fontSize: 14,
        color: theme.colors.textSecondary,
      },
    });

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={dynamicTheme.colors.primary} />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text>Lesson not found</Text>
      </View>
    );
  }

  const getPracticeStatus = (practiceType) => {
    if (!progress || !progress.practices) return { completed: false, score: 0 };
    return progress.practices[practiceType] || { completed: false, score: 0 };
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        {...scrollHandlers}
      >
        {/* Main Pinyin Display */}
        <Card style={styles.mainCard} mode="elevated" elevation={4}>
          <Card.Content style={styles.mainCardContent}>
            {/* Mouth Animation Placeholder */}
            <View style={styles.mouthAnimationPlaceholder}>
              <Text style={{ fontSize: 48 }}>👄</Text>
            </View>

            <Text style={styles.pinyinDisplay}>{lesson.pinyin}</Text>
            <Text style={styles.displayName}>{lesson.displayName}</Text>

            <IconButton
              icon={playing ? "pause-circle" : "play-circle"}
              size={64}
              iconColor={dynamicTheme.colors.primary}
              onPress={createPressHandler(playAudio)}
              disabled={playing}
            />
          </Card.Content>
        </Card>

        {/* Examples Section */}
        {lesson.examples && lesson.examples.length > 0 && (
          <Card style={styles.sectionCard} mode="elevated" elevation={1}>
            <Card.Content>
              <Text style={styles.sectionTitle}>📚 单字示例</Text>
              <View style={styles.examplesContainer}>
                {lesson.examples.map((example, idx) => (
                  <Chip
                    key={idx}
                    style={styles.exampleChip}
                    onPress={createPressHandler(() => {
                      // Navigate to word detail if word exists
                      navigation.navigate("WordDetail", {
                        wordId: example.wordId,
                      });
                    })}
                  >
                    {example.word} ({example.pinyin})
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Common Mistakes */}
        {lesson.commonMistakes && lesson.commonMistakes.length > 0 && (
          <Card style={styles.sectionCard} mode="elevated" elevation={1}>
            <Card.Content>
              <Text style={styles.sectionTitle}>⚠️ 常见错误</Text>
              {lesson.commonMistakes.map((mistake, idx) => (
                <View key={idx} style={styles.mistakeItem}>
                  <Text style={{ fontWeight: "bold" }}>
                    {mistake.mistake}
                  </Text>
                  <Text style={{ fontSize: 12, marginTop: 4 }}>
                    {mistake.explanation}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Practice Buttons */}
        <Card style={styles.sectionCard} mode="elevated" elevation={1}>
          <Card.Content>
            <Text style={styles.sectionTitle}>🎯 练习</Text>

            {/* Tone Slider Practice */}
            {lesson.type === "tone" && (
              <View>
                <View style={styles.progressIndicator}>
                  <IconButton
                    icon={
                      getPracticeStatus("toneSlider").completed
                        ? "check-circle"
                        : "circle-outline"
                    }
                    size={20}
                    iconColor={
                      getPracticeStatus("toneSlider").completed
                        ? ChildrenTheme.colors.success
                        : theme.colors.outline
                    }
                  />
                  <Text style={styles.progressText}>
                    声调滑竿练习
                    {getPracticeStatus("toneSlider").score > 0 &&
                      ` (${getPracticeStatus("toneSlider").score}%)`}
                  </Text>
                </View>
                <Button
                  mode="contained"
                  onPress={createPressHandler(() =>
                    navigation.navigate("ToneSliderPractice", { lesson })
                  )}
                  style={styles.practiceButton}
                  contentStyle={styles.practiceButtonContent}
                >
                  开始练习
                </Button>
              </View>
            )}

            {/* Pronunciation Practice */}
            <View style={{ marginTop: lesson.type === "tone" ? 16 : 0 }}>
              <View style={styles.progressIndicator}>
                <IconButton
                  icon={
                    getPracticeStatus("pronunciation").completed
                      ? "check-circle"
                      : "circle-outline"
                  }
                  size={20}
                  iconColor={
                    getPracticeStatus("pronunciation").completed
                      ? ChildrenTheme.colors.success
                      : theme.colors.outline
                  }
                />
                <Text style={styles.progressText}>
                  跟读打分练习
                  {getPracticeStatus("pronunciation").score > 0 &&
                    ` (${getPracticeStatus("pronunciation").score}%)`}
                </Text>
              </View>
              <Button
                mode="contained"
                onPress={createPressHandler(() =>
                  navigation.navigate("PronunciationPractice", { lesson })
                )}
                style={styles.practiceButton}
                contentStyle={styles.practiceButtonContent}
              >
                开始练习
              </Button>
            </View>

            {/* Spelling Practice */}
            <View style={{ marginTop: 16 }}>
              <View style={styles.progressIndicator}>
                <IconButton
                  icon={
                    getPracticeStatus("spelling").completed
                      ? "check-circle"
                      : "circle-outline"
                  }
                  size={20}
                  iconColor={
                    getPracticeStatus("spelling").completed
                      ? ChildrenTheme.colors.success
                      : theme.colors.outline
                  }
                />
                <Text style={styles.progressText}>
                  拼音拼写游戏
                  {getPracticeStatus("spelling").score > 0 &&
                    ` (${getPracticeStatus("spelling").score}%)`}
                </Text>
              </View>
              <Button
                mode="contained"
                onPress={createPressHandler(() =>
                  navigation.navigate("PinyinSpellingGame", { lesson })
                )}
                style={styles.practiceButton}
                contentStyle={styles.practiceButtonContent}
              >
                开始练习
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Link to Words */}
        <Card style={styles.sectionCard} mode="elevated" elevation={1}>
          <Card.Content>
            <Text style={styles.sectionTitle}>🔗 相关汉字</Text>
            <Button
              mode="outlined"
              onPress={createPressHandler(async () => {
                try {
                  const response = await pinyinAPI.getWordsByPinyin(
                    lesson.pinyin
                  );
                  const words = response.data.words || [];
                  if (words.length === 0) {
                    Alert.alert("提示", "没有找到相关汉字");
                  } else {
                    // Navigate to words list filtered by pinyin
                    navigation.navigate("WordsList", {
                      filter: "all",
                      pinyinFilter: lesson.pinyin,
                    });
                  }
                } catch (error) {
                  Alert.alert("错误", "无法加载相关汉字");
                }
              })}
            >
              查看包含此拼音的汉字
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

