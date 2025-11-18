import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import {
  Text,
  Card,
  Surface,
  useTheme,
  Snackbar,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import { articlesAPI, wordsAPI } from "../services/api";
import ChildrenTheme from "../theme/childrenTheme";
import { useScrollDragHandler } from "../utils/touchHandler";

export default function ArticleScreen({ route, navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [article, setArticle] = useState(route.params?.article);
  const [loading, setLoading] = useState(!route.params?.article);
  const [error, setError] = useState(null);
  const [completedWords, setCompletedWords] = useState(new Set());
  const [isReading, setIsReading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const { scrollHandlers, createPressHandler } = useScrollDragHandler();
  const [toastMessage, setToastMessage] = useState("");

  // Auto-generate article if not provided
  useEffect(() => {
    if (!route.params?.article) {
      generateArticle();
    }
  }, []);

  const generateArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await articlesAPI.generateArticle(10);

      // Check if more words are needed
      if (response.data.needMoreWords) {
        setLoading(false);
        setError({
          type: "needMoreWords",
          message: response.data.message || "Great job! 🎉",
          suggestion: response.data.suggestion || "Scan books or photos to add more Chinese words.",
        });
      } else {
        setArticle(response.data.article);
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to generate article";
      setError({
        type: "error",
        message: "Oops!",
        suggestion: errorMsg,
      });
    }
  };

  const speakWord = (word) => {
    Speech.speak(word, {
      language: "zh-CN",
      pitch: 1.0,
      rate: 0.1,
    });
  };

  const speakArticle = () => {
    if (isReading) {
      // 如果正在朗读，停止朗读
      Speech.stop();
      setIsReading(false);
    } else {
      // 开始朗读文章
      setIsReading(true);

      // 提取文章中的中文内容（去掉英文标题和鼓励语）
      const lines = article.content.split("\n");
      const chineseLines = lines.filter((line) => {
        // 过滤掉英文行（标题和鼓励语）
        return line.trim() && /[\u4e00-\u9fa5]/.test(line);
      });
      const chineseContent = chineseLines.join(" "); // 用空格连接段落

      Speech.speak(chineseContent, {
        language: "zh-CN",
        pitch: 1.0,
        rate: 0.3, // 比单词稍快一点
        onDone: () => setIsReading(false),
        onStopped: () => setIsReading(false),
        onError: () => setIsReading(false),
      });
    }
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const markWordAsKnown = async (wordId, wordText) => {
    try {
      await wordsAPI.updateWordStatus(wordId, "known");
      setCompletedWords((prev) => new Set([...prev, wordId]));
      showToastMessage(`✓ Learned "${wordText}"`);
    } catch (error) {
      showToastMessage("❌ Update failed");
    }
  };

  const markArticleAsRead = async () => {
    try {
      await articlesAPI.markAsRead(article._id);
      // Navigate back to ArticleList to see updated list
      navigation.navigate("ArticleList");
    } catch (error) {
      console.log("Failed to mark article as read:", error);
      // Even if failed, navigate back to list
      navigation.navigate("ArticleList");
    }
  };

  // 高亮显示目标单词的函数
  const highlightTargetWords = (content, targetWords) => {
    // 提取所有目标单词（按长度从长到短排序，优先匹配长词）
    const wordTexts = targetWords
      .map((tw) => tw.word?.word || tw.wordText)
      .filter(Boolean);

    if (wordTexts.length === 0) {
      return <Text style={styles.articleText}>{content}</Text>;
    }

    // 按长度从长到短排序，优先匹配长词（避免短词覆盖长词的一部分）
    const sortedWords = [...wordTexts].sort((a, b) => b.length - a.length);

    // 使用正则表达式匹配所有目标单词
    const parts = [];
    let lastIndex = 0;

    // 创建正则表达式，匹配所有目标单词（使用|分隔）
    const escapedWords = sortedWords.map((word) =>
      word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    const regex = new RegExp(`(${escapedWords.join("|")})`, "g");

    // 找到所有匹配的位置
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        word: match[0],
      });
    }

    // 按位置排序
    matches.sort((a, b) => a.index - b.index);

    // 处理重叠的匹配（取第一个匹配，跳过重叠的部分）
    const nonOverlappingMatches = [];
    let lastMatchEnd = 0;

    for (const match of matches) {
      if (match.index >= lastMatchEnd) {
        nonOverlappingMatches.push(match);
        lastMatchEnd = match.index + match.length;
      }
    }

    // 构建文本片段
    for (const match of nonOverlappingMatches) {
      // 添加匹配前的普通文本
      if (match.index > lastIndex) {
        parts.push({
          text: content.substring(lastIndex, match.index),
          isTarget: false,
        });
      }

      // 添加高亮的目标单词
      parts.push({
        text: match.word,
        isTarget: true,
      });

      lastIndex = match.index + match.length;
    }

    // 添加剩余的文本
    if (lastIndex < content.length) {
      parts.push({
        text: content.substring(lastIndex),
        isTarget: false,
      });
    }

    // 如果没有匹配到任何单词，返回原始文本
    if (parts.length === 0) {
      return <Text style={styles.articleText}>{content}</Text>;
    }

    return (
      <Text style={styles.articleText}>
        {parts.map((part, index) =>
          part.isTarget ? (
            <Text key={index} style={styles.highlightedWord}>
              {part.text}
            </Text>
          ) : (
            <Text key={index}>{part.text}</Text>
          )
        )}
      </Text>
    );
  };

  // 检查是否是鼓励语
  const isEncouragement = (text) => {
    if (!text || text.length < 5) return false;
    const lower = text.toLowerCase();
    const encouragementKeywords = [
      "great job",
      "keep exploring",
      "keep practicing",
      "great work",
      "well done",
      "excellent",
      "congratulations",
      "keep up",
      "keep learning",
      "chinese stories",
      "keep reading",
      "good job",
      "nice work",
    ];
    return encouragementKeywords.some((keyword) => lower.includes(keyword));
  };

  // 解析内容，分离中文段落和英文翻译
  const parseContent = (content) => {
    const lines = content.split("\n");
    const paragraphs = [];
    let currentChinese = [];
    let currentEnglish = null;
    let foundFirstChinese = false; // 是否已找到第一个中文行
    let skipTitle = true; // 跳过第一行（标题）

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 跳过空行
      if (!line) {
        // 空行后如果之前有中文段落和英文，保存它
        if (currentChinese.length > 0 && currentEnglish) {
          paragraphs.push({
            chinese: currentChinese.join("\n"),
            english: currentEnglish,
          });
          currentChinese = [];
          currentEnglish = null;
        }
        continue;
      }

      // 跳过鼓励语
      if (isEncouragement(line)) {
        continue;
      }

      // 跳过第一行英文标题
      if (skipTitle && !/[\u4e00-\u9fa5]/.test(line)) {
        skipTitle = false;
        continue;
      }

      // 检查是否是英文翻译标记
      const englishMatch = line.match(/^English:\s*(.+)$/i);
      if (englishMatch) {
        let englishText = englishMatch[1].trim();
        // 检查是否是鼓励语
        if (isEncouragement(englishText)) {
          continue;
        }
        // 如果当前有中文段落，保存这对中英文
        if (currentChinese.length > 0) {
          paragraphs.push({
            chinese: currentChinese.join("\n"),
            english: englishText,
          });
          currentChinese = [];
          currentEnglish = null;
        } else {
          // 如果没有中文段落，先保存英文，等待下一个中文段落
          currentEnglish = englishText;
        }
      } else if (/[\u4e00-\u9fa5]/.test(line)) {
        // 中文内容
        foundFirstChinese = true;
        skipTitle = false;
        // 如果之前有中文段落和英文，先保存
        if (currentChinese.length > 0 && currentEnglish) {
          paragraphs.push({
            chinese: currentChinese.join("\n"),
            english: currentEnglish,
          });
          currentChinese = [];
          currentEnglish = null;
        }
        currentChinese.push(line);
      } else if (
        foundFirstChinese &&
        !/[\u4e00-\u9fa5]/.test(line) &&
        !isEncouragement(line) &&
        currentChinese.length > 0 &&
        !englishMatch
      ) {
        // 在找到中文后，如果这一行是英文且不是鼓励语，将其作为英文翻译
        // 检查是否是英文句子（包含英文字母，长度足够，且主要是英文）
        const hasEnglishChars = /[a-zA-Z]/.test(line);
        const englishCharRatio =
          (line.match(/[a-zA-Z]/g) || []).length / line.length;
        const isLongEnough = line.length > 8;
        const isMostlyEnglish = englishCharRatio > 0.5; // 至少50%是英文字母

        if (hasEnglishChars && isLongEnough && isMostlyEnglish) {
          // 如果已经有英文，合并（可能是多行）
          if (currentEnglish) {
            currentEnglish = currentEnglish + " " + line;
          } else {
            currentEnglish = line;
          }
        }
      }
    }

    // 处理最后的中文段落
    if (currentChinese.length > 0) {
      // 如果最后的英文是鼓励语，不保存
      if (currentEnglish && !isEncouragement(currentEnglish)) {
        paragraphs.push({
          chinese: currentChinese.join("\n"),
          english: currentEnglish,
        });
      } else {
        paragraphs.push({
          chinese: currentChinese.join("\n"),
          english: "",
        });
      }
    }

    // 如果没有解析出段落，返回原始内容（只显示中文）
    if (paragraphs.length === 0) {
      // 过滤掉英文内容，只保留中文
      const chineseOnly = lines
        .filter(
          (line) => /[\u4e00-\u9fa5]/.test(line) && !isEncouragement(line)
        )
        .join("\n");
      return [
        {
          chinese: chineseOnly || content,
          english: "",
        },
      ];
    }

    return paragraphs;
  };

  const renderContent = () => {
    let content = article.content;
    const targetWords = article.targetWords || [];

    // 调试：打印原始内容
    if (__DEV__) {
      console.log("📝 Original article content (full):");
      console.log("=".repeat(50));
      console.log(content);
      console.log("=".repeat(50));
      console.log("📝 Content lines breakdown:");
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        const hasChinese = /[\u4e00-\u9fa5]/.test(line);
        const hasEnglish = /[a-zA-Z]/.test(line);
        const isEnglishMark = /^English:/i.test(line);
        console.log(
          `  Line ${idx + 1}: [${hasChinese ? "中文" : ""}${
            hasEnglish ? "英文" : ""
          }${isEnglishMark ? " [English标记]" : ""}] ${line.substring(0, 60)}`
        );
      });
      console.log("---");
    }

    // 解析内容，分离中文和英文
    const paragraphs = parseContent(content);

    // 调试：打印解析结果
    if (__DEV__) {
      console.log("📄 Parsed paragraphs:", paragraphs.length);
      paragraphs.forEach((para, idx) => {
        console.log(`Paragraph ${idx + 1}:`);
        console.log("  Chinese:", para.chinese.substring(0, 50) + "...");
        console.log("  English:", para.english || "(no translation)");
      });
    }

    // 提取所有目标单词的文本
    const targetWordTexts = targetWords
      .map((tw) => tw.word?.word || tw.wordText)
      .filter(Boolean);

    // 显示所有目标单词（不再过滤，因为文章生成时已经包含了这些单词）
    const wordsInContent = targetWords.filter((tw) => {
      const wordText = tw.word?.word || tw.wordText;
      return wordText; // 只要有单词文本就显示
    });

    return (
      <View>
        {paragraphs.map((para, paraIndex) => {
          // 将中文段落按句子分割（中文句子通常以。！？结尾）
          const chineseSentences = para.chinese
            .split(/[。！？]/)
            .filter((s) => s.trim().length > 0);
          // 将英文段落按句子分割（英文句子通常以. ! ?结尾）
          const englishSentences = para.english
            ? para.english.split(/[.!?]/).filter((s) => s.trim().length > 0)
            : [];

          // 如果无法按句子分割，则按段落显示
          if (
            chineseSentences.length === 0 ||
            (para.english && englishSentences.length === 0)
          ) {
            return (
              <View key={paraIndex} style={styles.paragraphContainer}>
                {highlightTargetWords(para.chinese, targetWords)}
                {para.english && (
                  <Text style={styles.englishTranslation}>{para.english}</Text>
                )}
              </View>
            );
          }

          // 按句子配对显示
          return (
            <View key={paraIndex} style={styles.paragraphContainer}>
              {chineseSentences.map((chineseSentence, sentIndex) => {
                const englishSentence = englishSentences[sentIndex] || "";
                // 获取原段落中对应句子的标点符号
                const originalChinese = para.chinese;
                const sentenceStart = para.chinese.indexOf(
                  chineseSentence.trim()
                );
                const sentenceEnd =
                  sentenceStart + chineseSentence.trim().length;
                const punctuation = originalChinese[sentenceEnd] || "。";

                return (
                  <View key={sentIndex} style={styles.sentencePair}>
                    {highlightTargetWords(
                      chineseSentence.trim() + punctuation,
                      targetWords
                    )}
                    {englishSentence && (
                      <Text style={styles.englishTranslation}>
                        {englishSentence.trim() +
                          (englishSentence.trim().match(/[.!?]$/) ? "" : ".")}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        {wordsInContent.length > 0 && (
          <View style={styles.wordsSection}>
            <Text style={styles.sectionTitle}>Target Words:</Text>
            {wordsInContent.map((tw, index) => {
            const wordId = tw.word?._id || tw.word;
            const wordText = tw.word?.word || tw.wordText;
            const wordPinyin = tw.word?.pinyin || "";
            const isCompleted = completedWords.has(wordId);

            return (
              <View key={index} style={styles.wordCard}>
                <View style={styles.wordCardContent}>
                  <View style={styles.wordInfoArea}>
                    {wordPinyin && (
                      <View style={styles.pinyinWithSpeaker}>
                        <Text style={styles.pinyin}>{wordPinyin}</Text>
                        <TouchableOpacity
                          onPress={createPressHandler(() => speakWord(wordText))}
                          activeOpacity={0.6}
                          style={styles.speakerButton}
                        >
                          <Text style={styles.speakerIcon}>🔊</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <Text style={styles.wordText}>{wordText}</Text>
                  </View>

                  <View style={styles.wordActions}>
                    {!isCompleted ? (
                      <TouchableOpacity
                        style={styles.markKnownBtn}
                        onPress={createPressHandler(() => markWordAsKnown(wordId, wordText))}
                      >
                        <Text style={styles.markKnownText}>✓</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>✓</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
            })}
          </View>
        )}
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: ChildrenTheme.colors.background },
        ]}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={ChildrenTheme.colors.primary}
        />
        <View
          style={[
            styles.header,
            {
              paddingTop: (insets.top + 10) / 2,
              backgroundColor: ChildrenTheme.colors.primary,
            },
          ]}
        ></View>
        <View style={styles.loadingContainer}>
          <Card style={styles.loadingCard} mode="elevated" elevation={2}>
            <Card.Content style={styles.loadingContent}>
              <Text style={styles.loadingEmoji}>📚</Text>
              <ActivityIndicator
                size="large"
                color={ChildrenTheme.colors.primary}
                style={styles.loader}
              />
              <Text variant="titleLarge" style={styles.loadingTitle}>
                Generating Article...
              </Text>
              <Text variant="bodyMedium" style={styles.loadingSubtitle}>
                AI is creating a personalized Chinese reading article for you
              </Text>
            </Card.Content>
          </Card>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: ChildrenTheme.colors.background },
        ]}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={ChildrenTheme.colors.primary}
        />
        <View
          style={[
            styles.header,
            {
              paddingTop: (insets.top + 10) / 2,
              backgroundColor: ChildrenTheme.colors.primary,
            },
          ]}
        ></View>
        <View style={styles.loadingContainer}>
          <Card style={styles.loadingCard} mode="elevated" elevation={2}>
            <Card.Content style={styles.loadingContent}>
              <Text style={styles.loadingEmoji}>
                {error.type === "needMoreWords" ? "🎉" : "😔"}
              </Text>
              <Text variant="titleLarge" style={styles.loadingTitle}>
                {error.message}
              </Text>
              <Text variant="bodyMedium" style={styles.loadingSubtitle}>
                {error.suggestion}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  if (error.type === "needMoreWords") {
                    navigation.navigate("Home");
                  } else {
                    generateArticle();
                  }
                }}
              >
                <Text style={styles.retryButtonText}>
                  {error.type === "needMoreWords" ? "Go Home" : "Try Again"}
                </Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      </View>
    );
  }

  // No article state
  if (!article) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: ChildrenTheme.colors.background },
        ]}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={ChildrenTheme.colors.primary}
        />
        <View
          style={[
            styles.header,
            {
              paddingTop: (insets.top + 10) / 2,
              backgroundColor: ChildrenTheme.colors.primary,
            },
          ]}
        ></View>
        <View style={styles.loadingContainer}>
          <Text variant="bodyLarge" style={styles.errorText}>
            No article available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: ChildrenTheme.colors.background },
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={ChildrenTheme.colors.primary}
      />
      <View
        style={[
          styles.header,
          {
            paddingTop: (insets.top + 10) / 2,
            backgroundColor: ChildrenTheme.colors.primary,
          },
        ]}
      ></View>
      <ScrollView 
        style={styles.scrollContent}
        {...scrollHandlers}
      >
        {/* Toast 提示 */}
        <Snackbar
          visible={showToast}
          onDismiss={() => setShowToast(false)}
          duration={2000}
          style={styles.snackbar}
        >
          {toastMessage}
        </Snackbar>

      <View style={styles.content}>
        {/* 标题和朗读按钮 */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{article.title}</Text>
          <TouchableOpacity
            onPress={speakArticle}
            style={styles.readAloudBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.readAloudIcon}>{isReading ? "⏸" : "🔊"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaText}>Difficulty: {article.difficulty}</Text>
          <Text style={styles.metaText}>
            Words: {article.targetWords?.length || 0}
          </Text>
        </View>

        {renderContent()}

        <TouchableOpacity
          style={styles.completeButton}
          onPress={markArticleAsRead}
        >
          <Text style={styles.completeButtonText}>Complete Article</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildrenTheme.colors.background,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: ChildrenTheme.spacing.xl,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  loadingContent: {
    alignItems: "center",
    padding: ChildrenTheme.spacing.xl,
  },
  loadingEmoji: {
    fontSize: 64,
    marginBottom: ChildrenTheme.spacing.md,
  },
  loader: {
    marginVertical: ChildrenTheme.spacing.md,
  },
  loadingTitle: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    marginBottom: ChildrenTheme.spacing.sm,
    textAlign: "center",
  },
  loadingSubtitle: {
    color: ChildrenTheme.colors.textLight,
    textAlign: "center",
    marginBottom: ChildrenTheme.spacing.lg,
  },
  retryButton: {
    backgroundColor: ChildrenTheme.colors.primary,
    paddingVertical: ChildrenTheme.spacing.md,
    paddingHorizontal: ChildrenTheme.spacing.xl,
    borderRadius: ChildrenTheme.borderRadius.medium,
    marginTop: ChildrenTheme.spacing.md,
  },
  retryButtonText: {
    color: ChildrenTheme.colors.textInverse,
    fontSize: 16,
    fontWeight: "bold",
  },
  content: {
    padding: ChildrenTheme.spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  readAloudBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  readAloudIcon: {
    fontSize: 24,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  metaText: {
    fontSize: 14,
    color: "#666",
  },
  paragraphContainer: {
    marginBottom: 20,
  },
  sentencePair: {
    marginBottom: 15,
  },
  articleText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 8,
  },
  englishTranslation: {
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
    marginBottom: 0,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#4A90E2",
  },
  highlightedWord: {
    color: "#FF0000",
    fontWeight: "bold",
    fontSize: 18,
  },
  wordsSection: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  wordCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wordCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordInfoArea: {
    flex: 1,
    marginRight: 15,
  },
  pinyinWithSpeaker: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  pinyin: {
    fontSize: 20,
    color: "#4A90E2",
    fontStyle: "italic",
  },
  speakerButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  speakerIcon: {
    fontSize: 20,
  },
  wordText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  wordActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  markKnownBtn: {
    backgroundColor: "#50C878",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  markKnownText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  completedBadge: {
    backgroundColor: "#E0F8E0",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  completedText: {
    color: "#50C878",
    fontSize: 20,
    fontWeight: "600",
  },
  completeButton: {
    backgroundColor: "#50C878",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#666",
  },
  snackbar: {
    marginBottom: ChildrenTheme.spacing.xl,
  },
  errorText: {
    textAlign: "center",
    color: ChildrenTheme.colors.textLight,
  },
});
