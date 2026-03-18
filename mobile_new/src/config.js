/**
 * 应用配置 - 与 mobile 一致，便于对接同一 backend
 * 本地开发时可用 .env 指定后端地址：VITE_API_HOST=127.0.0.1 VITE_API_PORT=8001
 */
const IS_PRODUCTION = import.meta.env.PROD;

const ENV_CONFIG = {
  development: {
    API: { HOST: "gordenfl.com", PORT: "8088", PROTOCOL: "http" },
    GOOGLE_OAUTH: {
      IOS_CLIENT_ID: "123044373895-h042aqgmij6a60hee8gm239fd71kihkn.apps.googleusercontent.com",
      ANDROID_CLIENT_ID: "123044373895-rtmbsjo07dl3v8s0d27lbhvfei2tca2h.apps.googleusercontent.com",
    },
    FACEBOOK_OAUTH: { APP_ID: "1142058210841677", APP_NAME: "Chinese Words Learning" },
  },
  production: {
    API: { HOST: "gordenfl.com", PORT: "8088", PROTOCOL: "http" },
    GOOGLE_OAUTH: {
      IOS_CLIENT_ID: "123044373895-h042aqgmij6a60hee8gm239fd71kihkn.apps.googleusercontent.com",
      ANDROID_CLIENT_ID: "123044373895-rtmbsjo07dl3v8s0d27lbhvfei2tca2h.apps.googleusercontent.com",
    },
    FACEBOOK_OAUTH: { APP_ID: "1142058210841677", APP_NAME: "Chinese Words Learning" },
  },
};

const envName = IS_PRODUCTION ? "production" : "development";
const env = ENV_CONFIG[envName];

// 本地开发时优先使用环境变量，这样请求会发到你本机跑的 Django（如 runserver 8001）
const apiHost = import.meta.env.VITE_API_HOST || env.API.HOST;
const apiPort = import.meta.env.VITE_API_PORT || env.API.PORT;
const apiProtocol = import.meta.env.VITE_API_PROTOCOL || env.API.PROTOCOL;

export default {
  IS_PRODUCTION: IS_PRODUCTION,
  API: {
    HOST: apiHost,
    PORT: apiPort,
    PROTOCOL: apiProtocol,
    get BASE_URL() {
      return `${this.PROTOCOL}://${this.HOST}:${this.PORT}/api`;
    },
  },
  GOOGLE_OAUTH: env.GOOGLE_OAUTH,
  FACEBOOK_OAUTH: env.FACEBOOK_OAUTH,
  LEARNING: {
    DEFAULT_DAILY_GOAL: 10,
    DEFAULT_WEEKLY_GOAL: 50,
    DEFAULT_MONTHLY_GOAL: 200,
    DEFAULT_DIFFICULTY: "intermediate",
  },
};
