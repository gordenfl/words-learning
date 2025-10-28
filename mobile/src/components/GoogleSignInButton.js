import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Config from "../../config";
import { authAPI } from "../services/api";

export default function GoogleSignInButton({ onSignInSuccess, onSignInError }) {
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);

  console.log("🔗 Using Native Google Sign-In");
  console.log("   Environment:", Config.ENVIRONMENT);
  console.log("   iOS Client ID:", Config.GOOGLE_OAUTH?.IOS_CLIENT_ID);
  console.log("   Android Client ID:", Config.GOOGLE_OAUTH?.ANDROID_CLIENT_ID);

  const handleGoogleSignIn = async () => {
    if (!isConfigured) {
      Alert.alert("错误", "Google Sign-In 未正确配置");
      return;
    }

    setLoading(true);

    try {
      // 检查配置是否已更新
      const iosClientId = Config.GOOGLE_OAUTH?.IOS_CLIENT_ID;
      const androidClientId = Config.GOOGLE_OAUTH?.ANDROID_CLIENT_ID;

      if (
        !iosClientId ||
        !androidClientId ||
        iosClientId.includes("xxxxxx") ||
        androidClientId.includes("xxxxxx")
      ) {
        Alert.alert(
          "配置未完成",
          "请先在 Google Cloud Console 中创建 iOS 和 Android OAuth 客户端，然后更新配置文件中的 CLIENT_ID。"
        );
        setLoading(false);
        return;
      }

      // 使用原生Google Sign-In SDK
      console.log("🔄 Using Native Google Sign-In SDK...");
      console.log("   iOS Client ID:", iosClientId);
      console.log("   Android Client ID:", androidClientId);

      // 这里应该使用 @react-native-google-signin/google-signin
      // 但由于当前使用Expo Go，暂时显示配置信息
      Alert.alert(
        "原生SDK需要",
        "要使用原生Google Sign-In SDK，需要:\n\n1. 创建开发构建 (expo build)\n2. 或使用 EAS Build\n3. 或切换到裸React Native项目\n\n当前配置已就绪，但需要原生构建才能使用。"
      );

      setLoading(false);
      onSignInError && onSignInError(new Error("需要原生构建"));
    } catch (error) {
      console.error("❌ Google Sign-In error:", error);
      let errorMessage = "Google登录失败，请重试";
      if (error.message) {
        errorMessage = `错误: ${error.message}`;
      }
      Alert.alert("Google登录失败", errorMessage);
      onSignInError && onSignInError(error);
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: "#4285F4",
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: "center",
          justifyContent: "center",
          marginVertical: 8,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
        },
        loading && {
          backgroundColor: "#CCCCCC",
          opacity: 0.6,
        },
      ]}
      onPress={handleGoogleSignIn}
      disabled={loading || !isConfigured}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              G
            </Text>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "600",
                marginLeft: 8,
              }}
            >
              使用 Google 登录 (原生SDK)
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}
