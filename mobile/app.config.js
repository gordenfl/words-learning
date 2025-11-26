import "dotenv/config";

const PROJECT_ID = "43b56fd3-62b6-4de8-8872-0e7cca605ed3";

const baseConfig = {
  name: "Chinese Words Learning",
  slug: "words-learning",
  version: "1.0.1",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#4A90E2",
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.gordenfl.wordslearning",
    buildNumber: "8",
    infoPlist: {
      NSCameraUsageDescription:
        "We need camera access to scan and recognize Chinese characters from books and images.",
      NSPhotoLibraryUsageDescription:
        "We need photo library access to select images for Chinese character recognition.",
      NSPhotoLibraryAddUsageDescription:
        "We need permission to save processed images to your photo library.",
      ITSAppUsesNonExemptEncryption: false,
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
      },
      CFBundleURLTypes: [
        {
          CFBundleURLName: "com.gordenfl.wordslearning.oauth",
          CFBundleURLSchemes: ["com.gordenfl.wordslearning"],
        },
        {
          CFBundleURLName:
            "com.googleusercontent.apps.123044373895-h042aqgmij6a60hee8gm239fd71kihkn.oauth",
          CFBundleURLSchemes: [
            "com.googleusercontent.apps.123044373895-h042aqgmij6a60hee8gm239fd71kihkn",
          ],
        },
        {
          CFBundleURLName: "facebook.oauth",
          CFBundleURLSchemes: ["fb1142058210841677"],
        },
      ],
    },
  },
  android: {
    package: "com.gordenfl.wordslearning",
    versionCode: 3,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#4A90E2",
    },
    permissions: [
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
    ],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "com.gordenfl.wordslearning",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  plugins: [
    "expo-dev-client",
    [
      "expo-build-properties",
      {
        android: {
          usesCleartextTraffic: true,
        },
        ios: {
          deploymentTarget: "15.1",
          useFrameworks: "static",
        },
      },
    ],
    [
      "react-native-fbsdk-next",
      {
        appID: "1142058210841677",
        clientToken: "80fe820226405bb590def0e7f24fc4c7",
        displayName: "Chinese Words Learning",
        scheme: "fb1142058210841677",
        advertiserIDCollectionEnabled: false,
        autoLogAppEventsEnabled: false,
        isAutoInitEnabled: true,
        iosUserTrackingPermission:
          "This identifier will be used to deliver personalized ads to you.",
      },
    ],
    "expo-apple-authentication",
  ],
  extra: {
    eas: {
      projectId: PROJECT_ID,
    },
  },
};

export default ({ config }) => {
  const runtimeMode = process.env.EXPO_RUNTIME || "dev-client";
  const isExpoGo = runtimeMode === "expo-go";

  const mergedConfig = {
    ...config,
    ...baseConfig,
    ios: {
      ...baseConfig.ios,
      ...(config.ios || {}),
    },
    android: {
      ...baseConfig.android,
      ...(config.android || {}),
    },
    plugins: [...(config.plugins || []), ...baseConfig.plugins],
    extra: {
      ...(config.extra || {}),
      ...baseConfig.extra,
      runtimeMode,
    },
  };

  if (isExpoGo) {
    mergedConfig.plugins = mergedConfig.plugins.filter((plugin) => {
      if (typeof plugin === "string") {
        return plugin !== "expo-dev-client";
      }
      if (Array.isArray(plugin)) {
        return plugin[0] !== "expo-dev-client";
      }
      return true;
    });
  } else {
    const hasDevClient = mergedConfig.plugins.some((plugin) =>
      typeof plugin === "string"
        ? plugin === "expo-dev-client"
        : Array.isArray(plugin) && plugin[0] === "expo-dev-client"
    );
    if (!hasDevClient) {
      mergedConfig.plugins.unshift("expo-dev-client");
    }
  }

  return mergedConfig;
};
