const GoogleAuthConfig = {
  OAuth: {
    CLIENT_ID: {
      ANDROID:
        "123044373895-rtmbsjo07dl3v8s0d27lbhvfei2tca2h.apps.googleusercontent.com",
      IOS: "123044373895-h042aqgmij6a60hee8gm239fd71kihkn.apps.googleusercontent.com",
      WEB: "123044373895-bf1p23r83kdcabs4frpvtq9o38k2uo9m.apps.googleusercontent.com",
    },
    CLIENT_SECRET: {
      WEB: "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",
    },
    REDIRECT_URI: {
      ANDROID: "com.wordslearning.app:/oauth2redirect",
      IOS: "com.gordenfl.wordslearning:/oauth2redirect",
      WEB: "https://auth.expo.io/@gordenfl/words-learning",
      CUSTOM: "wordslearning://oauth",
    },
    SCOPES: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  },
  UI: {
    BUTTON_STYLE: {
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
    BUTTON_TEXT_STYLE: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    BUTTON_ICON_STYLE: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "bold",
    },
    BUTTON_ICON: "G",
    BUTTON_TEXT: "使用 Google 登录",
    BUTTON_CONTENT_STYLE: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    BUTTON_DISABLED_STYLE: {
      backgroundColor: "#CCCCCC",
      opacity: 0.6,
    },
    BUTTON_LOADING_COLOR: "#FFFFFF",
  },
  ERROR_MESSAGES: {
    CONFIGURATION_ERROR: "Google Sign-In 配置错误，请检查配置文件",
    NETWORK_ERROR: "网络连接失败，请检查网络设置",
    AUTH_ERROR: "Google 登录失败，请重试",
    USER_CANCELLED: "用户取消了登录",
  },
};

export default GoogleAuthConfig;

