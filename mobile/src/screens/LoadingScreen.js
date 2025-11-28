import React, { useMemo } from "react";
import { View, StyleSheet, Image, Text, ActivityIndicator } from "react-native";
import ChildrenTheme from "../theme/childrenTheme";
import { useThemeContext } from "../context/ThemeContext";

export default function LoadingScreen() {
  const { currentTheme } = useThemeContext();
  const dynamicTheme = currentTheme;

  // Create dynamic styles
  const styles = useMemo(() => createStyles(dynamicTheme), [dynamicTheme]);

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
const createStyles = (theme) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    padding: ChildrenTheme.spacing.xl,
  },
  loadingLogo: {
    width: 150,
    height: 150,
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

