import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import {
  Text,
  Card,
  Button,
  Chip,
  IconButton,
  useTheme,
  Surface,
} from "react-native-paper";
import * as Speech from "expo-speech";
import { wordsAPI } from "../services/api";
import ChildrenTheme from "../theme/childrenTheme";
import { useScrollDragHandler } from "../utils/touchHandler";

export default function WordsListScreen({ navigation, route }) {
  const theme = useTheme();
  const initialFilter = route.params?.filter || "all";
  const [words, setWords] = useState([]);
  const [allWords, setAllWords] = useState([]); // 保存所有单词（用于传递给 WordDetailScreen）
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState(initialFilter);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [removingWordIds, setRemovingWordIds] = useState(new Set());
  const PAGE_SIZE = 50;

  // 为每个单词存储动画值
  const fadeAnims = useRef({});
  const { scrollHandlers, createPressHandler } = useScrollDragHandler();

  useEffect(() => {
    // 监听路由参数变化
    if (route.params?.filter && route.params.filter !== filter) {
      setFilter(route.params.filter);
    }
  }, [route.params?.filter]);

  useEffect(() => {
    // 重置分页并重新加载
    setWords([]);
    setPage(1);
    setHasMore(true);
    loadWords(1, true);
  }, [filter]);

  useEffect(() => {
    // 监听从详情页返回的更新
    const unsubscribe = navigation.addListener("focus", () => {
      // 检查是否有单词更新（通过 route params 传递）
      if (route.params?.wordUpdated) {
        const { wordId, newStatus, deleted, oldStatus } = route.params.wordUpdated;

        if (deleted) {
          // 标记为正在移除
          setRemovingWordIds((prev) => new Set([...prev, wordId]));

          // 初始化动画值（如果不存在）
          if (!fadeAnims.current[wordId]) {
            fadeAnims.current[wordId] = new Animated.Value(1);
          }

          // 淡出动画
          Animated.timing(fadeAnims.current[wordId], {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setWords((prevWords) =>
              prevWords.filter((word) => word._id !== wordId)
            );
            setAllWords((prevAllWords) =>
              prevAllWords.filter((word) => word._id !== wordId)
            );
            setRemovingWordIds((prev) => {
              const newSet = new Set(prev);
              newSet.delete(wordId);
              return newSet;
            });
            delete fadeAnims.current[wordId];
          });
        } else if (newStatus) {
          // 检查状态是否真的改变了
          const statusChanged = oldStatus && oldStatus !== newStatus;
          
          // 检查新状态是否符合当前过滤条件
          const shouldRemove =
            (filter === "unknown" && newStatus !== "unknown") ||
            (filter === "known" && newStatus !== "known");

          if (shouldRemove) {
            // 标记为正在移除
            setRemovingWordIds((prev) => new Set([...prev, wordId]));

            // 初始化动画值（如果不存在）
            if (!fadeAnims.current[wordId]) {
              fadeAnims.current[wordId] = new Animated.Value(1);
            }

            // 淡出动画
            Animated.timing(fadeAnims.current[wordId], {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              setWords((prevWords) =>
                prevWords.filter((word) => word._id !== wordId)
              );
              setRemovingWordIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(wordId);
                return newSet;
              });
              delete fadeAnims.current[wordId];
            });
          } else if (statusChanged) {
            // 如果状态改变了，重新加载列表以调整位置
            console.log(`🔄 Word status changed from ${oldStatus} to ${newStatus}, reloading list...`);
            loadWords(1, true);
          } else {
            // 如果状态没改变，只更新状态
            setWords((prevWords) =>
              prevWords.map((word) =>
                word._id === wordId ? { ...word, status: newStatus } : word
              )
            );
            setAllWords((prevAllWords) =>
              prevAllWords.map((word) =>
                word._id === wordId ? { ...word, status: newStatus } : word
              )
            );
          }
        }

        // 清除参数
        navigation.setParams({ wordUpdated: undefined });
      } else {
        // 即使没有明确的更新参数，也检查是否有状态变化
        // 这可以处理从 WordDetailScreen 返回但没有通过 params 传递更新的情况
        // 通过重新加载第一页来确保列表是最新的
        // 注意：这可能会在每次 focus 时都重新加载，但可以确保数据是最新的
        // 为了性能，我们可以添加一个标志来避免不必要的重新加载
      }
    });

    return unsubscribe;
  }, [navigation, route.params?.wordUpdated, filter]);

  const loadWords = async (pageNum = page, isRefresh = false) => {
    if (!hasMore && !isRefresh) return;

    try {
      if (isRefresh) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const status = filter === "all" ? undefined : filter;
      const response = await wordsAPI.getWords(status);
      const fetchedWords = response.data.words;

      // 按创建时间倒序排列（最新的在前）
      const sortedWords = fetchedWords.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // 保存所有单词（用于传递给 WordDetailScreen）
      setAllWords(sortedWords);

      // 分页：获取指定页的数据
      const start = (pageNum - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const pageWords = sortedWords.slice(start, end);

      if (isRefresh) {
        setWords(pageWords);
      } else {
        setWords((prev) => [...prev, ...pageWords]);
      }

      setHasMore(end < sortedWords.length);
      setPage(pageNum);
    } catch (error) {
      console.log("Error loading words:", error);
      if (isRefresh) {
        Alert.alert("Oops!", "Could not load your words. Please try again.");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreWords = () => {
    if (!loadingMore && hasMore) {
      loadWords(page + 1, false);
    }
  };

  const speakWord = (word) => {
    Speech.speak(word, {
      language: "zh-CN", // 中文（普通话）
      pitch: 1.0,
      rate: 0.1, // 极慢速播放，便于初学者
    });
  };

  const updateWordStatus = async (wordId, newStatus) => {
    try {
      await wordsAPI.updateWordStatus(wordId, newStatus);

      // 检查新状态是否符合当前过滤条件
      const shouldRemove =
        (filter === "unknown" && newStatus !== "unknown") ||
        (filter === "known" && newStatus !== "known");

      if (shouldRemove) {
        // 标记为正在移除
        setRemovingWordIds((prev) => new Set([...prev, wordId]));

        // 初始化动画值（如果不存在）
        if (!fadeAnims.current[wordId]) {
          fadeAnims.current[wordId] = new Animated.Value(1);
        }

        // 淡出动画
        Animated.timing(fadeAnims.current[wordId], {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // 动画结束后从列表中移除
          setWords((prevWords) =>
            prevWords.filter((word) => word._id !== wordId)
          );
          setRemovingWordIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(wordId);
            return newSet;
          });
          delete fadeAnims.current[wordId];
        });
        } else {
          // 如果符合过滤条件，更新状态
          setWords((prevWords) =>
            prevWords.map((word) =>
              word._id === wordId ? { ...word, status: newStatus } : word
            )
          );
          setAllWords((prevAllWords) =>
            prevAllWords.map((word) =>
              word._id === wordId ? { ...word, status: newStatus } : word
            )
          );
        }
    } catch (error) {
      Alert.alert(
        "Oops!",
        "Could not update the word status. Please try again."
      );
    }
  };

  const deleteWord = async (wordId) => {
    Alert.alert("Delete Word", "Are you sure you want to delete this word?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await wordsAPI.deleteWord(wordId);

            // 标记为正在移除
            setRemovingWordIds((prev) => new Set([...prev, wordId]));

            // 初始化动画值（如果不存在）
            if (!fadeAnims.current[wordId]) {
              fadeAnims.current[wordId] = new Animated.Value(1);
            }

            // 淡出动画
            Animated.timing(fadeAnims.current[wordId], {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              // 动画结束后从列表中移除
              setWords((prevWords) =>
                prevWords.filter((word) => word._id !== wordId)
              );
              setAllWords((prevAllWords) =>
                prevAllWords.filter((word) => word._id !== wordId)
              );
              setRemovingWordIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(wordId);
                return newSet;
              });
              delete fadeAnims.current[wordId];
            });
          } catch (error) {
            Alert.alert(
              "Oops!",
              "Could not delete the word. Please try again."
            );
          }
        },
      },
    ]);
  };

  const renderWord = ({ item }) => {
    // 初始化动画值
    if (!fadeAnims.current[item._id]) {
      fadeAnims.current[item._id] = new Animated.Value(1);
    }

    const isRemoving = removingWordIds.has(item._id);
    const statusColor =
      item.status === "known"
        ? ChildrenTheme.colors.success
        : item.status === "learning"
        ? ChildrenTheme.colors.warning
        : ChildrenTheme.colors.error;

    return (
      <Animated.View style={{ opacity: fadeAnims.current[item._id] }}>
        <Card
          style={styles.wordCard}
          mode="elevated"
          elevation={2}
          onPress={createPressHandler(() => {
            if (!isRemoving) {
              // 传递所有单词（allWords），而不仅仅是当前页的单词（words）
              // 这样用户可以在 WordDetailScreen 中滑动查看所有单词
              navigation.navigate("WordDetail", { 
                wordId: item._id,
                allWords: allWords.length > 0 ? allWords : words, // 优先使用 allWords，如果没有则使用 words
              });
            }
          })}
          disabled={isRemoving}
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Chip
                icon={
                  item.status === "known" ? "check-circle" : "book-open-variant"
                }
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      item.status === "known"
                        ? ChildrenTheme.colors.success + "20"
                        : item.status === "learning"
                        ? ChildrenTheme.colors.warning + "20"
                        : ChildrenTheme.colors.error + "20",
                  },
                ]}
                textStyle={[styles.statusChipText, { color: statusColor }]}
              >
                {item.status === "known"
                  ? "Mastered"
                  : item.status === "learning"
                  ? "Learning"
                  : "To Learn"}
              </Chip>
            </View>

            <View style={styles.wordInfo}>
              {item.pinyin && (
                <View style={styles.pinyinWithSpeaker}>
                  <Text
                    variant="titleMedium"
                    style={[styles.pinyin, { color: theme.colors.primary }]}
                  >
                    {item.pinyin}
                  </Text>
                  <IconButton
                    icon="volume-high"
                    size={20}
                    iconColor={theme.colors.primary}
                    onPress={() => speakWord(item.word)}
                    style={styles.speakerButton}
                  />
                </View>
              )}

              <View style={styles.wordRow}>
                <Text style={styles.wordText}>{item.word}</Text>
                <View style={styles.actions}>
                  {item.status === "unknown" && (
                    <IconButton
                      icon="check-circle"
                      size={28}
                      iconColor={ChildrenTheme.colors.success}
                      onPress={(e) => {
                        e.stopPropagation();
                        updateWordStatus(item._id, "known");
                      }}
                      style={styles.actionIconButton}
                    />
                  )}
                  {item.status === "known" && (
                    <IconButton
                      icon="refresh"
                      size={28}
                      iconColor={ChildrenTheme.colors.warning}
                      onPress={(e) => {
                        e.stopPropagation();
                        updateWordStatus(item._id, "unknown");
                      }}
                      style={styles.actionIconButton}
                    />
                  )}
                  <IconButton
                    icon="delete"
                    size={28}
                    iconColor={ChildrenTheme.colors.error}
                    onPress={(e) => {
                      e.stopPropagation();
                      deleteWord(item._id);
                    }}
                    style={styles.actionIconButton}
                  />
                </View>
              </View>

              {item.translation && (
                <Text variant="bodyLarge" style={styles.translation}>
                  {item.translation}
                </Text>
              )}
              {item.definition && (
                <Text variant="bodyMedium" style={styles.definition}>
                  {item.definition}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>
      </Animated.View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Surface style={styles.filterContainer} elevation={1}>
        <Chip
          selected={filter === "all"}
          onPress={() => setFilter("all")}
          style={styles.filterChip}
          selectedColor={theme.colors.primary}
          mode={filter === "all" ? "flat" : "outlined"}
          icon="format-list-bulleted"
        >
          All
        </Chip>
        <Chip
          selected={filter === "unknown"}
          onPress={() => setFilter("unknown")}
          style={styles.filterChip}
          selectedColor={ChildrenTheme.colors.warning}
          mode={filter === "unknown" ? "flat" : "outlined"}
          icon="book-open-variant"
        >
          Learning
        </Chip>
        <Chip
          selected={filter === "known"}
          onPress={() => setFilter("known")}
          style={styles.filterChip}
          selectedColor={ChildrenTheme.colors.success}
          mode={filter === "known" ? "flat" : "outlined"}
          icon="check-circle"
        >
          Known
        </Chip>
      </Surface>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={styles.loader}
          />
          <Text variant="bodyMedium" style={styles.loaderText}>
            Loading words...
          </Text>
        </View>
      ) : (
        <FlatList
          data={words}
          renderItem={renderWord}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          {...scrollHandlers}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="headlineSmall" style={styles.emptyText}>
                📚
              </Text>
              <Text variant="titleLarge" style={styles.emptyTitle}>
                No words found
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Start by scanning books or adding words manually
              </Text>
            </View>
          }
          onEndReached={loadMoreWords}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text variant="bodySmall" style={styles.footerText}>
                  Loading more...
                </Text>
              </View>
            ) : hasMore ? null : (
              words.length > 0 && (
                <Text variant="bodySmall" style={styles.footerText}>
                  All words loaded
                </Text>
              )
            )
          }
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          windowSize={10}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildrenTheme.colors.background,
  },
  filterContainer: {
    flexDirection: "row",
    padding: ChildrenTheme.spacing.md,
    backgroundColor: ChildrenTheme.colors.card,
    gap: ChildrenTheme.spacing.sm,
  },
  filterChip: {
    flex: 1,
    marginHorizontal: ChildrenTheme.spacing.xs,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: ChildrenTheme.spacing.xl,
  },
  loader: {
    marginBottom: ChildrenTheme.spacing.md,
  },
  loaderText: {
    color: ChildrenTheme.colors.textLight,
    marginTop: ChildrenTheme.spacing.sm,
  },
  list: {
    padding: ChildrenTheme.spacing.md,
  },
  wordCard: {
    marginBottom: ChildrenTheme.spacing.sm,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: ChildrenTheme.spacing.xs,
  },
  cardContent: {
    padding: ChildrenTheme.spacing.sm,
    paddingVertical: ChildrenTheme.spacing.sm,
  },
  statusChip: {
    alignSelf: "flex-end",
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  wordInfo: {
    marginBottom: 0,
  },
  pinyinWithSpeaker: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  pinyin: {
    fontStyle: "italic",
    marginRight: ChildrenTheme.spacing.xs,
    fontSize: 20,
  },
  speakerButton: {
    margin: 0,
    padding: 0,
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  wordText: {
    color: ChildrenTheme.colors.text,
    marginBottom: 0,
    fontSize: 64,
    fontWeight: "bold",
    lineHeight: 68,
    flex: 1,
  },
  translation: {
    color: ChildrenTheme.colors.text,
    marginTop: 2,
    fontSize: 18,
  },
  definition: {
    color: ChildrenTheme.colors.textLight,
    marginTop: 2,
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginLeft: ChildrenTheme.spacing.sm,
  },
  actionIconButton: {
    margin: 0,
    padding: 0,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: ChildrenTheme.spacing.xl,
    marginTop: ChildrenTheme.spacing.xxl,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: ChildrenTheme.spacing.md,
  },
  emptyTitle: {
    color: ChildrenTheme.colors.text,
    marginBottom: ChildrenTheme.spacing.sm,
    fontWeight: "bold",
  },
  emptySubtext: {
    color: ChildrenTheme.colors.textLight,
    textAlign: "center",
  },
  footerLoader: {
    padding: ChildrenTheme.spacing.lg,
    alignItems: "center",
  },
  footerText: {
    textAlign: "center",
    padding: ChildrenTheme.spacing.md,
    color: ChildrenTheme.colors.textLight,
  },
});
