import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { wordsAPI, articlesAPI, usersAPI, ocrAPI } from "../services/api";
import cnchar from "cnchar";
import order from "cnchar-order";

// 初始化 cnchar 笔画插件
cnchar.use(order);

export default function HomeScreen({ navigation }) {
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
  const [confirmModalSession, setConfirmModalSession] = useState(0);
  const [user, setUser] = useState(null);
  const [learningPlan, setLearningPlan] = useState(null);

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

      const normalizedNewWords = sortByStrokeCount(normalizeWordList(newWords));
      const normalizedKnownWords = sortByStrokeCount(normalizeWordList(known));

      if (__DEV__) {
        console.log(
          "New words:",
          normalizedNewWords.map((w) => w.word)
        );
        console.log(
          "Known words:",
          normalizedKnownWords.map((w) => w.word)
        );
      }

      if (
        normalizedNewWords.length === 0 &&
        normalizedKnownWords.length === 0
      ) {
        Alert.alert(
          "No Words Found",
          "No Chinese characters detected in the image."
        );
        return;
      }

      // 显示确认界面
      setScannedImage(imageUri);
      setExtractedWords(normalizedNewWords); // 按笔画排序
      setKnownWords(normalizedKnownWords); // 已学单词也排序
      setSelectedWords([]); // 默认不选中，让用户自己选择
      setShowWordsConfirm(false);
      requestAnimationFrame(() => {
        setConfirmModalSession((prev) => prev + 1);
        setShowWordsConfirm(true);
      });
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

  function normalizeWordList(list) {
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
  }

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.welcomeText}>Welcome back, {user?.username}!</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleScanBook}
            style={styles.cameraButton}
          >
            <Text style={styles.cameraIcon}>📸</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile")}
            style={styles.avatarButton}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Learning Plan Info */}
        {learningPlan && (
          <View style={styles.planInfo}>
            <Text style={styles.planTitle}>📚 Chinese Learning Plan</Text>
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Level:</Text>
              <Text style={styles.planValue}>
                {learningPlan.difficulty === "beginner" && "初级 Beginner"}
                {learningPlan.difficulty === "intermediate" &&
                  "中级 Intermediate"}
                {learningPlan.difficulty === "advanced" && "高级 Advanced"}
              </Text>
            </View>
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Daily Goal:</Text>
              <Text style={styles.planValue}>
                {learningPlan.dailyWordGoal} words/day
              </Text>
            </View>
          </View>
        )}

        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate("WordsList", { filter: "all" })}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{stats?.total || 0}</Text>
            <Text style={styles.statLabel}>Total Words</Text>
            {learningPlan && (
              <Text style={styles.statGoal}>
                Goal: {learningPlan.monthlyWordGoal}/month
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() =>
              navigation.navigate("WordsList", { filter: "known" })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{stats?.known || 0}</Text>
            <Text style={styles.statLabel}>Known</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() =>
              navigation.navigate("WordsList", { filter: "unknown" })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{stats?.unknown || 0}</Text>
            <Text style={styles.statLabel}>To Learn</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() =>
              navigation.navigate("WordsList", { filter: "unknown" })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{stats?.todayLearned || 0}</Text>
            <Text style={styles.statLabel}>Today</Text>
            {learningPlan && (
              <Text style={styles.statGoal}>
                Goal: {learningPlan.dailyWordGoal}/day
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryButton,
              generatingArticle && styles.disabledButton,
            ]}
            onPress={handleGenerateArticle}
            disabled={generatingArticle}
          >
            <Text style={styles.actionButtonText}>📝 Generate Article</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate("LearningPlan")}
          >
            <Text style={styles.actionButtonText}>🎯 Learning Plan</Text>
          </TouchableOpacity>
        </View>

        {/* 生成文章时的加载overlay */}
        <Modal
          transparent={true}
          visible={generatingArticle}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ActivityIndicator size="large" color="#4A90E2" />
              <Text style={styles.modalTitle}>Generating Article...</Text>
              <Text style={styles.modalSubtitle}>
                AI is creating your personalized Chinese story
              </Text>
            </View>
          </View>
        </Modal>

        {/* 图片识别时的加载overlay */}
        <Modal
          transparent={true}
          visible={processingImage}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ActivityIndicator size="large" color="#50C878" />
              <Text style={styles.modalTitle}>Extracting Text...</Text>
              <Text style={styles.modalSubtitle}>
                Recognizing Chinese characters from image
              </Text>
            </View>
          </View>
        </Modal>

        {/* 确认添加单词的界面 */}
        <Modal
          key={confirmModalSession}
          visible={showWordsConfirm}
          animationType="slide"
          onRequestClose={handleCancelAddWords}
        >
          <View style={styles.confirmContainer}>
            <View style={styles.confirmHeader}>
              <Text style={styles.confirmTitle}>Confirm Words to Add</Text>
              <TouchableOpacity onPress={handleCancelAddWords}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.confirmContent}>
              {/* 显示扫描的图片 */}
              {scannedImage && (
                <View style={styles.imagePreview}>
                  <Image
                    source={{ uri: scannedImage }}
                    style={styles.previewImage}
                  />
                </View>
              )}

              {/* 新单词部分 */}
              {extractedWords.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>
                    🆕 New Words ({selectedWords.length}/{extractedWords.length}{" "}
                    selected)
                  </Text>
                  <Text style={styles.confirmHint}>
                    Tap to select words you want to add
                  </Text>
                  <View style={styles.wordChipsContainer}>
                    {extractedWords.map((item, index) => {
                      const isSelected = selectedWords.includes(item.word);
                      return (
                        <TouchableOpacity
                          key={`new-${index}`}
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
                      );
                    })}
                  </View>
                </>
              )}

              {/* 已学单词部分 */}
              {knownWords.length > 0 && (
                <>
                  <Text style={styles.sectionTitleKnown}>
                    ✓ Already Learned ({knownWords.length})
                  </Text>
                  <Text style={styles.confirmHint}>
                    These words are already in your vocabulary
                  </Text>
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

            {/* 底部按钮 */}
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={handleCancelAddWords}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.addButton]}
                onPress={handleConfirmAddWords}
                disabled={selectedWords.length === 0}
              >
                <Text style={styles.addButtonText}>
                  Add {selectedWords.length} Words
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#50C878",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  cameraIcon: {
    fontSize: 24,
  },
  avatarButton: {
    padding: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  planInfo: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  planLabel: {
    fontSize: 14,
    color: "#666",
  },
  planValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 20,
    margin: "1%",
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4A90E2",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  statGoal: {
    fontSize: 11,
    color: "#4A90E2",
    marginTop: 5,
    fontStyle: "italic",
  },
  actionsContainer: {
    padding: 20,
  },
  actionButton: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#4A90E2",
  },
  secondaryButton: {
    backgroundColor: "#50C878",
  },
  highlightButton: {
    backgroundColor: "#FF6B6B",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  confirmContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  confirmHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    fontSize: 28,
    color: "#999",
    fontWeight: "300",
  },
  confirmContent: {
    flex: 1,
    padding: 15,
  },
  imagePreview: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    resizeMode: "contain",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitleKnown: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#50C878",
    marginTop: 20,
    marginBottom: 8,
  },
  confirmHint: {
    fontSize: 13,
    color: "#666",
    marginBottom: 15,
  },
  wordChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
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
    backgroundColor: "#E3F2FD",
    borderWidth: 2,
    borderColor: "#4A90E2",
  },
  wordChipUnselected: {
    backgroundColor: "#f0f0f0",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    opacity: 0.6,
  },
  wordChipPinyin: {
    fontSize: 11,
    color: "#4A90E2",
    marginBottom: 2,
  },
  wordChipText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  wordChipTextUnselected: {
    color: "#999",
  },
  wordChipKnown: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    margin: 4,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
    backgroundColor: "#E0F8E0",
    borderWidth: 2,
    borderColor: "#50C878",
  },
  wordChipPinyinKnown: {
    fontSize: 11,
    color: "#50C878",
    marginBottom: 2,
  },
  wordChipTextKnown: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#50C878",
  },
  confirmActions: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  confirmButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#50C878",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
