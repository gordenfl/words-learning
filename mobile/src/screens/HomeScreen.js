import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  IconButton,
  useTheme,
  Text as PaperText,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { wordsAPI, articlesAPI, usersAPI, authAPI } from "../services/api";
// 引入儿童友好主题和组件
import ChildrenTheme from "../theme/childrenTheme";
import { useThemeContext } from "../context/ThemeContext";
import ProgressCard from "../components/children/ProgressCard";

export default function HomeScreen({ navigation, route }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useThemeContext();
  // 使用动态主题
  const dynamicTheme = currentTheme;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingArticle, setGeneratingArticle] = useState(false);
  const [user, setUser] = useState(null);
  const [learningPlan, setLearningPlan] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // 每次屏幕获得焦点时，加载数据
      if (__DEV__) {
        console.log("🔄 Screen focused, loading data");
      }
      loadData();
    });
    
    return () => {
      unsubscribe();
    };
  }, [navigation]);

  const loadData = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const newUser = userStr ? JSON.parse(userStr) : null;
      
      // 从服务器获取完整的用户信息（包含 profile）
      try {
        const profileResponse = await authAPI.getProfile();
        const fullUser = profileResponse.data.user;
        if (fullUser) {
          setUser(fullUser);
          // 更新 AsyncStorage 中的用户信息
          await AsyncStorage.setItem("user", JSON.stringify(fullUser));
        } else if (newUser) {
          setUser(newUser);
        } else {
          setUser(null);
        }
      } catch (profileError) {
        // 如果获取 profile 失败，使用本地存储的用户信息
        if (newUser) {
          setUser(newUser);
        } else {
          setUser(null);
        }
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
    } finally {
      setLoading(false);
    }
  };

  const processImage = async (imageUri) => {
    // 导航到全屏照片显示界面
    if (__DEV__) {
      console.log("🎯 processImage: Navigating to ImageViewScreen");
    }
    navigation.navigate("ImageView", { imageUri });
  };

  // 处理从 CameraScreen 传递过来的照片（不处理文字）
  useEffect(() => {
    if (route.params?.scannedImage) {
      if (__DEV__) {
        console.log("📥 Received image from CameraScreen");
      }

      // 从 CameraScreen 传递过来的照片
      const { scannedImage: imageUri } = route.params;
      
      // 导航到全屏照片显示界面
      navigation.navigate("ImageView", { imageUri });

      // 清除路由参数，避免重复处理
      navigation.setParams({
        scannedImage: null,
        extractedWords: null,
        knownWords: null,
      });
    }
  }, [route.params?.scannedImage, navigation]);


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
        allowsEditing: true,
        aspect: [1, 1],
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
        allowsEditing: true,
        aspect: [1, 1],
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
    <View style={[styles.container, { backgroundColor: dynamicTheme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={dynamicTheme.colors.primary} />
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: dynamicTheme.colors.primary }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.welcomeIcon}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.welcomeText}>
              Hello, {user?.profile?.displayName || user?.username || "friend"}!
            </Text>
            <Text style={styles.welcomeSubtext}>Let's learn Chinese today!</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <IconButton
            icon="camera"
            size={32}
            iconColor={dynamicTheme.colors.textInverse}
            onPress={handleScanBook}
            style={styles.cameraButton}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        {/* Learning Plan Info */}
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

        {/* Stats Cards */}
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
            navigation.navigate("ArticleList");
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
});
