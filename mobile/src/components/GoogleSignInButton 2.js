import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Config from "../../config";
import { authAPI } from "../services/api";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

export default function GoogleSignInButton({ onSignInSuccess, onSignInError }) {
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    // 配置Google Sign-In
    const configureGoogleSignIn = async () => {
      try {
        const iosClientId = Config.GOOGLE_OAUTH?.IOS_CLIENT_ID;
        const androidClientId = Config.GOOGLE_OAUTH?.ANDROID_CLIENT_ID;

        if (!iosClientId || !androidClientId) {
          console.error("❌ Google OAuth Client IDs not configured");
          setIsConfigured(false);
          return;
        }

        await GoogleSignin.configure({
          webClientId: iosClientId, // iOS使用iOS Client ID
          iosClientId: iosClientId,
          offlineAccess: true,
          hostedDomain: "",
          forceCodeForRefreshToken: true,
        });

        console.log("✅ Google Sign-In configured successfully");
        console.log("   iOS Client ID:", iosClientId);
        console.log("   Android Client ID:", androidClientId);
        console.log("   Platform:", Platform.OS);
      } catch (error) {
        console.error("❌ Google Sign-In configuration error:", error);
        setIsConfigured(false);
      }
    };

    configureGoogleSignIn();
  }, []);

  const handleGoogleSignIn = async () => {
    if (!isConfigured) {
      Alert.alert("错误", "Google Sign-In 未正确配置");
      return;
    }

    setLoading(true);

    try {
      console.log("🔄 Starting Google Sign-In...");

      // 检查是否已经登录
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      console.log("✅ Google Sign-In successful:", userInfo);

      // 发送用户信息到后端
      const response = await authAPI.googleSignIn(userInfo.user);

      console.log("🔍 Backend response:", response.data);

      // 保存认证信息
      await AsyncStorage.setItem("authToken", response.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
      await AsyncStorage.setItem("authProvider", "google");

      console.log("✅ Google Sign-In completed successfully");
      onSignInSuccess && onSignInSuccess(response.data);
    } catch (error) {
      console.error("❌ Google Sign-In error:", error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("❌ User cancelled Google Sign-In");
        // 用户取消登录，不显示错误
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("❌ Google Sign-In already in progress");
        Alert.alert("Google登录", "登录正在进行中，请稍候...");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log("❌ Play Services not available");
        Alert.alert("Google登录失败", "Google Play服务不可用");
      } else {
        console.log("❌ Unknown Google Sign-In error:", error);
        Alert.alert("Google登录失败", `错误: ${error.message || "未知错误"}`);
        onSignInError && onSignInError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await GoogleSignin.signOut();
      console.log("✅ Google Sign-Out successful");
    } catch (error) {
      console.error("❌ Google Sign-Out error:", error);
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
              使用 Google 登录
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}
