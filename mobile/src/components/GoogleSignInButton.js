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
      console.log("🔍 UserInfo.user:", userInfo.user);
      console.log("🔍 UserInfo.user keys:", Object.keys(userInfo.user || {}));
      console.log("🔍 UserInfo.data:", userInfo.data);
      console.log("🔍 UserInfo.data keys:", Object.keys(userInfo.data || {}));
      console.log(
        "🔍 Full userInfo structure:",
        JSON.stringify(userInfo, null, 2)
      );

      // 检查是否是用户取消的情况
      if (userInfo.type === "cancelled" || userInfo.data === null) {
        console.log("❌ User cancelled Google Sign-In");
        return; // 直接返回，不显示错误
      }

      // 检查userInfo结构并提取正确的用户数据
      // Google Sign-In SDK返回的结构可能是 {type: "...", data: {...}} 或 {user: {...}}
      let userData = userInfo.user || userInfo.data || userInfo;

      // 如果userData仍然只有type和data字段，说明需要进一步提取
      if (userData && userData.type && userData.data) {
        userData = userData.data;
        console.log("🔍 Extracted from data field:", userData);
      }

      console.log("🔍 Final userData:", userData);
      console.log("🔍 userData keys:", Object.keys(userData || {}));
      console.log("🔍 userData values:", Object.values(userData || {}));

      // 确保数据格式正确 - 根据Google Sign-In SDK的实际返回结构
      const formattedUserData = {
        id:
          userData.id ||
          userData.user?.id ||
          userData.userId ||
          userData.user?.userId ||
          userData.sub || // Google OAuth sub field
          userData.user?.sub,
        email:
          userData.email ||
          userData.user?.email ||
          userData.emailAddress || // 可能的字段名
          userData.user?.emailAddress,
        name:
          userData.name ||
          userData.user?.name ||
          userData.givenName ||
          userData.user?.givenName ||
          userData.displayName ||
          userData.user?.displayName ||
          userData.fullName ||
          userData.user?.fullName,
        photo:
          userData.photo ||
          userData.user?.photo ||
          userData.picture ||
          userData.user?.picture ||
          userData.photoURL ||
          userData.user?.photoURL ||
          userData.imageURL ||
          userData.user?.imageURL,
      };

      console.log("🔍 Formatted userData:", formattedUserData);
      console.log(
        "🔍 Original userData structure:",
        JSON.stringify(userData, null, 2)
      );

      // 验证必需字段
      if (!formattedUserData.id || !formattedUserData.email) {
        console.error("❌ Missing required fields:");
        console.error("   id:", formattedUserData.id);
        console.error("   email:", formattedUserData.email);
        console.error(
          "   Original userData keys:",
          Object.keys(userData || {})
        );
        throw new Error(
          `Missing required user data: id (${formattedUserData.id}) or email (${formattedUserData.email})`
        );
      }

      // 发送用户信息到后端
      const response = await authAPI.googleSignIn(formattedUserData);

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
        // 用户取消登录，不显示错误，直接返回
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("❌ Google Sign-In already in progress");
        Alert.alert("Google登录", "登录正在进行中，请稍候...");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log("❌ Play Services not available");
        Alert.alert("Google登录失败", "Google Play服务不可用");
      } else if (
        error.message &&
        error.message.includes("Missing required user data")
      ) {
        console.log("❌ Data extraction error:", error.message);
        Alert.alert("Google登录失败", "无法获取用户信息，请重试");
        onSignInError && onSignInError(error);
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
