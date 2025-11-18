/**
 * 应用配置文件
 * 所有可配置的参数集中管理
 */

// 环境控制变量
// 设置为 true 使用生产环境，false 使用开发环境
// 可以通过环境变量 EXPO_PUBLIC_IS_PRODUCTION 覆盖
// 在生产构建时，构建脚本会自动设置此环境变量
const IS_PRODUCTION = process.env.EXPO_PUBLIC_IS_PRODUCTION === 'true' || 
                      process.env.NODE_ENV === 'production' ||
                      !__DEV__; // 在 Release 构建中 __DEV__ 为 false

// 环境配置
const ENV_CONFIG = {
  // 开发环境配置
  development: {
    API: {
      HOST: "gordenfl.com", // 统一使用远程服务器
      PORT: "3003",
      PROTOCOL: "http",
    },
    GOOGLE_OAUTH: {
      // iOS Client ID (用于原生SDK)
      IOS_CLIENT_ID:
        "123044373895-h042aqgmij6a60hee8gm239fd71kihkn.apps.googleusercontent.com",
      // Android Client ID (用于原生SDK)
      ANDROID_CLIENT_ID:
        "123044373895-rtmbsjo07dl3v8s0d27lbhvfei2tca2h.apps.googleusercontent.com",
    },
    FACEBOOK_OAUTH: {
      // Facebook App ID (iOS和Android共用)
      APP_ID: "1142058210841677",
      // Facebook App Name (用于显示)
      APP_NAME: "Chinese Words Learning",
    },
  },

  // 生产环境配置
  production: {
    API: {
      HOST: "gordenfl.com",
      PORT: "3003",
      PROTOCOL: "http",
    },
    GOOGLE_OAUTH: {
      // iOS Client ID (用于原生SDK)
      IOS_CLIENT_ID:
        "123044373895-h042aqgmij6a60hee8gm239fd71kihkn.apps.googleusercontent.com",
      // Android Client ID (用于原生SDK)
      ANDROID_CLIENT_ID:
        "123044373895-rtmbsjo07dl3v8s0d27lbhvfei2tca2h.apps.googleusercontent.com",
    },
    FACEBOOK_OAUTH: {
      // Facebook App ID (iOS和Android共用)
      APP_ID: "1142058210841677",
      // Facebook App Name (用于显示)
      APP_NAME: "Chinese Words Learning",
    },
  },
};

// 根据环境变量选择配置
const currentEnv = IS_PRODUCTION ? "production" : "development";
const envConfig = ENV_CONFIG[currentEnv];

const Config = {
  // 当前环境
  ENVIRONMENT: currentEnv,
  IS_PRODUCTION: IS_PRODUCTION,

  // API配置
  API: {
    HOST: envConfig.API.HOST,
    PORT: envConfig.API.PORT,
    PROTOCOL: envConfig.API.PROTOCOL,

    // 自动生成完整的BASE_URL
    get BASE_URL() {
      const url = `${this.PROTOCOL}://${this.HOST}:${this.PORT}/api`;
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🌐 API Configuration:");
      console.log("   Environment:", currentEnv.toUpperCase());
      console.log("   HOST:", this.HOST);
      console.log("   PORT:", this.PORT);
      console.log("   PROTOCOL:", this.PROTOCOL);
      console.log("   Full URL:", url);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
      return url;
    },
  },

  // Google OAuth配置 - 直接使用环境配置
  GOOGLE_OAUTH: envConfig.GOOGLE_OAUTH,

  // Facebook OAuth配置 - 直接使用环境配置
  FACEBOOK_OAUTH: envConfig.FACEBOOK_OAUTH,

  // OCR配置
  OCR: {
    TIMEOUT: 30000, // 30秒超时
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  },

  // 学习配置
  LEARNING: {
    DEFAULT_DAILY_GOAL: 10,
    DEFAULT_WEEKLY_GOAL: 50,
    DEFAULT_MONTHLY_GOAL: 200,
    DEFAULT_DIFFICULTY: "intermediate",
  },
};

export default Config;
