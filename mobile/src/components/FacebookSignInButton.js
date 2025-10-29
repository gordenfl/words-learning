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
  LoginManager,
  AccessToken,
  GraphRequest,
  GraphRequestManager,
} from "react-native-fbsdk-next";

export default function FacebookSignInButton({
  onSignInSuccess,
  onSignInError,
}) {
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    // 检查Facebook配置
    const checkFacebookConfig = () => {
      const appId = Config.FACEBOOK_OAUTH?.APP_ID;

      if (!appId || appId === "YOUR_FACEBOOK_APP_ID") {
        console.error("❌ Facebook App ID not configured");
        setIsConfigured(false);
        return;
      }

      console.log("✅ Facebook Sign-In configured successfully");
      console.log("   App ID:", appId);
      console.log("   Platform:", Platform.OS);
    };

    checkFacebookConfig();
  }, []);

  const handleFacebookSignIn = async () => {
    if (!isConfigured) {
      Alert.alert("错误", "Facebook Sign-In 未正确配置");
      return;
    }

    setLoading(true);

    try {
      console.log("🔄 Starting Facebook Sign-In...");

      // 登录Facebook
      const result = await LoginManager.logInWithPermissions([
        "public_profile",
        "email",
      ]);

      console.log("🔍 Facebook login result:", result);

      if (result.isCancelled) {
        console.log("❌ User cancelled Facebook Sign-In");
        return; // 直接返回，不显示错误
      }

      // 获取访问令牌
      const data = await AccessToken.getCurrentAccessToken();

      if (!data) {
        throw new Error("No access token found");
      }

      console.log("✅ Facebook access token obtained:", data.accessToken);

      // 使用Graph API获取用户信息
      const userInfo = await new Promise((resolve, reject) => {
        const infoRequest = new GraphRequest(
          "/me",
          {
            parameters: {
              fields: {
                string: "id,name,email,picture.width(200).height(200)",
              },
            },
          },
          (error, result) => {
            if (error) {
              console.error("❌ Graph API error:", error);
              reject(error);
            } else {
              console.log("✅ Graph API result:", result);
              resolve(result);
            }
          }
        );

        new GraphRequestManager().addRequest(infoRequest).start();
      });

      console.log("🔍 UserInfo from Facebook Graph API:", userInfo);

      // 格式化用户数据
      const formattedUserData = {
        id: userInfo.id,
        email: userInfo.email || `${userInfo.id}@facebook.com`, // Facebook可能不提供邮箱
        name: userInfo.name,
        photo: userInfo.picture?.data?.url,
      };

      console.log("🔍 Formatted userData:", formattedUserData);

      // 验证必需字段
      if (!formattedUserData.id || !formattedUserData.name) {
        console.error("❌ Missing required fields:");
        console.error("   id:", formattedUserData.id);
        console.error("   name:", formattedUserData.name);
        throw new Error(
          `Missing required user data: id (${formattedUserData.id}) or name (${formattedUserData.name})`
        );
      }

      // 发送用户信息到后端
      const response = await authAPI.facebookSignIn(formattedUserData);

      console.log("🔍 Backend response:", response.data);

      // 保存认证信息
      await AsyncStorage.setItem("authToken", response.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
      await AsyncStorage.setItem("authProvider", "facebook");

      console.log("✅ Facebook Sign-In completed successfully");
      onSignInSuccess && onSignInSuccess(response.data);
    } catch (error) {
      console.error("❌ Facebook Sign-In error:", error);

      if (
        error.message &&
        error.message.includes("Missing required user data")
      ) {
        console.log("❌ Data extraction error:", error.message);
        Alert.alert("Facebook登录失败", "无法获取用户信息，请重试");
        onSignInError && onSignInError(error);
      } else {
        console.log("❌ Unknown Facebook Sign-In error:", error);
        Alert.alert("Facebook登录失败", `错误: ${error.message || "未知错误"}`);
        onSignInError && onSignInError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await LoginManager.logOut();
      console.log("✅ Facebook Sign-Out successful");
    } catch (error) {
      console.error("❌ Facebook Sign-Out error:", error);
    }
  };

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: "#1877F2",
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
      onPress={handleFacebookSignIn}
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
              f
            </Text>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "600",
                marginLeft: 8,
              }}
            >
              使用 Facebook 登录
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}
