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
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function GoogleSignInButton({ onSignInSuccess, onSignInError }) {
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);

  // 使用WebBrowser方案（兼容Expo Go）
  const redirectUri = "https://auth.expo.io/@gordenfl/words-learning";

  console.log("🔗 Using WebBrowser Google Sign-In");
  console.log("   Environment:", Config.ENVIRONMENT);
  console.log("   Redirect URI:", redirectUri);

  // 构建Google OAuth URL
  const buildGoogleAuthUrl = () => {
    const webClientId = Config.GOOGLE_OAUTH?.WEB_CLIENT_ID || Config.GOOGLE_OAUTH?.CLIENT_ID;
    const params = new URLSearchParams({
      client_id: webClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid profile email",
      access_type: "offline",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  const handleGoogleSignIn = async () => {
    if (!isConfigured) {
      Alert.alert("错误", "Google Sign-In 未正确配置");
      return;
    }

    setLoading(true);

    try {
      // 检查配置是否已更新 - 修复undefined错误
      const webClientId = Config.GOOGLE_OAUTH?.WEB_CLIENT_ID || Config.GOOGLE_OAUTH?.CLIENT_ID;
      console.log("🔍 Config check:", {
        GOOGLE_OAUTH: !!Config.GOOGLE_OAUTH,
        WEB_CLIENT_ID: webClientId,
        isUndefined: webClientId === undefined
      });

      if (!webClientId || webClientId.includes("xxxxxx")) {
        Alert.alert(
          "配置未完成",
          "请先在 Google Cloud Console 中创建 OAuth 客户端，然后更新配置文件中的 CLIENT_ID。"
        );
        setLoading(false);
        return;
      }

      // 使用WebBrowser方案
      console.log("🔄 Using WebBrowser...");
      const authUrl = buildGoogleAuthUrl();
      console.log("🔗 Opening Google OAuth URL:", authUrl);
      console.log("   Web Client ID:", webClientId);

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
        {
          showInRecents: false,
          preferEphemeralSession: false,
          showTitle: true,
          enableBarCollapsing: false,
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        }
      );

      console.log("🔍 WebBrowser result:", result);

      if (result.type === "success") {
        console.log("✅ Google OAuth successful:", result.url);

        try {
          // 解析URL参数
          const url = new URL(result.url);
          const code = url.searchParams.get("code");
          const error = url.searchParams.get("error");
          const errorDescription = url.searchParams.get("error_description");

          console.log("🔍 Parsed URL params:", {
            code: code ? `${code.substring(0, 20)}...` : null,
            error,
            errorDescription,
          });

          if (error) {
            console.error("❌ Google OAuth error:", error, errorDescription);
            Alert.alert(
              "Google登录失败",
              `错误: ${error}\n描述: ${errorDescription || "未知错误"}`
            );
            onSignInError && onSignInError(error);
            return;
          }

          if (code) {
            console.log("✅ Authorization code received, length:", code.length);

            // 使用真实的Google OAuth流程
            try {
              console.log("🔄 Starting token exchange...");
              console.log("   Client ID:", webClientId);
              console.log("   Redirect URI:", redirectUri);

              // 1. 用code换取access_token
              const tokenResponse = await fetch(
                "https://oauth2.googleapis.com/token",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  body: new URLSearchParams({
                    client_id: webClientId,
                    client_secret: "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",
                    code: code,
                    grant_type: "authorization_code",
                    redirect_uri: redirectUri,
                  }),
                }
              );

              console.log("🔍 Token response status:", tokenResponse.status);
              const tokenData = await tokenResponse.json();
              console.log("🔍 Token response data:", {
                access_token: tokenData.access_token ? "present" : "missing",
                id_token: tokenData.id_token ? "present" : "missing",
                error: tokenData.error,
              });

              if (tokenData.error) {
                console.error("❌ Token exchange failed:", tokenData.error);
                Alert.alert(
                  "Google登录失败",
                  `Token交换失败: ${tokenData.error}`
                );
                onSignInError && onSignInError(tokenData.error);
                return;
              }

              if (!tokenData.access_token) {
                console.error("❌ No access token received");
                Alert.alert("Google登录失败", "未收到访问令牌");
                onSignInError && onSignInError("No access token received");
                return;
              }

              // 2. 用access_token获取用户信息
              console.log("🔄 Fetching user info...");
              const userInfoResponse = await fetch(
                `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`
              );

              console.log("🔍 User info response status:", userInfoResponse.status);
              const userInfo = await userInfoResponse.json();
              console.log("🔍 User info data:", {
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                error: userInfo.error,
              });

              if (userInfo.error) {
                console.error("❌ User info fetch failed:", userInfo.error);
                Alert.alert("Google登录失败", `获取用户信息失败: ${userInfo.error}`);
                onSignInError && onSignInError(userInfo.error);
                return;
              }

              if (!userInfo.email) {
                console.error("❌ No email in user info");
                Alert.alert("Google登录失败", "用户信息中缺少邮箱地址");
                onSignInError && onSignInError("No email in user info");
                return;
              }

              // 3. 发送到后端
              console.log("🔄 Sending to backend...");
              console.log("   ID Token present:", !!tokenData.id_token);
              console.log("   User email:", userInfo.email);

              const response = await authAPI.googleSignIn(tokenData.id_token, {
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                photo: userInfo.picture,
              });

              console.log("🔍 Backend response status:", response.status);
              console.log("🔍 Backend response data:", {
                token: response.data.token ? "present" : "missing",
                user: response.data.user ? "present" : "missing",
              });

              await AsyncStorage.setItem("authToken", response.data.token);
              await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
              await AsyncStorage.setItem("authProvider", "google");

              console.log("✅ Google Sign-In completed successfully");
              onSignInSuccess && onSignInSuccess(response.data);

            } catch (apiError) {
              console.error("❌ API call failed:", apiError);
              let errorMessage = "与服务器通信失败，请检查网络连接";
              if (apiError.response?.data?.error) {
                errorMessage = `服务器错误: ${apiError.response.data.error}`;
              } else if (apiError.message) {
                errorMessage = `网络错误: ${apiError.message}`;
              }
              Alert.alert("Google登录失败", errorMessage);
              onSignInError && onSignInError(apiError);
            }
          } else {
            console.log("❌ No authorization code received");
            Alert.alert("Google登录失败", "未收到授权码，请重试");
            onSignInError && onSignInError("No authorization code received");
          }
        } catch (parseError) {
          console.error("❌ URL parsing failed:", parseError);
          Alert.alert("Google登录失败", "解析重定向URL失败");
          onSignInError && onSignInError(parseError);
        }
      } else if (result.type === "cancel") {
        console.log("❌ Google OAuth cancelled by user");
        setLoading(false);
        return;
      } else if (result.type === "dismiss") {
        console.log("❌ Google OAuth dismissed");
        Alert.alert("Google登录失败", "登录被取消，请重试");
        onSignInError && onSignInError("Google OAuth dismissed");
      } else {
        console.log("❌ Google OAuth failed:", result.type);
        Alert.alert("Google登录失败", `OAuth流程失败: ${result.type}`);
        onSignInError && onSignInError("Google OAuth failed");
      }
    } catch (error) {
      console.error("❌ Google Sign-In error:", error);
      Alert.alert("Google登录失败", "请检查网络连接或稍后重试");
      onSignInError && onSignInError(error);
    } finally {
      setLoading(false);
    }
  };

  // 按钮样式
  const buttonStyle = {
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
  };

  const disabledStyle = {
    backgroundColor: "#CCCCCC",
    opacity: 0.6,
  };

  const contentStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  };

  const iconStyle = {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  };

  const textStyle = {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  };

  return (
    <TouchableOpacity
      style={[buttonStyle, loading && disabledStyle]}
      onPress={handleGoogleSignIn}
      disabled={loading || !isConfigured}
    >
      <View style={contentStyle}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text style={iconStyle}>G</Text>
            <Text style={textStyle}>使用 Google 登录</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}