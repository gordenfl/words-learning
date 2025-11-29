import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  Chip,
  useTheme,
  Surface,
  IconButton,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pinyinAPI } from "../services/api";
import ChildrenTheme from "../theme/childrenTheme";
import { useThemeContext } from "../context/ThemeContext";

export default function PinyinListScreen({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useThemeContext();
  const dynamicTheme = currentTheme;

  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("initial"); // initial, final, tone

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, selectedType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lessonsResponse, progressResponse] = await Promise.all([
        pinyinAPI.getLessons(selectedType),
        pinyinAPI.getProgress(),
      ]);

      setLessons(lessonsResponse.data.lessons || []);
      
      // Convert progress array to object for easy lookup
      const progressMap = {};
      (progressResponse.data.progress || []).forEach((p) => {
        progressMap[p.lessonId._id || p.lessonId] = p;
      });
      setProgress(progressMap);
    } catch (error) {
      console.error("Error loading pinyin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressStatus = (lessonId) => {
    const p = progress[lessonId];
    if (!p) return "not_started";
    return p.status;
  };

  const getProgressColor = (status) => {
    switch (status) {
      case "completed":
        return ChildrenTheme.colors.success;
      case "learning":
        return ChildrenTheme.colors.warning;
      default:
        return theme.colors.outline;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "initial":
        return "声母 (Initials)";
      case "final":
        return "韵母 (Finals)";
      case "tone":
        return "声调 (Tones)";
      default:
        return type;
    }
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
      typeSelector: {
        flexDirection: "row",
        marginBottom: ChildrenTheme.spacing.md,
        gap: ChildrenTheme.spacing.sm,
      },
      typeChip: {
        marginRight: ChildrenTheme.spacing.xs,
      },
      lessonCard: {
        marginBottom: ChildrenTheme.spacing.md,
        backgroundColor: theme.colors.surface,
      },
      lessonCardContent: {
        padding: ChildrenTheme.spacing.md,
      },
      lessonHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: ChildrenTheme.spacing.sm,
      },
      lessonTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: dynamicTheme.colors.primary,
      },
      lessonName: {
        fontSize: 16,
        color: theme.colors.text,
        marginTop: ChildrenTheme.spacing.xs,
      },
      progressBadge: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: ChildrenTheme.spacing.xs,
      },
      examplesContainer: {
        marginTop: ChildrenTheme.spacing.sm,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: ChildrenTheme.spacing.xs,
      },
      exampleChip: {
        marginRight: ChildrenTheme.spacing.xs,
        marginBottom: ChildrenTheme.spacing.xs,
      },
      emptyText: {
        textAlign: "center",
        color: theme.colors.textSecondary,
        marginTop: ChildrenTheme.spacing.xl,
      },
    });

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={dynamicTheme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Type Selector */}
        <View style={styles.typeSelector}>
          {["initial", "final", "tone"].map((type) => (
            <Chip
              key={type}
              selected={selectedType === type}
              onPress={() => setSelectedType(type)}
              style={[
                styles.typeChip,
                {
                  backgroundColor:
                    selectedType === type
                      ? dynamicTheme.colors.primary
                      : theme.colors.surface,
                },
              ]}
              textStyle={{
                color:
                  selectedType === type
                    ? theme.colors.onPrimary
                    : theme.colors.text,
              }}
            >
              {getTypeLabel(type)}
            </Chip>
          ))}
        </View>

        {/* Lessons List */}
        {lessons.length === 0 ? (
          <Text style={styles.emptyText}>No lessons available</Text>
        ) : (
          lessons.map((lesson) => {
            const status = getProgressStatus(lesson._id);
            return (
              <TouchableOpacity
                key={lesson._id}
                onPress={() =>
                  navigation.navigate("PinyinCard", { lessonId: lesson._id })
                }
                activeOpacity={0.7}
              >
                <Card style={styles.lessonCard} mode="elevated" elevation={2}>
                  <Card.Content style={styles.lessonCardContent}>
                    <View style={styles.lessonHeader}>
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <View
                            style={[
                              styles.progressBadge,
                              { backgroundColor: getProgressColor(status) },
                            ]}
                          />
                          <Text style={styles.lessonTitle}>
                            {lesson.pinyin}
                          </Text>
                        </View>
                        <Text style={styles.lessonName}>
                          {lesson.displayName}
                        </Text>
                      </View>
                      <IconButton
                        icon="chevron-right"
                        size={24}
                        iconColor={theme.colors.primary}
                      />
                    </View>

                    {lesson.examples && lesson.examples.length > 0 && (
                      <View style={styles.examplesContainer}>
                        {lesson.examples.slice(0, 3).map((example, idx) => (
                          <Chip
                            key={idx}
                            style={styles.exampleChip}
                            textStyle={{ fontSize: 12 }}
                          >
                            {example.word} ({example.pinyin})
                          </Chip>
                        ))}
                      </View>
                    )}
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

