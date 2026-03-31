import React, { useMemo } from "react";
import { View, StyleSheet, Image, Text, ActivityIndicator, Dimensions } from "react-native";
import ChildrenTheme from "../theme/childrenTheme";
import { useThemeContext } from "../context/ThemeContext";

export default function LoadingScreen() {
  const { currentTheme } = useThemeContext();
  const dynamicTheme = currentTheme;
  
  // 获取屏幕尺寸
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // 根据屏幕尺寸计算图标大小
  // 小屏设备（如 iPhone SE）: 120x120
  // 中等设备（如 iPhone 12/13）: 150x150
  // 大屏设备（如 iPhone Pro Max）: 180x180
  // iPad: 200x200
  const getIconSize = () => {
    const minDimension = Math.min(screenWidth, screenHeight);
    if (minDimension < 400) {
      // 小屏设备
      return 120;
    } else if (minDimension < 500) {
      // 中等设备
      return 150;
    } else if (minDimension < 800) {
      // 大屏手机
      return 180;
    } else {
      // iPad
      return 200;
    }
  };
  
  const iconSize = getIconSize();

  // Create dynamic styles
  const styles = useMemo(() => createStyles(dynamicTheme, iconSize), [dynamicTheme, iconSize]);

  return (
    <View style={styles.loadingContainer}>
      <Image
        source={require("../../assets/icon.png")}
        style={styles.loadingLogo}
        resizeMode="contain"
      />
      <Text style={styles.loadingTitle}>
        Words Learning
      </Text>
      <Text style={styles.loadingSubtitle}>
        Learning Chinese Characters
      </Text>
      <ActivityIndicator
        size="large"
        color={dynamicTheme.colors.primary}
        style={styles.loadingSpinner}
      />
    </View>
  );
}

// Create dynamic styles based on theme
const createStyles = (theme, iconSize) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    padding: ChildrenTheme.spacing.xl,
  },
  loadingLogo: {
    width: iconSize,
    height: iconSize,
    marginBottom: ChildrenTheme.spacing.lg,
    borderRadius: ChildrenTheme.borderRadius.large,
    overflow: "hidden",
  },
  loadingTitle: {
    fontSize: 28,
    color: theme.colors.primary,
    fontWeight: "bold",
    marginBottom: ChildrenTheme.spacing.sm,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginBottom: ChildrenTheme.spacing.xl,
  },
  loadingSpinner: {
    marginTop: ChildrenTheme.spacing.md,
  },
});

