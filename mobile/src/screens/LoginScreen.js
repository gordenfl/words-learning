import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Card,
  Surface,
  Divider,
  useTheme,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../services/api";
import GoogleSignInButton from "../components/GoogleSignInButton";
import FacebookSignInButton from "../components/FacebookSignInButton";
import ChildrenTheme from "../theme/childrenTheme";

export default function LoginScreen({ navigation }) {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Notice", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      console.log("📝 Login response received");
      console.log("   Token exists:", !!response.data.token);
      console.log("   Token length:", response.data.token?.length);

      await AsyncStorage.setItem("authToken", response.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));

      // 验证 token 是否保存成功
      const savedToken = await AsyncStorage.getItem("authToken");
      console.log("✅ Token saved successfully:", !!savedToken);
      console.log(
        "   Saved token matches:",
        savedToken === response.data.token
      );

      // Navigate to Home
      navigation.navigate("Home");
    } catch (error) {
      console.log("❌ Login error:", error.message);
      console.log("   Error type:", error.name);
      console.log("   Response status:", error.response?.status);
      console.log("   Response data:", error.response?.data);

      let errorMessage = "Something went wrong";

      if (error.message === "Network Error" || error.code === "ECONNABORTED") {
        errorMessage = `Cannot connect to server. Please check:\n\n• Internet connection\n• Server: gordenfl.com:3003\n• Error: ${error.message}`;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else {
        errorMessage = `${error.message}\n\nServer: gordenfl.com:3003`;
      }

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInSuccess = (data) => {
    console.log("✅ Google Sign-In successful:", data);
    // Navigate to Home
    navigation.navigate("Home");
  };

  const handleGoogleSignInError = (error) => {
    console.log("❌ Google Sign-In error:", error);
    // Error handling is already done in GoogleSignInButton component
  };

  const handleFacebookSignInSuccess = (data) => {
    console.log("✅ Facebook Sign-In successful:", data);
    // Navigate to Home
    navigation.navigate("Home");
  };

  const handleFacebookSignInError = (error) => {
    console.log("❌ Facebook Sign-In error:", error);
    // Error handling is already done in FacebookSignInButton component
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Welcome Header */}
          <Surface style={styles.headerSurface} elevation={0}>
            <Image
              source={require("../../assets/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text variant="displaySmall" style={styles.title}>
              👋 Welcome Back!
            </Text>
            <Text variant="titleMedium" style={styles.subtitle}>
              Let's learn Chinese characters together!
            </Text>
          </Surface>

          {/* Login Card */}
          <Card style={styles.card} mode="elevated" elevation={2}>
            <Card.Content style={styles.cardContent}>
              <TextInput
                label="📧 Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                contentStyle={styles.inputContent}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="email" />}
              />

              <TextInput
                label="🔒 Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={styles.input}
                contentStyle={styles.inputContent}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                icon="login"
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </Card.Content>
          </Card>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text variant="bodyMedium" style={styles.dividerText}>
              or
            </Text>
            <Divider style={styles.divider} />
          </View>

          {/* Social Login Card */}
          <Card style={styles.socialCard} mode="outlined">
            <Card.Content style={styles.socialCardContent}>
              <Text variant="titleSmall" style={styles.socialTitle}>
                Sign in with
              </Text>
              <View style={styles.socialButtonsContainer}>
                <GoogleSignInButton
                  onSignInSuccess={handleGoogleSignInSuccess}
                  onSignInError={handleGoogleSignInError}
                />
                <FacebookSignInButton
                  onSignInSuccess={handleFacebookSignInSuccess}
                  onSignInError={handleFacebookSignInError}
                />
              </View>
            </Card.Content>
          </Card>

          {/* Register Link */}
          <Button
            mode="text"
            onPress={() => navigation.navigate("Register")}
            style={styles.registerButton}
            labelStyle={styles.registerButtonLabel}
            icon="account-plus"
          >
            Don't have an account? Sign up
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: ChildrenTheme.spacing.lg,
    paddingTop: ChildrenTheme.spacing.xl,
  },
  headerSurface: {
    backgroundColor: "transparent",
    padding: ChildrenTheme.spacing.lg,
    marginBottom: ChildrenTheme.spacing.xl,
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
    overflow: "hidden",
  },
  title: {
    textAlign: "center",
    marginBottom: ChildrenTheme.spacing.sm,
    color: ChildrenTheme.colors.primary,
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    color: ChildrenTheme.colors.textLight,
    marginTop: ChildrenTheme.spacing.xs,
  },
  card: {
    marginBottom: ChildrenTheme.spacing.lg,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  cardContent: {
    padding: ChildrenTheme.spacing.md,
  },
  input: {
    marginBottom: ChildrenTheme.spacing.md,
    fontSize: ChildrenTheme.typography.body.fontSize,
  },
  inputContent: {
    fontSize: ChildrenTheme.typography.body.fontSize,
  },
  loginButton: {
    marginTop: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.medium,
    ...ChildrenTheme.shadows.small,
  },
  buttonContent: {
    paddingVertical: ChildrenTheme.spacing.sm,
    minHeight: ChildrenTheme.button.large.height,
  },
  buttonLabel: {
    fontSize: ChildrenTheme.typography.h4.fontSize,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: ChildrenTheme.spacing.lg,
    paddingHorizontal: ChildrenTheme.spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: ChildrenTheme.spacing.md,
    color: ChildrenTheme.colors.textLight,
  },
  socialCard: {
    marginBottom: ChildrenTheme.spacing.lg,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  socialCardContent: {
    padding: ChildrenTheme.spacing.md,
  },
  socialTitle: {
    textAlign: "center",
    marginBottom: ChildrenTheme.spacing.md,
    color: ChildrenTheme.colors.text,
  },
  socialButtonsContainer: {
    gap: ChildrenTheme.spacing.sm,
  },
  registerButton: {
    marginTop: ChildrenTheme.spacing.sm,
  },
  registerButtonLabel: {
    fontSize: ChildrenTheme.typography.body.fontSize,
    color: ChildrenTheme.colors.primary,
  },
});
