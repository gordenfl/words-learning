import Constants from "expo-constants";

const runtimeMode =
  Constants?.expoConfig?.extra?.runtimeMode ||
  Constants?.manifest?.extra?.runtimeMode ||
  process.env.EXPO_RUNTIME ||
  "dev-client";

export const isExpoGo = runtimeMode === "expo-go";
export const isDevClient = runtimeMode === "dev-client";
export const isProductionBuild = runtimeMode === "production";

export default {
  runtimeMode,
  isExpoGo,
  isDevClient,
  isProductionBuild,
};
