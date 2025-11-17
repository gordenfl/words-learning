#!/bin/bash

# 启动 Expo Go 模式，显示二维码
cd "$(dirname "$0")"

echo "🚀 启动 Expo Go 调试模式..."
echo "📱 请确保手机已安装 Expo Go 应用"
echo ""

# 设置环境变量为 expo-go 模式
export EXPO_RUNTIME=expo-go

# 启动 Expo，使用 tunnel 模式以确保二维码可用
npx expo start --tunnel

