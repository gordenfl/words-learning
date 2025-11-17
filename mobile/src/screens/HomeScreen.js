import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  IconButton,
  useTheme,
  Card,
  Button,
  Chip,
  Text as PaperText,
  Surface,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { wordsAPI, articlesAPI, usersAPI, ocrAPI } from "../services/api";
import cnchar from "cnchar";
import order from "cnchar-order";
// 引入儿童友好主题和组件
import ChildrenTheme from "../theme/childrenTheme";
import ProgressCard from "../components/children/ProgressCard";

// 初始化 cnchar 笔画插件
cnchar.use(order);

const WORD_CELL_SIZE = 64;
const WORD_CELL_MARGIN = 12;
const WORD_ANIMATION_DURATION = 1200;
const WORD_ANIMATION_DELAY = 300;
const WORD_ANIMATION_SCALE_VARIATION = {
  min: 0.75,
  mid: 1.25,
  base: 1,
};

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingArticle, setGeneratingArticle] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [showWordsConfirm, setShowWordsConfirm] = useState(false);
  const [scannedImage, setScannedImage] = useState(null);
  const [extractedWords, setExtractedWords] = useState([]);
  const [knownWords, setKnownWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [gridWidth, setGridWidth] = useState(0);
  const [user, setUser] = useState(null);
  const [learningPlan, setLearningPlan] = useState(null);
  const wordAnimationsRef = useRef({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Reload data when screen comes into focus
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!showWordsConfirm) {
      wordAnimationsRef.current = {};
      return;
    }

    if (extractedWords.length === 0 || gridWidth === 0) {
      return;
    }

    const columns = getGridColumns();
    const safeColumns = Math.max(columns, 1);

    extractedWords.forEach((item) => {
      const startPosition = getGridPosition(item.originalIndex, safeColumns);
      const existing = wordAnimationsRef.current[item.id];

      if (existing) {
        existing.position.setValue(startPosition);
        existing.progress.setValue(0);
        return;
      }

      wordAnimationsRef.current[item.id] = {
        position: new Animated.ValueXY(startPosition),
        progress: new Animated.Value(0),
      };
    });

    const timeout = setTimeout(() => {
      extractedWords.forEach((item, index) => {
        const anim = wordAnimationsRef.current[item.id];
        if (!anim) {
          return;
        }

        Animated.parallel([
          Animated.timing(anim.position, {
            toValue: getGridPosition(index, safeColumns),
            duration: WORD_ANIMATION_DURATION,
            delay: WORD_ANIMATION_DELAY,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim.progress, {
            toValue: 1,
            duration: WORD_ANIMATION_DURATION,
            delay: WORD_ANIMATION_DELAY,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 200);

    return () => {
      clearTimeout(timeout);
    };
  }, [
    showWordsConfirm,
    extractedWords,
    gridWidth,
    getGridColumns,
    getGridPosition,
  ]);

  const loadData = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        setUser(JSON.parse(userStr));
      }

      const [statsResponse, planResponse] = await Promise.all([
        wordsAPI.getStats().catch((err) => {
          if (__DEV__) {
            console.log(
              "Stats error:",
              err.response?.data?.error || err.message
            );
          }
          // 如果是401错误，需要重新登录
          if (err.response?.status === 401) {
            Alert.alert("Session Expired", "Please login again", [
              {
                text: "OK",
                onPress: () => {
                  AsyncStorage.clear();
                  navigation.replace("Login");
                },
              },
            ]);
            throw err;
          }
          return {
            data: {
              total: 0,
              known: 0,
              unknown: 0,
              learning: 0,
              todayLearned: 0,
            },
          };
        }),
        usersAPI.getLearningPlan().catch((err) => {
          if (__DEV__) {
            console.log(
              "Learning plan error:",
              err.response?.data?.error || err.message
            );
          }
          // 401错误会被上面的stats捕获
          return {
            data: {
              learningPlan: {
                dailyWordGoal: 10,
                weeklyWordGoal: 50,
                monthlyWordGoal: 200,
                difficulty: "intermediate",
                preferredStudyTime: [],
              },
            },
          };
        }),
      ]);

      setStats(statsResponse.data);
      setLearningPlan(planResponse.data.learningPlan);
    } catch (error) {
      if (__DEV__) {
        console.log("Error loading data:", error.message);
      }
      // 401错误已经处理，其他错误使用默认值
    } finally {
      setLoading(false);
    }
  };

  const compressImage = async (imageUri) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.warn("Image compression failed:", error);
      return imageUri;
    }
  };

  const processImage = async (imageUri) => {
    setProcessingImage(true);
    try {
      const compressedUri = await compressImage(imageUri);

      const response = await fetch(compressedUri);
      const blob = await response.blob();
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const ocrResponse = await ocrAPI.extractText(base64);
      const { newWords, knownWords: known } = ocrResponse.data;

      const normalizedOriginalNewWords = normalizeWordList(newWords).map(
        (item, index) => ({
          ...item,
          originalIndex: index,
          id: `${item.word || "word"}-${index}-${Date.now()}`,
        })
      );
      const normalizedKnownWords = normalizeWordList(known).map(
        (item, index) => ({
          ...item,
          id: `${item.word || "known"}-${index}-${Date.now()}`,
        })
      );

      const sortedNewWords = sortByStrokeCount([
        ...normalizedOriginalNewWords,
      ]).map((item, index) => ({
        ...item,
        sortedIndex: index,
      }));
      const sortedKnownWords = sortByStrokeCount([...normalizedKnownWords]);

      if (__DEV__) {
        console.log(
          "New words:",
          sortedNewWords.map((w) => w.word)
        );
        console.log(
          "Known words:",
          sortedKnownWords.map((w) => w.word)
        );
      }

      if (sortedNewWords.length === 0 && sortedKnownWords.length === 0) {
        Alert.alert(
          "No Words Found",
          "No Chinese characters detected in the image."
        );
        return;
      }

      // 显示确认界面
      setScannedImage(imageUri);
      setExtractedWords(sortedNewWords); // 按笔画排序
      setKnownWords(sortedKnownWords);
      setSelectedWords([]); // 默认不选中，让用户自己选择
      setProcessingImage(false);
      setShowWordsConfirm(false);
      setTimeout(() => {
        setShowWordsConfirm(true);
      }, 0);
    } catch (error) {
      if (__DEV__) {
        console.log("OCR error:", error.message);
      }
      Alert.alert(
        "Oops!",
        "Could not extract text from the image. Please try another image."
      );
    } finally {
      setProcessingImage(false);
    }
  };

  const normalizeWordList = function normalizeWordList(list) {
    if (!Array.isArray(list)) {
      return [];
    }

    return list
      .map((item) => {
        if (typeof item === "string") {
          return {
            word: item,
            pinyin: "",
          };
        }

        if (item && typeof item === "object") {
          const normalizedWord =
            item.word || item.character || item.text || item.value;
          if (!normalizedWord) {
            return null;
          }

          return {
            ...item,
            word: normalizedWord,
            pinyin: item.pinyin || "",
          };
        }

        return null;
      })
      .filter(Boolean);
  };

  const getGridColumns = useCallback(() => {
    if (gridWidth <= 0) {
      return 1;
    }
    const cellSpacing = WORD_CELL_SIZE + WORD_CELL_MARGIN;
    return Math.max(
      1,
      Math.floor((gridWidth + WORD_CELL_MARGIN) / cellSpacing)
    );
  }, [gridWidth]);

  const getGridPosition = useCallback(
    (index, columns) => {
      const cellSpacing = WORD_CELL_SIZE + WORD_CELL_MARGIN;
      const totalWidth = columns * cellSpacing - WORD_CELL_MARGIN;
      const offsetX = Math.max((gridWidth - totalWidth) / 2, 0);
      const col = index % columns;
      const row = Math.floor(index / columns);
      return {
        x: offsetX + col * cellSpacing,
        y: row * cellSpacing,
      };
    },
    [gridWidth]
  );

  const handleWordGridLayout = useCallback(
    (event) => {
      const { width } = event.nativeEvent.layout;
      if (Math.abs(width - gridWidth) > 1) {
        setGridWidth(width);
      }
    },
    [gridWidth]
  );

  // 获取汉字笔画数（使用 cnchar 库获取准确笔画数）
  const getStrokeCount = (char) => {
    try {
      // 检查是否为空或非字符串
      if (!char || typeof char !== "string" || char.length === 0) {
        return 999;
      }

      // 使用 cnchar 获取笔画数
      const strokeCount = cnchar.stroke(char);

      // cnchar.stroke() 返回的可能是数字或数组
      // 如果是数组（多个字符），取第一个字符的笔画数
      const count = Array.isArray(strokeCount) ? strokeCount[0] : strokeCount;

      // 如果获取失败（返回 undefined 或 0），使用备用方案
      if (!count || count === 0) {
        const code = char.charCodeAt(0);
        // 不是汉字，排到最后
        if (code < 0x4e00 || code > 0x9fff) {
          return 999;
        }
        // 简单估算
        return 10;
      }

      return count;
    } catch (error) {
      return 999; // 出错时排到最后
    }
  };

  // 按笔画数排序单词
  const sortByStrokeCount = (words) => {
    const sorted = [...words].sort((a, b) => {
      const strokesA = getStrokeCount(a.word.charAt(0));
      const strokesB = getStrokeCount(b.word.charAt(0));

      // 如果笔画数相同，按拼音排序
      if (strokesA === strokesB) {
        return (a.pinyin || "").localeCompare(b.pinyin || "");
      }

      return strokesA - strokesB;
    });

    return sorted;
  };

  const toggleWordSelection = (word) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter((w) => w !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleConfirmAddWords = async () => {
    if (selectedWords.length === 0) {
      Alert.alert(
        "No Words Selected",
        "Please select at least one word to add"
      );
      return;
    }

    try {
      const wordsToAdd = extractedWords.filter((w) =>
        selectedWords.includes(w.word)
      );
      await wordsAPI.addWords(wordsToAdd);

      setShowWordsConfirm(false);
      setScannedImage(null);
      setExtractedWords([]);
      setKnownWords([]);
      setSelectedWords([]);
      setGridWidth(0);

      Alert.alert(
        "Success! ✨",
        `Added ${wordsToAdd.length} new words to your list!`
      );
      loadData(); // 刷新统计
    } catch (error) {
      Alert.alert("Oops!", "Could not add words. Please try again.");
    }
  };

  const handleCancelAddWords = () => {
    setShowWordsConfirm(false);
    setScannedImage(null);
    setExtractedWords([]);
    setKnownWords([]);
    setSelectedWords([]);
    setGridWidth(0);
  };

  const takePhoto = async () => {
    console.log("📷 takePhoto function called");
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log("📷 Camera permission status:", status);
      if (status !== "granted") {
        Alert.alert(
          "Permission Needed",
          "Please allow camera access to take photos"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true, // 启用编辑界面，允许裁剪选择范围
        aspect: [1, 1], // 正方形裁剪
        quality: 1,
      });
      console.log(
        "📷 Camera result:",
        result.canceled ? "Cancelled" : "Got image"
      );

      if (!result.canceled) {
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      if (__DEV__) {
        console.log("❌ takePhoto error:", error.message);
      }
      Alert.alert("Error", "Camera failed: " + error.message);
    }
  };

  const columns = getGridColumns();
  const gridHeight =
    extractedWords.length > 0
      ? Math.ceil(extractedWords.length / Math.max(columns, 1)) *
        (WORD_CELL_SIZE + WORD_CELL_MARGIN)
      : 0;

  const pickImage = async () => {
    console.log("🖼️ pickImage function called");
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("🖼️ Gallery permission status:", status);
      if (status !== "granted") {
        Alert.alert(
          "Permission Needed",
          "Please allow photo access to select images"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // 启用编辑界面，允许裁剪选择范围
        aspect: [1, 1], // 正方形裁剪
        quality: 1,
      });
      console.log(
        "🖼️ Gallery result:",
        result.canceled ? "Cancelled" : "Got image"
      );

      if (!result.canceled) {
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      if (__DEV__) {
        console.log("❌ pickImage error:", error.message);
      }
      Alert.alert("Error", "Gallery failed: " + error.message);
    }
  };

  const handleScanBook = () => {
    console.log("📸 Camera button clicked!");
    Alert.alert("Scan Book 📸", "Choose how to import Chinese words", [
      {
        text: "Take Photo",
        onPress: () => {
          console.log("📷 Take Photo selected");
          takePhoto();
        },
      },
      {
        text: "Choose from Gallery",
        onPress: () => {
          console.log("🖼️ Gallery selected");
          pickImage();
        },
      },
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => console.log("❌ Cancelled"),
      },
    ]);
  };

  const handleGenerateArticle = async () => {
    try {
      setGeneratingArticle(true);
      const response = await articlesAPI.generateArticle(10);

      // 检查是否需要更多单词
      if (response.data.needMoreWords) {
        setGeneratingArticle(false);
        Alert.alert(
          response.data.message || "Great job! 🎉",
          response.data.suggestion ||
            "Scan books or photos to add more Chinese words.",
          [
            { text: "Scan Now", onPress: handleScanBook },
            { text: "OK", style: "cancel" },
          ]
        );
      } else {
        // 直接进入文章页面
        setGeneratingArticle(false);
        navigation.navigate("Article", { article: response.data.article });
      }
    } catch (error) {
      setGeneratingArticle(false);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to generate article";
      Alert.alert("Oops!", errorMsg);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: ChildrenTheme.colors.background }]}>
        <ActivityIndicator size="large" color={ChildrenTheme.colors.primary} />
        <Text style={[styles.loadingText, ChildrenTheme.typography.body]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: ChildrenTheme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={ChildrenTheme.colors.primary} />
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: ChildrenTheme.colors.primary }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.welcomeIcon}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.welcomeText}>Hello, {user?.username || "friend"}!</Text>
            <Text style={styles.welcomeSubtext}>Let's learn Chinese today!</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <IconButton
            icon="camera"
            size={32}
            iconColor={ChildrenTheme.colors.textInverse}
            onPress={handleScanBook}
            style={styles.cameraButton}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        {/* Learning Plan Info - 儿童友好版本 */}
        {learningPlan && (
          <View style={styles.planInfo}>
            <View style={styles.planHeader}>
              <Text style={styles.planEmoji}>📚</Text>
              <Text style={styles.planTitle}>My Learning Plan</Text>
            </View>
            <View style={styles.planContent}>
              <View style={styles.planRow}>
                <Text style={styles.planLabel}>📖 Level:</Text>
                <Text style={styles.planValue}>
                  {learningPlan.difficulty === "beginner" && "🌟 Beginner"}
                  {learningPlan.difficulty === "intermediate" && "⭐ Intermediate"}
                  {learningPlan.difficulty === "advanced" && "✨ Advanced"}
                </Text>
              </View>
              <View style={styles.planRow}>
                <Text style={styles.planLabel}>🎯 Daily Goal:</Text>
                <Text style={styles.planValue}>
                  {learningPlan.dailyWordGoal} characters
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 使用 ProgressCard 组件替换统计卡片 */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate("WordsList", { filter: "all" })}
            activeOpacity={0.7}
          >
            <ProgressCard
              emoji="📝"
              label="Total Words"
              current={stats?.total || 0}
              total={learningPlan?.monthlyWordGoal || 200}
              color={ChildrenTheme.colors.primary}
              showPercentage={false}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("WordsList", { filter: "known" })}
            activeOpacity={0.7}
          >
            <ProgressCard
              emoji="✅"
              label="Mastered"
              current={stats?.known || 0}
              total={stats?.total || 1}
              color={ChildrenTheme.colors.success}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("WordsList", { filter: "unknown" })}
            activeOpacity={0.7}
          >
            <ProgressCard
              emoji="📖"
              label="To Learn"
              current={stats?.unknown || 0}
              total={stats?.total || 1}
              color={ChildrenTheme.colors.warning}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("WordsList", { filter: "unknown" })}
            activeOpacity={0.7}
          >
            <ProgressCard
              emoji="⭐"
              label="Today"
              current={stats?.todayLearned || 0}
              total={learningPlan?.dailyWordGoal || 10}
              color={ChildrenTheme.colors.accent}
            />
          </TouchableOpacity>
        </View>

        {/* 生成文章时的加载overlay */}
        <Modal
          transparent={true}
          visible={processingImage}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalEmoji}>🔍</Text>
              <ActivityIndicator size="large" color={ChildrenTheme.colors.primary} style={styles.modalLoader} />
              <Text style={styles.modalTitle}>Extracting Characters...</Text>
              <Text style={styles.modalSubtitle}>
                Please wait while we extract Chinese characters from the image
              </Text>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("WordsList", { filter: "all" })}
          activeOpacity={0.7}
        >
          <IconButton
            icon="book-open-variant"
            size={28}
            iconColor={ChildrenTheme.colors.primary}
          />
          <Text style={styles.navLabel}>Words</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            // Navigate immediately to Article screen, it will handle generation
            navigation.navigate("Article");
          }}
          activeOpacity={0.7}
        >
          <IconButton
            icon="book-open-page-variant"
            size={28}
            iconColor={ChildrenTheme.colors.secondary}
          />
          <Text style={styles.navLabel}>Reading</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("LearningPlan")}
          activeOpacity={0.7}
        >
          <IconButton
            icon="calendar-check"
            size={28}
            iconColor={ChildrenTheme.colors.accent}
          />
          <Text style={styles.navLabel}>Plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Profile")}
          activeOpacity={0.7}
        >
          <IconButton
            icon="account"
            size={28}
            iconColor={ChildrenTheme.colors.tertiary}
          />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

      {showWordsConfirm && (
        <Modal
          visible={showWordsConfirm}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCancelAddWords}
        >
          <View style={[styles.confirmOverlay, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity
              style={styles.confirmOverlayBackdrop}
              activeOpacity={1}
              onPress={handleCancelAddWords}
            />
            <Card style={styles.confirmContainer} mode="elevated" elevation={8}>
              <Card.Content style={styles.confirmHeaderContent}>
                <View style={styles.confirmHeader}>
                  <PaperText variant="headlineSmall" style={styles.confirmTitle}>
                    Confirm Words to Add
                  </PaperText>
                  <IconButton
                    icon="close"
                    size={24}
                    iconColor={ChildrenTheme.colors.text}
                    onPress={handleCancelAddWords}
                    style={styles.closeButton}
                  />
                </View>
              </Card.Content>

              <ScrollView
                style={styles.confirmContent}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                {extractedWords.length === 0 && knownWords.length > 0 && (
                  <Surface style={styles.infoBanner} elevation={0}>
                    <PaperText variant="titleMedium" style={styles.infoBannerTitle}>
                      All Words Known 🎉
                    </PaperText>
                    <PaperText variant="bodyMedium" style={styles.infoBannerText}>
                      Every character we found in this photo is already in your
                      vocabulary list.
                    </PaperText>
                  </Surface>
                )}

                {scannedImage && (
                  <Surface style={styles.imagePreview} elevation={1}>
                    <Image
                      source={{ uri: scannedImage }}
                      style={styles.previewImage}
                    />
                  </Surface>
                )}

                {extractedWords.length > 0 && (
                  <>
                    <PaperText variant="titleMedium" style={styles.sectionTitle}>
                      🆕 New Words ({selectedWords.length}/{extractedWords.length}{" "}
                      selected)
                    </PaperText>
                    <PaperText variant="bodySmall" style={styles.confirmHint}>
                      Tap to select words you want to add
                    </PaperText>
                  <View
                    style={[styles.wordGridContainer, { height: gridHeight }]}
                    onLayout={handleWordGridLayout}
                  >
                    {extractedWords.map((item) => {
                      if (!wordAnimationsRef.current[item.id]) {
                        wordAnimationsRef.current[item.id] = {
                          position: new Animated.ValueXY(
                            getGridPosition(
                              item.originalIndex,
                              Math.max(columns, 1)
                            )
                          ),
                          progress: new Animated.Value(0),
                        };
                      }
                      const animBundle = wordAnimationsRef.current[item.id];
                      const animatedStyle = {
                        transform: [
                          { translateX: animBundle.position.x },
                          { translateY: animBundle.position.y },
                          {
                            scale: animBundle.progress.interpolate({
                              inputRange: [0, 0.35, 0.7, 1],
                              outputRange: [
                                WORD_ANIMATION_SCALE_VARIATION.base,
                                WORD_ANIMATION_SCALE_VARIATION.mid,
                                WORD_ANIMATION_SCALE_VARIATION.min,
                                WORD_ANIMATION_SCALE_VARIATION.base,
                              ],
                              extrapolate: "clamp",
                            }),
                          },
                        ],
                      };
                      const isSelected = selectedWords.includes(item.word);
                      return (
                        <Animated.View
                          key={item.id}
                          style={[styles.wordChipAnimated, animatedStyle]}
                        >
                          <TouchableOpacity
                            style={[
                              styles.wordChip,
                              isSelected
                                ? styles.wordChipSelected
                                : styles.wordChipUnselected,
                            ]}
                            onPress={() => toggleWordSelection(item.word)}
                          >
                            <Text
                              style={[
                                styles.wordChipPinyin,
                                !isSelected && styles.wordChipTextUnselected,
                              ]}
                            >
                              {item.pinyin}
                            </Text>
                            <Text
                              style={[
                                styles.wordChipText,
                                !isSelected && styles.wordChipTextUnselected,
                              ]}
                            >
                              {item.word}
                            </Text>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    })}
                  </View>
                </>
              )}

                {knownWords.length > 0 && (
                  <>
                    <PaperText variant="titleMedium" style={styles.sectionTitleKnown}>
                      ✓ Already Learned ({knownWords.length})
                    </PaperText>
                    <PaperText variant="bodySmall" style={styles.confirmHint}>
                      These words are already in your vocabulary
                    </PaperText>
                  <View style={styles.wordChipsContainer}>
                    {knownWords.map((item, index) => (
                      <View key={`known-${index}`} style={styles.wordChipKnown}>
                        <Text style={styles.wordChipPinyinKnown}>
                          {item.pinyin}
                        </Text>
                        <Text style={styles.wordChipTextKnown}>
                          ✓ {item.word}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              </ScrollView>

              <Card.Actions style={styles.confirmActions}>
                <Button
                  mode="outlined"
                  onPress={handleCancelAddWords}
                  style={styles.cancelButton}
                  textColor={ChildrenTheme.colors.textLight}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleConfirmAddWords}
                  disabled={selectedWords.length === 0}
                  style={styles.addButton}
                  buttonColor={ChildrenTheme.colors.success}
                  icon="plus"
                >
                  Add {selectedWords.length} Words
                </Button>
              </Card.Actions>
            </Card>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildrenTheme.colors.background,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: ChildrenTheme.colors.background,
  },
  loadingText: {
    marginTop: ChildrenTheme.spacing.md,
    color: ChildrenTheme.colors.textLight,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: ChildrenTheme.spacing.lg,
    backgroundColor: ChildrenTheme.colors.primary,
    ...ChildrenTheme.shadows.medium,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  welcomeIcon: {
    width: 60,
    height: 60,
    marginRight: ChildrenTheme.spacing.sm,
    borderRadius: ChildrenTheme.borderRadius.medium,
    overflow: "hidden",
  },
  welcomeText: {
    ...ChildrenTheme.typography.h3,
    color: ChildrenTheme.colors.textInverse,
    marginBottom: 4,
  },
  welcomeSubtext: {
    ...ChildrenTheme.typography.bodySmall,
    color: ChildrenTheme.colors.textInverse,
    opacity: 0.9,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  cameraButton: {
    margin: 0,
    backgroundColor: ChildrenTheme.colors.accent,
    borderRadius: 28,
    width: 56,
    height: 56,
  },
  planInfo: {
    backgroundColor: ChildrenTheme.colors.card,
    margin: ChildrenTheme.spacing.md,
    padding: ChildrenTheme.spacing.lg,
    borderRadius: ChildrenTheme.borderRadius.large,
    ...ChildrenTheme.shadows.medium,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: ChildrenTheme.spacing.md,
  },
  planEmoji: {
    fontSize: 28,
    marginRight: ChildrenTheme.spacing.sm,
  },
  planTitle: {
    ...ChildrenTheme.typography.h3,
    color: ChildrenTheme.colors.text,
  },
  planContent: {
    marginTop: ChildrenTheme.spacing.sm,
  },
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: ChildrenTheme.spacing.sm,
    paddingVertical: ChildrenTheme.spacing.xs,
  },
  planLabel: {
    ...ChildrenTheme.typography.body,
    color: ChildrenTheme.colors.textLight,
  },
  planValue: {
    ...ChildrenTheme.typography.body,
    fontWeight: "600",
    color: ChildrenTheme.colors.primary,
  },
  statsContainer: {
    padding: ChildrenTheme.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: ChildrenTheme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: ChildrenTheme.colors.card,
    padding: ChildrenTheme.spacing.xl,
    borderRadius: ChildrenTheme.borderRadius.xlarge,
    alignItems: "center",
    width: "80%",
    ...ChildrenTheme.shadows.large,
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: ChildrenTheme.spacing.md,
  },
  modalLoader: {
    marginVertical: ChildrenTheme.spacing.md,
  },
  modalTitle: {
    ...ChildrenTheme.typography.h3,
    color: ChildrenTheme.colors.text,
    marginTop: ChildrenTheme.spacing.sm,
    marginBottom: ChildrenTheme.spacing.sm,
  },
  modalSubtitle: {
    ...ChildrenTheme.typography.bodySmall,
    color: ChildrenTheme.colors.textLight,
    textAlign: "center",
    lineHeight: 22,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: ChildrenTheme.colors.card,
    borderTopWidth: 1,
    borderTopColor: ChildrenTheme.colors.border,
    paddingTop: ChildrenTheme.spacing.xs,
    paddingHorizontal: ChildrenTheme.spacing.xs,
    ...ChildrenTheme.shadows.medium,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: ChildrenTheme.spacing.xs,
    minHeight: 64,
  },
  navLabel: {
    ...ChildrenTheme.typography.caption,
    color: ChildrenTheme.colors.textLight,
    marginTop: -4,
    fontSize: 11,
    fontWeight: "500",
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: ChildrenTheme.spacing.lg,
    paddingBottom: ChildrenTheme.spacing.xl,
  },
  confirmOverlayBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confirmContainer: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    backgroundColor: ChildrenTheme.colors.card,
    borderRadius: ChildrenTheme.borderRadius.xlarge,
    overflow: "hidden",
  },
  confirmHeaderContent: {
    padding: ChildrenTheme.spacing.md,
    paddingBottom: ChildrenTheme.spacing.sm,
  },
  confirmHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  confirmTitle: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  confirmContent: {
    paddingHorizontal: ChildrenTheme.spacing.md,
    paddingVertical: ChildrenTheme.spacing.md,
  },
  imagePreview: {
    backgroundColor: ChildrenTheme.colors.background,
    borderRadius: ChildrenTheme.borderRadius.medium,
    padding: ChildrenTheme.spacing.sm,
    marginBottom: ChildrenTheme.spacing.md,
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: ChildrenTheme.borderRadius.small,
    resizeMode: "contain",
  },
  sectionTitle: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    marginTop: ChildrenTheme.spacing.sm,
    marginBottom: ChildrenTheme.spacing.xs,
  },
  sectionTitleKnown: {
    color: ChildrenTheme.colors.success,
    fontWeight: "bold",
    marginTop: ChildrenTheme.spacing.md,
    marginBottom: ChildrenTheme.spacing.xs,
  },
  confirmHint: {
    color: ChildrenTheme.colors.textLight,
    marginBottom: ChildrenTheme.spacing.md,
  },
  wordChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  wordGridContainer: {
    position: "relative",
    width: "100%",
    minHeight: WORD_CELL_SIZE + WORD_CELL_MARGIN,
    marginBottom: 24,
  },
  wordChipAnimated: {
    position: "absolute",
  },
  wordChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    margin: 4,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
    position: "relative",
  },
  wordChipSelected: {
    backgroundColor: ChildrenTheme.colors.primary + "20",
    borderWidth: 2,
    borderColor: ChildrenTheme.colors.primary,
  },
  wordChipUnselected: {
    backgroundColor: ChildrenTheme.colors.background,
    borderWidth: 2,
    borderColor: ChildrenTheme.colors.border,
    opacity: 0.6,
  },
  wordChipPinyin: {
    fontSize: 11,
    color: ChildrenTheme.colors.primary,
    marginBottom: 2,
  },
  wordChipText: {
    fontSize: 22,
    fontWeight: "bold",
    color: ChildrenTheme.colors.text,
  },
  wordChipTextUnselected: {
    color: ChildrenTheme.colors.textLight,
  },
  wordChipKnown: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: ChildrenTheme.borderRadius.medium,
    margin: 4,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
    backgroundColor: ChildrenTheme.colors.success + "20",
    borderWidth: 2,
    borderColor: ChildrenTheme.colors.success,
  },
  wordChipPinyinKnown: {
    fontSize: 11,
    color: ChildrenTheme.colors.success,
    marginBottom: 2,
  },
  wordChipTextKnown: {
    fontSize: 22,
    fontWeight: "bold",
    color: ChildrenTheme.colors.success,
  },
  confirmActions: {
    flexDirection: "row",
    padding: ChildrenTheme.spacing.md,
    gap: ChildrenTheme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
  },
  addButton: {
    flex: 1,
  },
  infoBanner: {
    backgroundColor: ChildrenTheme.colors.success + "20",
    padding: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.medium,
    marginBottom: ChildrenTheme.spacing.md,
    alignItems: "center",
  },
  infoBannerTitle: {
    color: ChildrenTheme.colors.success,
    fontWeight: "bold",
    marginBottom: ChildrenTheme.spacing.xs,
  },
  infoBannerText: {
    color: ChildrenTheme.colors.success,
    textAlign: "center",
  },
});
