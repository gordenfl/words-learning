/**
 * 应用配置文件
 * 所有可配置的参数集中管理
 */

// 环境控制变量
// 设置为 true 使用生产环境，false 使用开发环境
const IS_PRODUCTION = false; // 开发时设为 false，生产时设为 true

// 环境配置
const ENV_CONFIG = {
  // 开发环境配置
  development: {
    API: {
      HOST: "192.168.101.100", // 本地IP，需要根据实际情况修改
      PORT: "3003",
      PROTOCOL: "http",
    },
    GOOGLE_OAUTH: {
      // Web Client ID (用于服务器端验证)
      WEB_CLIENT_ID:
        "123044373895-bf1p23r83kdcabs4frpvtq9o38k2uo9m.apps.googleusercontent.com",
      // iOS Client ID (用于原生SDK)
      IOS_CLIENT_ID:
        "123044373895-h042aqgmij6a60hee8gm239fd71kihkn.apps.googleusercontent.com",
      // Android Client ID (用于原生SDK)
      ANDROID_CLIENT_ID:
        "123044373895-rtmbsjo07dl3v8s0d27lbhvfei2tca2h.apps.googleusercontent.com",
      // 开发环境重定向URI
      REDIRECT_URI: "https://auth.expo.io/@gordenfl/words-learning",
      // Web Client Secret
      CLIENT_SECRET: {
        WEB: "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",
      },
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
      // Web Client ID (用于服务器端验证)
      WEB_CLIENT_ID:
        "123044373895-bf1p23r83kdcabs4frpvtq9o38k2uo9m.apps.googleusercontent.com",
      // iOS Client ID (用于原生SDK)
      IOS_CLIENT_ID:
        "123044373895-h042aqgmij6a60hee8gm239fd71kihkn.apps.googleusercontent.com",
      // Android Client ID (用于原生SDK)
      ANDROID_CLIENT_ID:
        "123044373895-rtmbsjo07dl3v8s0d27lbhvfei2tca2h.apps.googleusercontent.com",
      // 生产环境重定向URI
      REDIRECT_URI: "https://auth.expo.io/@gordenfl/words-learning",
      // Web Client Secret
      CLIENT_SECRET: {
        WEB: "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",
      },
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
