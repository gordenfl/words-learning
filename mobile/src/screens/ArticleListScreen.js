import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  IconButton,
  useTheme,
  Surface,
  Chip,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { articlesAPI } from "../services/api";
import ChildrenTheme from "../theme/childrenTheme";
import { useThemeContext } from "../context/ThemeContext";

export default function ArticleListScreen({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useThemeContext();
  const dynamicTheme = currentTheme;
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadArticles();
    // Add listener to refresh when screen comes into focus
    const unsubscribe = navigation.addListener("focus", () => {
      loadArticles();
    });
    return unsubscribe;
  }, [navigation]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const response = await articlesAPI.getArticles();
      setArticles(response.data.articles || []);
    } catch (error) {
      console.log("Error loading articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNewArticle = async () => {
    try {
      setGenerating(true);
      // Navigate to Article screen, it will handle generation
      navigation.navigate("Article");
    } catch (error) {
      console.log("Error generating article:", error);
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not read yet";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const formatCreatedDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  // Create dynamic styles
  const styles = useMemo(() => createStyles(dynamicTheme), [dynamicTheme]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: dynamicTheme.colors.background },
        ]}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={dynamicTheme.colors.primary}
        />
        <View
          style={[
            styles.header,
            {
              paddingTop: (insets.top + 10) / 3,
              backgroundColor: dynamicTheme.colors.primary,
            },
          ]}
        ></View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={dynamicTheme.colors.primary} />
          <Text variant="bodyMedium" style={styles.loaderText}>
            Loading articles...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: dynamicTheme.colors.background },
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={dynamicTheme.colors.primary}
      />
      <View
        style={[
          styles.header,
          {
            paddingTop: (insets.top + 10) / 3,
            backgroundColor: dynamicTheme.colors.primary,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text variant="titleMedium" style={styles.headerTitle}>
            Reading
          </Text>
        </View>
        <IconButton
          icon="book-plus"
          size={24}
          iconColor={dynamicTheme.colors.textInverse}
          onPress={handleGenerateNewArticle}
          disabled={generating}
          style={styles.generateButton}
        />
      </View>

      <ScrollView style={styles.scrollContent}>
        {articles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📚</Text>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Articles Yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Generate your first article to start reading!
            </Text>
            <TouchableOpacity
              style={[
                styles.generateFirstButton,
                { backgroundColor: dynamicTheme.colors.primary },
              ]}
              onPress={handleGenerateNewArticle}
              disabled={generating}
            >
              <Text
                style={[
                  styles.generateFirstButtonText,
                  { color: dynamicTheme.colors.textInverse },
                ]}
              >
                Generate New Article
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            {articles.map((article) => (
              <TouchableOpacity
                key={article._id}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("Article", { article })}
              >
                <Card style={styles.articleCard} mode="elevated" elevation={1}>
                  <Card.Content>
                    <View style={styles.articleHeader}>
                      <Text variant="titleMedium" style={styles.articleTitle}>
                        Reading
                      </Text>
                      {article.completed && (
                        <Chip
                          icon="check-circle"
                          style={[
                            styles.completedChip,
                            {
                              backgroundColor:
                                dynamicTheme.colors.success + "20",
                            },
                          ]}
                          textStyle={[
                            styles.completedChipText,
                            { color: dynamicTheme.colors.success },
                          ]}
                        >
                          Read
                        </Chip>
                      )}
                    </View>

                    <View style={styles.articleMeta}>
                      <View style={styles.metaRow}>
                        <Text variant="bodySmall" style={styles.metaLabel}>
                          📝 Generated:
                        </Text>
                        <Text variant="bodySmall" style={styles.metaValue}>
                          {formatCreatedDate(article.createdAt)}
                        </Text>
                      </View>
                      {article.readAt && (
                        <View style={styles.metaRow}>
                          <Text variant="bodySmall" style={styles.metaLabel}>
                            ✅ Read:
                          </Text>
                          <Text variant="bodySmall" style={styles.metaValue}>
                            {formatDate(article.readAt)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.metaRow}>
                        <Text variant="bodySmall" style={styles.metaLabel}>
                          📖 Words:
                        </Text>
                        <Text variant="bodySmall" style={styles.metaValue}>
                          {article.targetWords?.length || 0} target words
                        </Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Chip
                          icon={
                            article.difficulty === "beginner"
                              ? "star"
                              : article.difficulty === "intermediate"
                              ? "star-outline"
                              : "star-four-points"
                          }
                          style={[
                            styles.difficultyChip,
                            {
                              backgroundColor:
                                article.difficulty === "beginner"
                                  ? dynamicTheme.colors.success + "20"
                                  : article.difficulty === "intermediate"
                                  ? dynamicTheme.colors.warning + "20"
                                  : dynamicTheme.colors.accent + "20",
                            },
                          ]}
                          textStyle={[
                            styles.difficultyChipText,
                            {
                              color:
                                article.difficulty === "beginner"
                                  ? dynamicTheme.colors.success
                                  : article.difficulty === "intermediate"
                                  ? dynamicTheme.colors.warning
                                  : dynamicTheme.colors.accent,
                            },
                          ]}
                        >
                          {article.difficulty === "beginner"
                            ? "Beginner"
                            : article.difficulty === "intermediate"
                            ? "Intermediate"
                            : "Advanced"}
                        </Chip>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Create dynamic styles function
const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: ChildrenTheme.spacing.xs,
      backgroundColor: theme.colors.primary,
      ...ChildrenTheme.shadows.medium,
    },
    headerContent: {
      flex: 1,
      paddingHorizontal: ChildrenTheme.spacing.md,
      paddingVertical: ChildrenTheme.spacing.xs,
    },
    headerTitle: {
      color: theme.colors.textInverse,
      fontWeight: "bold",
    },
    generateButton: {
      marginRight: ChildrenTheme.spacing.xs,
    },
    scrollContent: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: ChildrenTheme.spacing.xl,
    },
    loaderText: {
      color: theme.colors.textLight,
      marginTop: ChildrenTheme.spacing.md,
    },
    content: {
      padding: ChildrenTheme.spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: ChildrenTheme.spacing.xl,
    },
    emptyEmoji: {
      fontSize: 64,
      marginBottom: ChildrenTheme.spacing.md,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontWeight: "bold",
      marginBottom: ChildrenTheme.spacing.sm,
    },
    emptyText: {
      color: theme.colors.textLight,
      textAlign: "center",
      marginBottom: ChildrenTheme.spacing.xl,
    },
    generateFirstButton: {
      paddingVertical: ChildrenTheme.spacing.md,
      paddingHorizontal: ChildrenTheme.spacing.xl,
      borderRadius: ChildrenTheme.borderRadius.medium,
    },
    generateFirstButtonText: {
      fontSize: 16,
      fontWeight: "bold",
    },
    articleCard: {
      marginBottom: ChildrenTheme.spacing.md,
      borderRadius: ChildrenTheme.borderRadius.large,
    },
    articleHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: ChildrenTheme.spacing.sm,
    },
    articleTitle: {
      flex: 1,
      color: theme.colors.text,
      fontWeight: "bold",
      marginRight: ChildrenTheme.spacing.sm,
      fontSize: 18, // titleMedium 使用 bodyLarge (20)，减小 2 个单位
    },
    completedChip: {
      // backgroundColor 和 color 在 JSX 中动态设置，这里只定义其他样式
      height: 32, // 增加高度，确保文字完整显示
      paddingVertical: 0, // 移除垂直内边距
      paddingHorizontal: 4, // 减小左右内边距
      marginLeft: ChildrenTheme.spacing.xs,
      minWidth: 45, // 减小最小宽度
    },
    completedChipText: {
      // color 在 JSX 中动态设置，这里只定义其他样式
      fontSize: 12, // 稍微增大字体
      paddingHorizontal: 0,
      marginHorizontal: 0,
      lineHeight: 16, // 设置行高，确保文字垂直居中
      includeFontPadding: false, // Android 上移除字体额外内边距
    },
    articleMeta: {
      marginTop: ChildrenTheme.spacing.xs,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: ChildrenTheme.spacing.xs,
    },
    metaLabel: {
      color: theme.colors.textLight,
      marginRight: ChildrenTheme.spacing.xs,
    },
    metaValue: {
      color: theme.colors.text,
      fontWeight: "500",
    },
    difficultyChip: {
      height: 32,
      marginTop: ChildrenTheme.spacing.xs,
      paddingHorizontal: ChildrenTheme.spacing.sm,
    },
    difficultyChipText: {
      fontSize: 13,
      fontWeight: "600",
    },
  });
