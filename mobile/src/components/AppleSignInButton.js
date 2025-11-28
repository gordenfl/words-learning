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
import { useThemeContext } from "../context/ThemeContext";

let AppleAuthentication = null;

if (!isExpoGo && Platform.OS === "ios") {
  try {
    AppleAuthentication = require("expo-apple-authentication");
  } catch (error) {
    console.warn(
      "⚠️ Failed to load Apple Authentication native module:",
      error?.message
    );
  }
}

export default function AppleSignInButton({ onSignInSuccess, onSignInError }) {
  const { loadThemeFromServer } = useThemeContext();
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
        console.warn(
          "⚠️ Apple Authentication native module unavailable - button will still show for App Store compliance"
        );
        // 即使包未安装，也显示按钮（用于 App Store 审核要求）
        // 点击时会显示错误提示
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
    if (!AppleAuthentication) {
      Alert.alert(
        "Apple 登录",
        "Apple 登录功能正在配置中，请稍后再试。\n\n如需使用，请联系开发者。"
      );
      return;
    }

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

      // 加载用户主题（如果服务器返回了主题）
      if (response.data.user?.theme) {
        await loadThemeFromServer(response.data.user.theme);
      }

      console.log("✅ Apple Sign-In completed successfully");
      onSignInSuccess && onSignInSuccess(response.data);
    } catch (error) {
      console.error("❌ Apple Sign-In error:", error);
      console.error("❌ Error code:", error.code);
      console.error("❌ Error message:", error.message);
      console.error("❌ Full error object:", JSON.stringify(error, null, 2));

      if (error.code === "ERR_CANCELED") {
        console.log("❌ User cancelled Apple Sign-In");
        // 用户取消登录，不显示错误，直接返回
        return;
      } else if (error.code === "ERR_REQUEST_UNKOWN") {
        // ERR_REQUEST_UNKOWN 特定错误处理
        console.log("❌ ERR_REQUEST_UNKOWN - 授权请求失败");
        const troubleshootingSteps =
          "ERR_REQUEST_UNKOWN 常见原因：\n\n" +
          "1. ⚠️ 在模拟器上测试\n" +
          "   → 请在真实设备上测试\n\n" +
          "2. ⚠️ 设备未登录 Apple ID\n" +
          "   → 设置 → 登录 iPhone → 使用 Apple ID 登录\n\n" +
          "3. ⚠️ Xcode Capability 配置问题\n" +
          "   → 打开 Xcode → 项目 → Signing & Capabilities\n" +
          "   → 确保 Debug 和 Release 配置都有 'Sign in with Apple'\n\n" +
          "4. ⚠️ Apple Developer 配置问题\n" +
          "   详细步骤：\n" +
          "   a) 访问 https://developer.apple.com\n" +
          "   b) 使用 Apple ID 登录\n" +
          "   c) 点击 'Certificates, Identifiers & Profiles'\n" +
          "   d) 左侧菜单选择 'Identifiers'\n" +
          "   e) 搜索或找到 'com.gordenfl.wordslearning'\n" +
          "   f) 点击进入详情页面\n" +
          "   g) 在 'Capabilities' 部分找到 'Sign in with Apple'\n" +
          "   h) 如果未勾选，请勾选并点击 'Save'\n" +
          "   i) 等待配置生效（通常几分钟）\n\n" +
          "5. ⚠️ 网络问题\n" +
          "   → 关闭 VPN/代理后重试\n\n" +
          "6. ⚠️ 需要重新构建\n" +
          "   → 在 Xcode 中 Clean Build Folder\n" +
          "   → 重新构建应用";

        Alert.alert(
          "Apple登录失败",
          `错误代码: ${error.code}\n错误信息: ${error.message || "未知错误"}`,
          [
            { text: "确定", style: "default" },
            {
              text: "查看解决方案",
              onPress: () => {
                Alert.alert(
                  "ERR_REQUEST_UNKOWN 解决方案",
                  troubleshootingSteps
                );
              },
            },
          ]
        );
        onSignInError && onSignInError(error);
      } else {
        // 其他错误
        const errorDetails = error.code
          ? `错误代码: ${error.code}\n错误信息: ${error.message || "未知错误"}`
          : `错误信息: ${error.message || "未知错误"}`;

        console.log("❌ Apple Sign-In error details:", errorDetails);
        Alert.alert("Apple登录失败", errorDetails, [
          { text: "确定", style: "default" },
          {
            text: "查看帮助",
            onPress: () => {
              Alert.alert(
                "排查步骤",
                "1. 确保设备已登录 Apple ID\n2. 在真实设备上测试（模拟器可能有问题）\n3. 检查 Xcode 中是否已添加 'Sign in with Apple' Capability\n4. 尝试重新构建应用"
              );
            },
          },
        ]);
        onSignInError && onSignInError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 在 iOS 上显示按钮（即使包未安装，也显示以符合 App Store 审核要求）
  // 如果包未安装或不可用，点击时会显示错误提示
  if (Platform.OS !== "ios") {
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
