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
import { authAPI } from "../services/api";
import { isExpoGo } from "../utils/runtime";

let AppleAuthentication = null;

if (!isExpoGo && Platform.OS === "ios") {
  try {
    AppleAuthentication = require("expo-apple-authentication");
  } catch (error) {
    console.warn("⚠️ Failed to load Apple Authentication native module:", error?.message);
  }
}

export default function AppleSignInButton({ onSignInSuccess, onSignInError }) {
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      if (isExpoGo) {
        console.warn("⚠️ Apple Sign-In disabled in Expo Go runtime");
        setIsAvailable(false);
        return;
      }

      if (Platform.OS !== "ios") {
        console.warn("⚠️ Apple Sign-In only available on iOS");
        setIsAvailable(false);
        return;
      }

      if (!AppleAuthentication) {
        console.warn("⚠️ Apple Authentication native module unavailable");
        setIsAvailable(false);
        return;
      }

      try {
        const available = await AppleAuthentication.isAvailableAsync();
        setIsAvailable(available);
        if (available) {
          console.log("✅ Apple Sign-In is available");
        } else {
          console.warn("⚠️ Apple Sign-In is not available on this device");
        }
      } catch (error) {
        console.error("❌ Error checking Apple Sign-In availability:", error);
        setIsAvailable(false);
      }
    };

    checkAvailability();
  }, []);

  const handleAppleSignIn = async () => {
    if (!isAvailable) {
      Alert.alert("错误", "Apple Sign-In 不可用");
      return;
    }

    setLoading(true);

    try {
      console.log("🔄 Starting Apple Sign-In...");

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log("✅ Apple Sign-In successful:", credential);

      // 格式化用户数据
      const formattedUserData = {
        userId: credential.user,
        email: credential.email || null,
        fullName: credential.fullName
          ? {
              givenName: credential.fullName.givenName || null,
              familyName: credential.fullName.familyName || null,
            }
          : null,
        identityToken: credential.identityToken || null,
      };

      console.log("🔍 Formatted userData:", formattedUserData);

      // 验证必需字段
      if (!formattedUserData.userId) {
        throw new Error("Missing required user data: userId");
      }

      // 发送用户信息到后端
      const response = await authAPI.appleSignIn(formattedUserData);

      console.log("🔍 Backend response:", response.data);

      // 保存认证信息
      await AsyncStorage.setItem("authToken", response.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
      await AsyncStorage.setItem("authProvider", "apple");

      console.log("✅ Apple Sign-In completed successfully");
      onSignInSuccess && onSignInSuccess(response.data);
    } catch (error) {
      console.error("❌ Apple Sign-In error:", error);

      if (error.code === "ERR_CANCELED") {
        console.log("❌ User cancelled Apple Sign-In");
        // 用户取消登录，不显示错误，直接返回
        return;
      } else {
        console.log("❌ Unknown Apple Sign-In error:", error);
        Alert.alert("Apple登录失败", `错误: ${error.message || "未知错误"}`);
        onSignInError && onSignInError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 只在 iOS 上显示，且设备支持 Apple Sign-In
  if (Platform.OS !== "ios" || !isAvailable) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: "#000000",
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
      onPress={handleAppleSignIn}
      disabled={loading}
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
              🍎
            </Text>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "600",
                marginLeft: 8,
              }}
            >
              使用 Apple 登录
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

