import React, { useState, useEffect, useMemo } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PaperProvider } from "react-native-paper";
import { createPaperTheme } from "./src/theme/paperTheme";
import { ThemeProvider, useThemeContext } from "./src/context/ThemeContext";
// 配置 Paper 使用 Expo 图标库
import "./src/config/paperIcons";

// Import screens
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import WordsListScreen from "./src/screens/WordsListScreen";
import ArticleScreen from "./src/screens/ArticleScreen";
import ArticleListScreen from "./src/screens/ArticleListScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import LearningPlanScreen from "./src/screens/LearningPlanScreen";
import WordDetailScreen from "./src/screens/WordDetailScreen";
import WordWritingScreen from "./src/screens/WordWritingScreen";
import CompoundPracticeScreen from "./src/screens/CompoundPracticeScreen";
import SentencePracticeScreen from "./src/screens/SentencePracticeScreen";
import ImageViewScreen from "./src/screens/ImageViewScreen";
import LoadingScreen from "./src/screens/LoadingScreen";
import ErrorBoundary from "./src/components/ErrorBoundary";

const Stack = createStackNavigator();

function AppContent() {
  const { currentTheme } = useThemeContext();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // 根据当前主题创建 Paper 主题（使用 useMemo 确保主题变化时重新计算）
  // 添加安全检查，确保 currentTheme 存在
  const paperTheme = useMemo(() => {
    if (!currentTheme) {
      // 如果 currentTheme 未定义，使用默认主题
      const { defaultTheme } = require("./src/theme/themeVariants");
      return createPaperTheme(defaultTheme);
    }
    return createPaperTheme(currentTheme);
  }, [currentTheme]);
  
  // 导航选项（响应主题变化）
  const screenOptions = useMemo(() => ({
    headerStyle: {
      backgroundColor: paperTheme.colors.primary,
    },
    headerTintColor: paperTheme.colors.onPrimary,
    headerTitleStyle: {
      fontWeight: "bold",
      fontSize: 20,
    },
  }), [paperTheme]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Add minimum display time for loading screen (1 second)
      const [tokenResult] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        new Promise((resolve) => setTimeout(resolve, 1000)), // Minimum 1 second
      ]);
      setIsAuthenticated(!!tokenResult);
    } catch (error) {
      console.error("Error checking auth status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={isAuthenticated ? "Home" : "Login"}
          screenOptions={screenOptions}
        >
        {/* Auth Screens */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: "Create Account" }}
        />
        <Stack.Screen
          name="LoadingPreview"
          component={LoadingScreen}
          options={{ headerShown: false }}
        />

        {/* Main App Screens */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="WordsList"
          component={WordsListScreen}
          options={{ title: "My Words" }}
        />
        <Stack.Screen
          name="ArticleList"
          component={ArticleListScreen}
          options={{ title: "Reading" }}
        />
        <Stack.Screen
          name="Article"
          component={ArticleScreen}
          options={{ title: "Read Article" }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "Profile" }}
        />
        <Stack.Screen
          name="LearningPlan"
          component={LearningPlanScreen}
          options={{ title: "Learning Plan" }}
        />
        <Stack.Screen
          name="WordDetail"
          component={WordDetailScreen}
          options={{ title: "Word Details" }}
        />
        <Stack.Screen
          name="WordWriting"
          component={WordWritingScreen}
          options={{ title: "Writing Practice" }}
        />
        <Stack.Screen
          name="CompoundPractice"
          component={CompoundPracticeScreen}
          options={{ title: "Compound Practice" }}
        />
        <Stack.Screen
          name="SentencePractice"
          component={SentencePracticeScreen}
          options={{ title: "Sentence Practice" }}
        />
        <Stack.Screen
          name="ImageView"
          component={ImageViewScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
