import React from "react";
import { View, StyleSheet, Image, Text, ActivityIndicator } from "react-native";
import ChildrenTheme from "../theme/childrenTheme";

export default function LoadingScreen() {
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
        color={ChildrenTheme.colors.primary}
        style={styles.loadingSpinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: ChildrenTheme.colors.background,
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
    color: ChildrenTheme.colors.primary,
    fontWeight: "bold",
    marginBottom: ChildrenTheme.spacing.sm,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: ChildrenTheme.colors.textLight,
    marginBottom: ChildrenTheme.spacing.xl,
  },
  loadingSpinner: {
    marginTop: ChildrenTheme.spacing.md,
  },
});

