#!/bin/bash
# Android APK 打包脚本

echo "📱 Words Learning - Android APK 构建"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查是否在 mobile 目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在 mobile 目录下运行此脚本"
    echo "   cd mobile && ./build-apk.sh"
    exit 1
fi

echo "🔍 检查环境..."
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi
echo "✅ npm: $(npm --version)"

echo ""
echo "📦 选择构建方式："
echo ""
echo "1) EAS Build（推荐）- 云端构建，最简单"
echo "2) 本地构建 - 需要 Android Studio"
echo "3) 取消"
echo ""
read -p "请选择 [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "🚀 使用 EAS Build 构建..."
        echo ""
        
        # 检查 EAS CLI
        if ! command -v eas &> /dev/null; then
            echo "📥 安装 EAS CLI..."
            npm install -g eas-cli
        fi
        
        echo "✅ EAS CLI 已安装"
        echo ""
        
        # 登录检查
        echo "🔑 检查登录状态..."
        if ! eas whoami &> /dev/null; then
            echo "请先登录 Expo 账号："
            eas login
        fi
        
        echo ""
        echo "🏗️  开始构建 APK..."
        echo "   配置: preview（测试版 APK）"
        echo "   连接: gordenfl.com:8088"
        echo ""
        echo "⏳ 构建需要 10-15 分钟，请耐心等待..."
        echo ""
        
        # 构建
        eas build -p android --profile preview
        
        echo ""
        echo "✅ 构建完成！"
        echo "📱 在手机浏览器打开上面的链接下载 APK"
        echo ""
        ;;
        
    2)
        echo ""
        echo "🏗️  本地构建 APK..."
        echo ""
        echo "⚠️  注意：需要先安装 Android Studio 和配置环境变量"
        echo ""
        read -p "已经配置好了吗？继续？(y/n): " confirm
        
        if [ "$confirm" != "y" ]; then
            echo "取消构建"
            exit 0
        fi
        
        echo "🔨 开始本地构建..."
        npx expo build:android -t apk
        
        echo ""
        echo "✅ 构建完成！"
        echo "📱 APK 文件将下载到当前目录"
        ;;
        
    3)
        echo "取消构建"
        exit 0
        ;;
        
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 下一步："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 📥 下载 APK 到手机"
echo "2. 🔧 允许安装未知来源应用"
echo "3. 📲 安装 APK"
echo "4. 🚀 打开 App（自动连接到 gordenfl.com:8088）"
echo "5. ✅ 开始使用！"
echo ""

