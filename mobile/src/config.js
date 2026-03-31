/**
 * 应用配置 - 与 mobile 一致，便于对接同一 backend
 * - 本地开发：可用 .env 覆盖 API，例如 VITE_API_HOST=127.0.0.1 VITE_API_PORT=8001
 * - 生产构建（vite build / Xcode 打 IPA 前的 cap:sync）：固定走 ENV_CONFIG.production（外服），
 *   避免本机 .env 里的 VITE_API_* 被打进包导致 IPA 仍连 localhost
 */
const IS_PRODUCTION = import.meta.env.PROD;

const ENV_CONFIG = {
  development: {
    // 内部开发默认走本机 Django（可用 VITE_API_* 覆盖）
    API: { HOST: "localhost", PORT: "8001", PROTOCOL: "http" },
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

const devApiHost = import.meta.env.VITE_API_HOST;
const devApiPort = import.meta.env.VITE_API_PORT;
const devApiProtocol = import.meta.env.VITE_API_PROTOCOL;

function pickApi(picked, fallback) {
  if (!IS_PRODUCTION && picked !== undefined && picked !== "") {
    return picked;
  }
  return fallback;
}

const apiHost = pickApi(devApiHost, env.API.HOST);
const apiPort = pickApi(devApiPort, env.API.PORT);
const apiProtocol = pickApi(devApiProtocol, env.API.PROTOCOL);

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
