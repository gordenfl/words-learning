const { getDefaultConfig } = require('@react-native/metro-config');

/**
 * Metro 需要正确的 assetRegistryPath 才能解析图片等资源；
 * 直接运行 metro build 时若没有此配置会报 missing-asset-registry-path。
 */
module.exports = getDefaultConfig(__dirname);
