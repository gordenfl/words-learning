import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import {
  Text,
  Card,
  Button,
  Chip,
  IconButton,
  useTheme,
  Surface,
  Snackbar,
} from "react-native-paper";
import { WebView } from "react-native-webview";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { wordsAPI } from "../services/api";
import ChildrenTheme from "../theme/childrenTheme";
import { useScrollDragHandler } from "../utils/touchHandler";
import { useThemeContext } from "../context/ThemeContext";
import VerticalSwipePager from "../components/VerticalSwipePager";
import WordContent from "../components/WordContent";

export default function WordDetailScreen({ route, navigation }) {
  const theme = useTheme();
  const { currentTheme } = useThemeContext();
  const dynamicTheme = currentTheme;
  const { wordId: initialWordId, allWords: wordsFromRoute } = route.params || {};
  const [wordId, setWordId] = useState(initialWordId);
  const [allWords, setAllWords] = useState(wordsFromRoute || []);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [generatingDetails, setGeneratingDetails] = useState(false);
  const [generatingCompounds, setGeneratingCompounds] = useState(false);
  const [generatingExamples, setGeneratingExamples] = useState(false);
  const [showStrokeOrder, setShowStrokeOrder] = useState(false);
  const [isWritingCompleted, setIsWritingCompleted] = useState(false);
  const [isCompoundPracticeCompleted, setIsCompoundPracticeCompleted] =
    useState(false);
  const [isSentencePracticeCompleted, setIsSentencePracticeCompleted] =
    useState(false);
  const [wordForStrokeOrder, setWordForStrokeOrder] = useState(null); // 用于笔顺 Modal 的单词
  const { scrollHandlers, createPressHandler } = useScrollDragHandler();
  const loadingWordIdRef = useRef(null); // 用于防止重复加载同一个单词
  const isRefreshingRef = useRef(false); // 用于防止重复刷新状态
  const handlingPageChangeRef = useRef(false); // 用于防止重复处理页面切换
  const lastHandledIndexRef = useRef(null); // 用于跟踪最后处理的索引
  const lastHandledWordIdRef = useRef(null); // 用于跟踪最后处理的 wordId

  // Create dynamic styles
  const styles = useMemo(() => createStyles(dynamicTheme), [dynamicTheme]);

  // 这个 useEffect 已经移到上面了

  // 确保导航栏显示返回按钮
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={dynamicTheme?.colors?.textInverse || theme.colors.onPrimary}
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}
        />
      ),
    });
  }, [navigation, dynamicTheme, theme, styles]);

  // 刷新所有状态的函数
  const refreshAllStatuses = async (targetWordId = null) => {
    const idToRefresh = targetWordId || wordId;
    if (!idToRefresh) {
      console.log("⚠️ refreshAllStatuses: wordId is missing");
      return;
    }

    // 防止重复刷新
    if (isRefreshingRef.current) {
      console.log("⏸️ Already refreshing, skipping...");
      return;
    }

    isRefreshingRef.current = true;
    console.log("🔄 Refreshing all statuses for word:", idToRefresh);

    try {
      // 直接检查状态，不重新加载单词详情（避免循环）
      const writingCompleted = await checkWritingCompleted(idToRefresh);
      const compoundCompleted = await checkCompoundPracticeCompleted(idToRefresh);
      const sentenceCompleted = await checkSentencePracticeCompleted(idToRefresh);

      // 更新状态
      setIsWritingCompleted(writingCompleted);
      setIsCompoundPracticeCompleted(compoundCompleted);
      setIsSentencePracticeCompleted(sentenceCompleted);

      // 检查并更新单词状态（如果所有练习都完成）
      await checkAndUpdateWordStatus();

      console.log("✅ All statuses refreshed:", {
        writing: writingCompleted,
        compound: compoundCompleted,
        sentence: sentenceCompleted,
      });
    } finally {
      isRefreshingRef.current = false;
    }
  };

  // 初始化 allWords（只在首次加载时执行）
  useEffect(() => {
    // 如果从路由参数中获取了单词列表，使用它
    if (wordsFromRoute && wordsFromRoute.length > 0) {
      setAllWords(wordsFromRoute);
      // 计算当前单词的索引
      const index = wordsFromRoute.findIndex((w) => w._id === wordId);
      if (index >= 0) {
        setCurrentWordIndex(index);
      }
      // 立即加载当前单词详情（从 allWords 中）
      if (wordId) {
        const foundWord = wordsFromRoute.find((w) => w._id === wordId);
        if (foundWord) {
          setWord(foundWord);
          setLoading(false);
        } else {
          // 如果在列表中找不到，从 API 加载
          loadWordDetail();
        }
      }
    } else if (allWords.length === 0) {
      // 如果没有从路由参数获取，且 allWords 为空，则从 API 加载
      const loadAllWords = async () => {
        try {
          const response = await wordsAPI.getAll();
          const words = response.data.words || [];
          setAllWords(words);
          // 计算当前单词的索引
          const index = words.findIndex((w) => w._id === wordId);
          if (index >= 0) {
            setCurrentWordIndex(index);
          }
          // 加载当前单词的详情
          if (wordId) {
            loadWordDetail();
          }
        } catch (error) {
          console.error("Error loading all words:", error);
          setLoading(false);
        }
      };
      loadAllWords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordsFromRoute]); // 只依赖 wordsFromRoute，不依赖 wordId，避免循环

  // 当 wordId 变化时，加载对应的单词详情（但不重新加载 allWords）
  useEffect(() => {
    if (wordId && allWords.length > 0) {
      // 如果 allWords 已经有数据，直接加载单词详情
      const foundWord = allWords.find((w) => w._id === wordId);
      if (foundWord && foundWord._id === word?._id) {
        // 如果已经是当前显示的单词，不重新加载
        return;
      }
      loadWordDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordId]); // 只依赖 wordId

  // 监听屏幕焦点，当从其他页面返回时刷新数据
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      // 当屏幕获得焦点时（从 Writing/Compound Practice/Sentence Practice 返回），刷新所有状态
      console.log("📱 WordDetailScreen focused, refreshing all statuses...");
      await refreshAllStatuses();
    });

    return unsubscribe;
  }, [navigation, wordId]);

  // 检查所有练习是否完成（当 word 更新时）
  useEffect(() => {
    if (word && word._id) {
      // 延迟检查以确保状态已更新
      const timer = setTimeout(async () => {
        await checkWritingCompletedStatus();
        await checkCompoundPracticeCompletedStatus();
        await checkSentencePracticeCompletedStatus();
        await checkAndUpdateWordStatus();
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [word?.status, word?._id]);

  const checkWritingCompletedStatus = async () => {
    const completed = await checkWritingCompleted();
    setIsWritingCompleted(completed);
  };

  const checkCompoundPracticeCompletedStatus = async () => {
    const completed = await checkCompoundPracticeCompleted();
    setIsCompoundPracticeCompleted(completed);
  };

  const checkSentencePracticeCompletedStatus = async () => {
    const completed = await checkSentencePracticeCompleted();
    setIsSentencePracticeCompleted(completed);
  };

  // 检查所有练习是否完成，如果完成则更新单词状态为 "known"
  const checkAndUpdateWordStatus = async () => {
    const currentWordId = word?._id || wordId;
    if (!currentWordId) {
      return;
    }

    const writingCompleted = await checkWritingCompleted(currentWordId);
    const compoundCompleted = await checkCompoundPracticeCompleted(
      currentWordId
    );
    const sentenceCompleted = await checkSentencePracticeCompleted(
      currentWordId
    );

    // 如果三个练习都完成，且当前状态不是 "known"，则更新状态
    if (writingCompleted && compoundCompleted && sentenceCompleted) {
      // 重新加载单词详情以获取最新状态
      const updatedWord = await loadWordDetail();
      if (updatedWord && updatedWord.status !== "known") {
        try {
          const oldStatus = updatedWord.status;
          await wordsAPI.updateWordStatus(currentWordId, "known");
          // 再次加载单词详情以更新状态
          await loadWordDetail();
          showToastMessage("🎉 恭喜！单词状态已更新为 Known！");

          // 通知 WordsListScreen 状态已更新，需要重新排序
          // 通过 navigation state 找到 WordsList 路由并设置参数
          const routes = navigation.getState()?.routes || [];
          const wordsListRoute = routes.find((r) => r.name === "WordsList");
          if (wordsListRoute) {
            navigation.navigate("WordsList", {
              ...wordsListRoute.params,
              wordUpdated: {
                wordId: currentWordId,
                newStatus: "known",
                oldStatus: oldStatus,
              },
            });
          }
        } catch (error) {
          console.error("Error updating word status:", error);
        }
      }
    }
  };

  const loadWordDetail = async (targetWordId = null) => {
    const idToLoad = targetWordId || wordId;
    if (!idToLoad) {
      setLoading(false);
      return null;
    }

    // 防止重复加载同一个单词
    if (loadingWordIdRef.current === idToLoad) {
      console.log("⏸️ Already loading word:", idToLoad);
      return null;
    }

    loadingWordIdRef.current = idToLoad;

    try {
      setLoading(true);
      
      // 总是从 API 获取完整的单词详情，确保包含 compounds 和 examples
      // 这样可以确保数据是最新的，并且包含所有必要的字段
      const response = await wordsAPI.getAll();
      const words = response.data.words || [];
      let foundWord = words.find((w) => w._id === idToLoad);
      
      // 如果从 getAll 中找不到，尝试直接获取单个单词
      if (!foundWord) {
        try {
          // 尝试通过单个单词 API 获取（如果存在）
          const singleWordResponse = await wordsAPI.getWord(idToLoad);
          foundWord = singleWordResponse.data.word;
        } catch (err) {
          console.log("Could not fetch single word, using getAll result");
        }
      }
      
      // 更新 allWords（如果还没有设置或需要更新）
      if (allWords.length === 0 || words.length > allWords.length) {
        setAllWords(words);
      }
      
      if (foundWord) {
        setWord(foundWord);

        // 检查是否需要自动生成组词和例句（只在完全没有数据时才生成）
        const hasCompounds =
          foundWord.compounds && foundWord.compounds.length > 0;
        const hasExamples = foundWord.examples && foundWord.examples.length > 0;

        if (!hasCompounds || !hasExamples) {
          // 自动生成（只在缺失数据时）
          console.log(`📝 Word ${idToLoad} missing details. Compounds: ${hasCompounds}, Examples: ${hasExamples}`);
          setTimeout(() => {
            generateDetails(false, "both", idToLoad); // false = 不强制更新，both = 同时生成 compounds 和 examples，传递正确的 wordId
          }, 500); // 延迟500ms开始生成，让界面先显示出来
        }
      } else {
        console.warn("Word not found:", idToLoad);
        setWord(null);
      }

      return foundWord;
    } catch (error) {
      console.log("Error loading word:", error);
      Alert.alert("Error", "Could not load word details");
      return null;
    } finally {
      setLoading(false);
      // 只有在成功加载或出错后才清除 loadingWordIdRef
      if (loadingWordIdRef.current === idToLoad) {
        loadingWordIdRef.current = null;
      }
    }
  };

  const speakWord = (text) => {
    Speech.speak(text, {
      language: "zh-CN", // 中文（普通话）
      pitch: 1.0,
      rate: 0.1, // 极慢速播放，便于初学者
    });
  };

  // 检查 Compound Practice 是否完成
  const checkCompoundPracticeCompleted = async (targetWordId = null) => {
    const idToCheck = targetWordId || word?._id || wordId;
    if (!idToCheck) {
      return false;
    }

    const compoundStorageKey = `compoundPractice_${idToCheck}`;
    try {
      const saved = await AsyncStorage.getItem(compoundStorageKey);
      if (saved) {
        const words = JSON.parse(saved);
        // 检查是否完成了3个组词
        if (words.length >= 3) {
          return true;
        }
      }
    } catch (error) {
      console.error("Error checking compound practice completed:", error);
    }

    return false;
  };

  // 检查 Sentence Practice 是否完成
  const checkSentencePracticeCompleted = async (targetWordId = null) => {
    const idToCheck = targetWordId || word?._id || wordId;
    if (!idToCheck) {
      return false;
    }

    const sentenceStorageKey = `sentencePractice_${idToCheck}`;
    try {
      const saved = await AsyncStorage.getItem(sentenceStorageKey);
      if (saved) {
        const sentences = JSON.parse(saved);
        // 检查是否完成了3个句子
        if (sentences.length >= 3) {
          return true;
        }
      }
    } catch (error) {
      console.error("Error checking sentence practice completed:", error);
    }

    return false;
  };

  // 检查 Writing 练习是否完成（只检查 Writing 完成标记，不依赖单词状态）
  const checkWritingCompleted = async (targetWordId = null) => {
    const idToCheck = targetWordId || word?._id || wordId;
    if (!idToCheck) {
      return false;
    }

    // 首先检查是否有 Writing 完成标记
    const completedKey = `writingCompleted_${idToCheck}`;
    try {
      const writingCompleted = await AsyncStorage.getItem(completedKey);
      if (writingCompleted === "true") {
        return true;
      }
    } catch (error) {
      console.error("Error checking writing completed:", error);
    }

    // 如果没有完成标记，检查是否有保存的 Writing 进度（已完成10个）
    const progressStorageKey = `writingProgress_${idToCheck}`;
    try {
      const savedProgress = await AsyncStorage.getItem(progressStorageKey);
      if (savedProgress) {
        const indices = JSON.parse(savedProgress);
        // 如果完成了所有10个练习，返回 true
        if (indices.length >= 10) {
          return true;
        }
      }
    } catch (error) {
      console.error("Error checking writing progress:", error);
    }

    // 如果都没有，说明未完成
    return false;
  };

  // 处理 Compound Practice 按钮点击
  const handleCompoundPracticeClick = async () => {
    // 检查 Writing 练习是否完成（只检查 Writing 进度）
    const isWritingCompleted = await checkWritingCompleted();

    if (!isWritingCompleted) {
      // 显示提示信息
      Alert.alert(
        "需要先完成 Writing 训练",
        "You need to complete Writing practice first",
        [
          {
            text: "确定 / OK",
            style: "default",
          },
        ]
      );
      return;
    }

    // Writing 练习已完成，可以进入组词练习
    const randomIndex = Math.floor(Math.random() * word.compounds.length);
    const selectedCompound = word.compounds[randomIndex];
    // 导航到组词练习界面
    navigation.navigate("CompoundPractice", {
      word,
      compound: selectedCompound,
    });
  };

  // 处理 Sentence Practice 按钮点击
  const handleSentencePracticeClick = async () => {
    // 检查 Compound Practice 是否完成
    const isCompoundCompleted = await checkCompoundPracticeCompleted();

    if (!isCompoundCompleted) {
      // 显示提示信息
      Alert.alert(
        "需要先完成 Compound Practice",
        "You need to complete Compound Practice first",
        [
          {
            text: "确定 / OK",
            style: "default",
          },
        ]
      );
      return;
    }

    // Compound Practice 已完成，可以进入造句练习
    navigation.navigate("SentencePractice", { word });
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // updateWordStatus 函数已移除 - 状态只能通过用户行为（如书写练习）自动更新

  const generateDetails = async (force = false, updateType = "both", targetWordId = null) => {
    const idToGenerate = targetWordId || wordId;
    if (!idToGenerate) {
      console.warn("⚠️ generateDetails: wordId is missing");
      return;
    }

    // 设置对应的加载状态
    if (updateType === "compounds") {
      setGeneratingCompounds(true);
    } else if (updateType === "examples") {
      setGeneratingExamples(true);
    } else {
      setGeneratingDetails(true);
    }

    try {
      console.log(`🔄 Generating details for word: ${idToGenerate}, type: ${updateType}`);
      const response = await wordsAPI.generateDetails(
        idToGenerate,
        force,
        updateType
      );
      // 只有当生成的单词是当前显示的单词时，才更新 word 状态
      if (response.data.word && response.data.word._id === (targetWordId || wordId)) {
        setWord(response.data.word);
      }
      // 成功后显示提示
      if (force) {
        const message =
          updateType === "compounds"
            ? "✅ Compounds updated"
            : updateType === "examples"
            ? "✅ Examples updated"
            : "✅ Updated successfully";
        showToastMessage(message);
      } else {
        // 自动生成时不显示提示，直接更新界面
      }
    } catch (error) {
      console.log("Error generating details:", error);
      const errorMessage = force
        ? "❌ Failed to update"
        : "❌ Failed to generate";
      showToastMessage(errorMessage);
    } finally {
      if (updateType === "compounds") {
        setGeneratingCompounds(false);
      } else if (updateType === "examples") {
        setGeneratingExamples(false);
      } else {
        setGeneratingDetails(false);
      }
    }
  };

  const deleteWord = async () => {
    Alert.alert("Delete Word", "Are you sure you want to delete this word?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await wordsAPI.delete(wordId);

            // 通知列表页面删除这个单词
            const routes = navigation.getState().routes;
            const wordsListRoute = routes.find((r) => r.name === "WordsList");
            if (wordsListRoute) {
              navigation.navigate("WordsList", {
                ...wordsListRoute.params,
                wordUpdated: { wordId, deleted: true },
              });
            } else {
              navigation.goBack();
            }
          } catch (error) {
            Alert.alert("Error", "Could not delete word");
          }
        },
      },
    ]);
  };

  // 渲染单个单词内容的组件
  const renderWordContent = useCallback(({ item: wordData, index }) => {
    if (!wordData) {
      return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <WordContent
        word={wordData}
        navigation={navigation}
        onDeleteWord={deleteWord}
        onGenerateDetails={generateDetails}
        onCompoundPracticeClick={handleCompoundPracticeClick}
        onSentencePracticeClick={handleSentencePracticeClick}
        generatingDetails={generatingDetails}
        generatingCompounds={generatingCompounds}
        generatingExamples={generatingExamples}
        showStrokeOrder={showStrokeOrder}
        onShowStrokeOrder={(wordData) => {
          setWordForStrokeOrder(wordData);
          setShowStrokeOrder(true);
        }}
        styles={styles}
      />
    );
  }, [
    theme,
    navigation,
    deleteWord,
    generateDetails,
    handleCompoundPracticeClick,
    handleSentencePracticeClick,
    generatingDetails,
    generatingCompounds,
    generatingExamples,
    showStrokeOrder,
    styles,
  ]);

  // 处理页面切换
  const handlePageSelected = useCallback(async (index) => {
    if (allWords.length === 0 || index < 0 || index >= allWords.length) {
      return;
    }

    const newWord = allWords[index];
    if (!newWord) {
      return;
    }
    const newWordId = newWord._id;
    
    // 防止重复处理同一个索引和 wordId
    if (lastHandledIndexRef.current === index && lastHandledWordIdRef.current === newWordId) {
      return; // 静默返回，不打印日志
    }

    // 防止并发处理
    if (handlingPageChangeRef.current) {
      return; // 静默返回，不打印日志
    }

    // 如果已经是当前单词，不执行任何操作
    if (newWordId === wordId) {
      lastHandledIndexRef.current = index;
      lastHandledWordIdRef.current = newWordId;
      return;
    }
    
    handlingPageChangeRef.current = true;
    lastHandledIndexRef.current = index;
    lastHandledWordIdRef.current = newWordId;
    
    console.log("📄 切换到单词:", newWordId, "索引:", index);
    
    try {
      // 更新 wordId 和当前索引
      setWordId(newWordId);
      setCurrentWordIndex(index);
      
      // 加载完整详情
      await loadWordDetail(newWordId);
      
      // 刷新状态（不重新加载单词详情，避免循环）
      await refreshAllStatuses(newWordId);
    } catch (error) {
      console.error("Error in handlePageSelected:", error);
    } finally {
      // 延迟清除标志，防止快速连续切换
      setTimeout(() => {
        handlingPageChangeRef.current = false;
      }, 800);
    }
  }, [allWords, wordId]);

  // 如果没有单词数据，显示加载或错误
  if (loading || allWords.length === 0) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyMedium" style={styles.loaderText}>
          Loading word...
        </Text>
      </View>
    );
  }

  // 如果当前单词不存在，显示错误
  if (!word) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text variant="titleLarge" style={styles.errorText}>
          Word not found
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <VerticalSwipePager
        data={allWords}
        renderItem={renderWordContent}
        initialPage={currentWordIndex}
        onPageSelected={handlePageSelected}
        preloadCount={1}
      />
      
      <Snackbar
        visible={showToast}
        onDismiss={() => setShowToast(false)}
        duration={2000}
        style={styles.snackbar}
      >
        {toastMessage}
      </Snackbar>

      {/* 笔顺动画 Modal */}
      <Modal
        visible={showStrokeOrder}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStrokeOrder(false)}
      >
        <View style={styles.strokeModalOverlay}>
          <Card style={styles.strokeModalContent} mode="elevated" elevation={8}>
            <Card.Content style={styles.strokeModalHeaderContent}>
              <View style={styles.strokeModalHeader}>
                <Text variant="headlineSmall" style={styles.strokeModalTitle}>
                  Stroke Order • 笔顺
                </Text>
                <IconButton
                  icon="close"
                  size={24}
                  iconColor={dynamicTheme.colors.text}
                  onPress={createPressHandler(() => setShowStrokeOrder(false))}
                  style={styles.strokeModalClose}
                />
              </View>
            </Card.Content>

            <Card.Content style={styles.strokeWebViewContent}>
              <View style={styles.strokeWebViewContainer}>
                <WebView
                  source={{
                    html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                      <style>
                        * {
                          -webkit-tap-highlight-color: transparent;
                          -webkit-touch-callout: none;
                          -webkit-user-select: none;
                          user-select: none;
                        }
                        body {
                          margin: 0;
                          padding: 20px;
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          justify-content: center;
                          min-height: 100vh;
                          background: ${dynamicTheme.colors.background};
                          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                          overflow-x: hidden;
                        }
                        #character-target {
                          margin: 20px auto;
                          display: block;
                        }
                        .controls {
                          display: flex;
                          gap: 12px;
                          margin-top: 25px;
                          flex-wrap: wrap;
                          justify-content: center;
                          width: 100%;
                          padding: 0 20px;
                          box-sizing: border-box;
                        }
                        button {
                          padding: 14px 28px;
                          font-size: 17px;
                          border: none;
                          border-radius: 20px;
                          background: ${dynamicTheme.colors.primary};
                          color: ${dynamicTheme.colors.textInverse};
                          font-weight: 600;
                          cursor: pointer;
                          box-shadow: 0 4px 8px ${dynamicTheme.colors.primary}4D;
                          transition: all 0.2s;
                          flex: 1;
                          min-width: 140px;
                          max-width: 200px;
                        }
                        button:active {
                          transform: scale(0.96);
                          box-shadow: 0 2px 4px ${dynamicTheme.colors.primary}33;
                        }
                        button:hover {
                          background: ${dynamicTheme.colors.primaryDark};
                        }
                        .info {
                          text-align: center;
                          color: ${dynamicTheme.colors.textLight};
                          margin-top: 18px;
                          font-size: 15px;
                          padding: 0 20px;
                        }
                        #status {
                          color: ${dynamicTheme.colors.primary};
                          font-size: 14px;
                          margin-top: 10px;
                          min-height: 20px;
                          font-weight: 500;
                        }
                      </style>
                    </head>
                    <body>
                      <svg id="character-target" width="280" height="280"></svg>
                      <div class="controls">
                        <button id="animateBtn" ontouchstart="handleAnimate(event)" onclick="handleAnimate(event)">▶️ Animate</button>
                        <button id="practiceBtn" ontouchstart="handlePractice(event)" onclick="handlePractice(event)">✏️ Practice</button>
                      </div>
                      <div class="info">Tap buttons to animate or practice</div>
                      <div id="status"></div>
                      
                      <script>
                        let writer = null;
                        let isAnimating = false;
                        let scriptLoaded = false;
                        
                        function setStatus(msg) {
                          const statusEl = document.getElementById('status');
                          if (statusEl) {
                            statusEl.textContent = msg;
                          }
                        }
                        
                        let loopCount = 0;
                        let maxLoops = 3; // 循环 3 次
                        let quizActive = false;
                        let animationTimer = null; // 保存 setTimeout 的 ID
                        
                        function handleAnimate(event) {
                          if (event) {
                            event.preventDefault();
                            event.stopPropagation();
                          }
                          setStatus('Animate button clicked!');
                          animate();
                        }
                        
                        function handlePractice(event) {
                          if (event) {
                            event.preventDefault();
                            event.stopPropagation();
                          }
                          setStatus('Practice button clicked!');
                          practice();
                        }
                        
                        function animate() {
                          setStatus('Animate: checking states...');
                          
                          if (!writer) {
                            setStatus('Writer not ready');
                            return;
                          }
                          
                          // 如果正在播放动画，忽略点击（无效）
                          if (isAnimating) {
                            setStatus('Animation already running');
                            return;
                          }
                          
                          // 如果正在练习模式，先取消并清空
                          if (quizActive) {
                            setStatus('Cancelling quiz...');
                            try {
                              writer.cancelQuiz();
                              quizActive = false;
                              setStatus('Switching to animation...');
                            } catch (e) {
                              setStatus('Cancel quiz error: ' + e.message);
                              quizActive = false;
                            }
                            
                            // 延迟一下再开始动画，确保练习模式完全清空
                            setTimeout(() => {
                              setStatus('Starting animation after quiz...');
                              if (!quizActive && !isAnimating) {
                                startAnimation();
                              } else {
                                setStatus('Cannot start: quiz=' + quizActive + ', anim=' + isAnimating);
                              }
                            }, 200);
                            return;
                          }
                          
                          // 直接开始动画
                          setStatus('Starting animation directly...');
                          startAnimation();
                        }
                        
                        function startAnimation() {
                          // 重置循环计数并开始动画
                          loopCount = 0;
                          isAnimating = true;
                          animateLoop();
                        }
                        
                        function stopAnimation() {
                          // 停止动画循环
                          isAnimating = false;
                          loopCount = 0;
                          if (animationTimer) {
                            clearTimeout(animationTimer);
                            animationTimer = null;
                          }
                        }
                        
                        function animateLoop() {
                          // 检查是否应该继续
                          if (!isAnimating) {
                            return;
                          }
                          
                          if (loopCount >= maxLoops) {
                            isAnimating = false;
                            loopCount = 0;
                            setStatus('Animation complete!');
                            setTimeout(() => setStatus('Tap Animate to replay'), 2000);
                            return;
                          }
                          
                          setStatus('Playing animation... (Loop ' + (loopCount + 1) + '/' + maxLoops + ')');
                          
                          writer.animateCharacter({
                            onComplete: function() {
                              // 再次检查是否应该继续
                              if (!isAnimating) {
                                return;
                              }
                              
                              loopCount++;
                              if (loopCount < maxLoops) {
                                animationTimer = setTimeout(animateLoop, 800);
                              } else {
                                isAnimating = false;
                                loopCount = 0;
                                setStatus('Animation complete!');
                                setTimeout(() => setStatus('Tap Animate to replay'), 2000);
                              }
                            }
                          });
                        }
                        
                        function practice() {
                          if (!writer) {
                            setStatus('Writer not ready');
                            return;
                          }
                          
                          // 如果正在动画中，完全停止动画
                          if (isAnimating) {
                            stopAnimation();
                            setStatus('Stopping animation...');
                            // 延迟后启动练习模式
                            setTimeout(() => {
                              startPractice();
                            }, 150);
                            return;
                          }
                          
                          // 如果已经在练习模式，清空内容并重新开始
                          if (quizActive) {
                            writer.cancelQuiz();
                            // 延迟一下再重启，确保清空完成
                            setTimeout(() => {
                              startPractice();
                            }, 100);
                            return;
                          }
                          
                          // 启动练习模式
                          startPractice();
                        }
                        
                        function startPractice() {
                          quizActive = true;
                          setStatus('Starting practice mode...');
                          
                          writer.quiz({
                            onMistake: function(strokeData) {
                              setStatus('Try again! ❌');
                            },
                            onCorrectStroke: function(strokeData) {
                              setStatus('Good! ✓ Stroke ' + (strokeData.strokeNum + 1));
                            },
                            onComplete: function() {
                              quizActive = false;
                              setStatus('Perfect! 完成！🎉');
                              setTimeout(() => setStatus('Tap Practice to try again'), 3000);
                            }
                          });
                        }
                        
                        function initWriter() {
                          try {
                            setStatus('Initializing...');
                            
                            if (typeof HanziWriter === 'undefined') {
                              setStatus('Loading library...');
                              setTimeout(initWriter, 500);
                              return;
                            }
                            
                            writer = HanziWriter.create('character-target', '${wordForStrokeOrder?.word || word?.word || ""}', {
                              width: 280,
                              height: 280,
                              padding: 15,
                              showOutline: true,
                              strokeAnimationSpeed: 0.5, // 减慢速度（原来 1.2，越小越慢）
                              delayBetweenStrokes: 600,   // 增加笔画间隔（原来 200ms，现在 600ms）
                              delayBetweenLoops: 1000,    // 循环之间的延迟
                              strokeColor: '#333',
                              radicalColor: '${dynamicTheme.colors.primary}',
                              outlineColor: '#DDD',
                              drawingColor: '${dynamicTheme.colors.primary}',
                              drawingWidth: 6,
                              showCharacter: true
                            });
                            
                            setStatus('Ready!');
                            
                            // 自动播放一次
                            setTimeout(() => {
                              if (writer) {
                                animate();
                              }
                            }, 500);
                          } catch (error) {
                            setStatus('Error: ' + error.message);
                            console.log('Init error:', error);
                          }
                        }
                        
                        // 加载 HanziWriter 库（尝试多个 CDN 源）
                        (function() {
                          setStatus('Loading HanziWriter...');
                          
                          const cdnSources = [
                            'https://unpkg.com/hanzi-writer@3.5.0/dist/hanzi-writer.min.js',
                            'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5.0/dist/hanzi-writer.min.js',
                            'https://unpkg.com/hanzi-writer@latest/dist/hanzi-writer.min.js',
                            'https://cdn.jsdelivr.net/npm/hanzi-writer@latest/dist/hanzi-writer.min.js'
                          ];
                          
                          let currentIndex = 0;
                          
                          function tryLoadScript() {
                            if (currentIndex >= cdnSources.length) {
                              setStatus('All CDN sources failed. Network issue?');
                              return;
                            }
                            
                            const source = cdnSources[currentIndex];
                            setStatus('Trying CDN ' + (currentIndex + 1) + '...');
                            
                            const script = document.createElement('script');
                            script.src = source;
                            script.timeout = 5000;
                            
                            const timeout = setTimeout(() => {
                              setStatus('Timeout, trying next...');
                              script.remove();
                              currentIndex++;
                              tryLoadScript();
                            }, 5000);
                            
                            script.onload = function() {
                              clearTimeout(timeout);
                              scriptLoaded = true;
                              setStatus('Library loaded from CDN ' + (currentIndex + 1) + '!');
                              setTimeout(initWriter, 200);
                            };
                            
                            script.onerror = function() {
                              clearTimeout(timeout);
                              setStatus('CDN ' + (currentIndex + 1) + ' failed, trying next...');
                              currentIndex++;
                              setTimeout(tryLoadScript, 500);
                            };
                            
                            document.head.appendChild(script);
                          }
                          
                          tryLoadScript();
                        })();
                      </script>
                    </body>
                    </html>
                  `,
                  }}
                  style={styles.strokeWebView}
                  originWhitelist={["*"]}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  scalesPageToFit={false}
                  scrollEnabled={false}
                  bounces={false}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  mixedContentMode="always"
                  renderLoading={() => (
                    <View style={styles.strokeLoadingContainer}>
                      <ActivityIndicator
                        size="large"
                        color={dynamicTheme.colors.primary}
                      />
                      <Text
                        variant="bodyMedium"
                        style={styles.strokeLoadingText}
                      >
                        Loading stroke order...
                      </Text>
                    </View>
                  )}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn("WebView error: ", nativeEvent);
                  }}
                />
              </View>
            </Card.Content>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

// Create dynamic styles based on theme
const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  errorText: {
    color: theme.colors.textLight,
  },
  content: {
    padding: ChildrenTheme.spacing.md,
  },
  scrollContent: {
    paddingBottom: 120, // 增加底部 padding，确保底部按钮可见（使用固定值以确保足够空间）
    flexGrow: 1,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: ChildrenTheme.spacing.md,
  },
  statusChip: {
    alignSelf: "flex-end",
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  mainCard: {
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  mainContent: {
    position: "relative",
    padding: ChildrenTheme.spacing.lg,
    alignItems: "center",
  },
  pinyin: {
    fontStyle: "italic",
    marginBottom: ChildrenTheme.spacing.sm,
    textAlign: "center",
  },
  wordWithSpeaker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ChildrenTheme.spacing.xs,
  },
  speakerButton: {
    margin: 0,
    marginLeft: ChildrenTheme.spacing.sm,
    padding: 0,
  },
  strokeHintButton: {
    margin: 0,
    padding: 0,
    position: "absolute",
    top: ChildrenTheme.spacing.sm,
    right: ChildrenTheme.spacing.sm,
  },
  wordText: {
    fontSize: 80,
    fontWeight: "bold",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: ChildrenTheme.spacing.sm,
    lineHeight: 88,
  },
  translation: {
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: ChildrenTheme.spacing.xs,
  },
  tapHint: {
    color: theme.colors.textLight,
    textAlign: "center",
    marginTop: ChildrenTheme.spacing.xs,
  },
  generatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: ChildrenTheme.spacing.md,
    gap: ChildrenTheme.spacing.sm,
  },
  generatingText: {
    color: theme.colors.textLight,
    fontStyle: "italic",
  },
  emptyText: {
    color: theme.colors.textLight,
    fontStyle: "italic",
    textAlign: "center",
  },
  sectionCard: {
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: ChildrenTheme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontWeight: "bold",
    flex: 1,
  },
  compoundItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: ChildrenTheme.spacing.sm,
    paddingHorizontal: ChildrenTheme.spacing.sm,
    marginBottom: ChildrenTheme.spacing.xs,
    borderRadius: ChildrenTheme.borderRadius.small,
    backgroundColor: theme.colors.background,
  },
  compoundLeft: {
    flex: 1,
    marginRight: ChildrenTheme.spacing.sm,
  },
  compoundWord: {
    color: theme.colors.text,
    fontWeight: "bold",
    marginBottom: 2,
  },
  compoundPinyin: {
    color: theme.colors.primary,
    fontStyle: "italic",
  },
  compoundMeaning: {
    color: theme.colors.textLight,
    textAlign: "right",
    maxWidth: "40%",
  },
  exampleItem: {
    paddingVertical: ChildrenTheme.spacing.sm,
    paddingHorizontal: ChildrenTheme.spacing.sm,
    marginBottom: ChildrenTheme.spacing.xs,
    borderRadius: ChildrenTheme.borderRadius.small,
    backgroundColor: theme.colors.background,
  },
  exampleChinese: {
    color: theme.colors.text,
    fontWeight: "500",
    marginBottom: 4,
  },
  examplePinyin: {
    color: theme.colors.primary,
    fontStyle: "italic",
    marginBottom: 4,
  },
  exampleEnglish: {
    color: theme.colors.textLight,
  },
  exampleText: {
    color: theme.colors.text,
  },
  definition: {
    color: theme.colors.text,
    lineHeight: 24,
    marginTop: ChildrenTheme.spacing.xs,
  },
  snackbar: {
    marginBottom: ChildrenTheme.spacing.xl,
  },
  strokeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: ChildrenTheme.spacing.lg,
  },
  strokeModalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: ChildrenTheme.borderRadius.xlarge,
    width: "100%",
    maxWidth: 500,
    maxHeight: "85%",
    overflow: "hidden",
  },
  strokeModalHeaderContent: {
    padding: ChildrenTheme.spacing.md,
    paddingBottom: ChildrenTheme.spacing.sm,
  },
  strokeModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  strokeModalTitle: {
    color: theme.colors.text,
    fontWeight: "bold",
    flex: 1,
  },
  strokeModalClose: {
    margin: 0,
  },
  strokeWebViewContent: {
    padding: 0,
  },
  strokeWebViewContainer: {
    height: 600,
    width: "100%",
    backgroundColor: theme.colors.card,
  },
  strokeWebView: {
    flex: 1,
    backgroundColor: theme.colors.card,
  },
  strokeLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.card,
  },
  strokeLoadingText: {
    marginTop: ChildrenTheme.spacing.md,
    color: theme.colors.textLight,
  },
  writingButton: {
    marginVertical: ChildrenTheme.spacing.xs,
  },
  sentencePracticeButton: {
    marginVertical: ChildrenTheme.spacing.xs,
  },
  compoundPracticeButton: {
    marginVertical: ChildrenTheme.spacing.xs,
  },
  deleteButtonContainer: {
    position: "absolute",
    bottom: ChildrenTheme.spacing.xs,
    right: ChildrenTheme.spacing.xs,
  },
  deleteButton: {
    margin: 0,
  },
  headerBackButton: {
    marginLeft: 8,
  },
});
