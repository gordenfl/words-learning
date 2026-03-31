#!/bin/bash

# iOS IPA 打包脚本
# 使用方法: ./build-ipa.sh [ad-hoc|app-store]

set -e

cd "$(dirname "$0")"
MOBILE_DIR="$(pwd)"
IOS_DIR="$MOBILE_DIR/ios"
cd "$IOS_DIR"

BUILD_TYPE=${1:-ad-hoc}
SCHEME="ChineseWordsLearning"
WORKSPACE="ChineseWordsLearning.xcworkspace"
CONFIGURATION="Release"
ARCHIVE_PATH="./build/${SCHEME}.xcarchive"
EXPORT_PATH="./build/export"

# 自动递增 build 号
echo "🔢 自动递增 Build 号..."
cd "$MOBILE_DIR"

# 从 app.config.js 读取当前 build 号
CURRENT_BUILD=$(grep -oE 'buildNumber:\s*"[0-9]+"' "$MOBILE_DIR/app.config.js" | grep -oE '[0-9]+' | head -1)

if [ -z "$CURRENT_BUILD" ]; then
    echo "❌ 无法从 app.config.js 读取 build 号"
    exit 1
fi

# 递增 build 号
NEW_BUILD=$((CURRENT_BUILD + 1))

echo "   Build 号: $CURRENT_BUILD → $NEW_BUILD"

# 1. 更新 app.config.js
sed -i '' "s/buildNumber: \"$CURRENT_BUILD\"/buildNumber: \"$NEW_BUILD\"/" "$MOBILE_DIR/app.config.js"

# 2. 更新 Info.plist
sed -i '' "/<key>CFBundleVersion<\/key>/,/<string>/s/<string>$CURRENT_BUILD<\/string>/<string>$NEW_BUILD<\/string>/" "$IOS_DIR/ChineseWordsLearning/Info.plist"

# 3. 更新 project.pbxproj
sed -i '' "s/CURRENT_PROJECT_VERSION = $CURRENT_BUILD;/CURRENT_PROJECT_VERSION = $NEW_BUILD;/g" "$IOS_DIR/ChineseWordsLearning.xcodeproj/project.pbxproj"

echo "✅ Build 号已更新为 $NEW_BUILD"
echo ""

cd "$IOS_DIR"

# 根据构建类型设置导出选项文件名（相对于 ios 目录）
if [ "$BUILD_TYPE" == "ad-hoc" ]; then
    EXPORT_OPTIONS="$IOS_DIR/exportOptionsAdHoc.plist"
elif [ "$BUILD_TYPE" == "app-store" ]; then
    EXPORT_OPTIONS="$IOS_DIR/exportOptions.plist"
else
    echo "❌ 无效的构建类型: $BUILD_TYPE"
    echo "使用方法: ./build-ipa.sh [ad-hoc|app-store]"
    exit 1
fi

# 验证导出选项文件是否存在
if [ ! -f "$EXPORT_OPTIONS" ]; then
    echo "❌ 导出选项文件不存在: $EXPORT_OPTIONS"
    exit 1
fi

# 获取 Team ID
# 优先级：环境变量 > 配置文件 > Xcode 项目设置 > 用户输入
TEAM_ID="${APPLE_TEAM_ID:-}"

if [ -z "$TEAM_ID" ] && [ -f "$IOS_DIR/.ios-team-id" ]; then
    TEAM_ID=$(cat "$IOS_DIR/.ios-team-id" | tr -d '[:space:]')
fi

if [ -z "$TEAM_ID" ]; then
    # 尝试从 Xcode 项目设置中获取
    TEAM_ID=$(xcodebuild -showBuildSettings -workspace "$WORKSPACE" -scheme "$SCHEME" 2>/dev/null | grep "DEVELOPMENT_TEAM" | head -1 | sed 's/.*= *//' | tr -d '[:space:]')
fi

if [ -z "$TEAM_ID" ]; then
    # 尝试从已安装的证书中提取 Team ID（格式：XXXXXXXXXX）
    TEAM_ID=$(security find-identity -v -p codesigning 2>/dev/null | grep -oE "\([A-Z0-9]{10}\)" | head -1 | tr -d '()')
fi

if [ -z "$TEAM_ID" ]; then
    echo "⚠️  未找到 Apple Developer Team ID"
    echo ""
    echo "请提供您的 Team ID。您可以通过以下方式获取："
    echo "1. 访问 https://developer.apple.com/account"
    echo "2. 在 Membership 页面查看 Team ID（格式：XXXXXXXXXX，10个字符）"
    echo "3. 或者在 Xcode 中：Preferences > Accounts > 选择您的账号 > Team ID"
    echo ""
    read -p "请输入您的 Apple Developer Team ID: " TEAM_ID
    
    if [ -z "$TEAM_ID" ]; then
        echo "❌ Team ID 不能为空"
        exit 1
    fi
    
    # 验证 Team ID 格式（应该是10个字符）
    if [ ${#TEAM_ID} -ne 10 ]; then
        echo "⚠️  警告: Team ID 通常是10个字符，您输入的是 ${#TEAM_ID} 个字符"
        read -p "确认继续？(y/n): " confirm
        if [ "$confirm" != "y" ]; then
            exit 1
        fi
    fi
    
    # 保存到配置文件，方便下次使用
    echo "$TEAM_ID" > "$IOS_DIR/.ios-team-id"
    echo "✅ Team ID 已保存到 $IOS_DIR/.ios-team-id"
fi

# 更新导出选项文件中的 teamID
echo "🔧 配置 Team ID: $TEAM_ID"
/usr/libexec/PlistBuddy -c "Set :teamID $TEAM_ID" "$EXPORT_OPTIONS" 2>/dev/null || \
plutil -replace teamID -string "$TEAM_ID" "$EXPORT_OPTIONS"

# 检查可用的签名证书
AVAILABLE_CERTS=$(security find-identity -v -p codesigning 2>/dev/null | grep -E "iPhone|Apple|Distribution" | wc -l | tr -d ' ')
if [ "$AVAILABLE_CERTS" -eq "0" ]; then
    echo "⚠️  警告: 未找到可用的签名证书"
    echo "   您可能需要："
    echo "   1. 在 Xcode 中登录您的 Apple ID"
    echo "   2. 或者申请 Distribution 证书用于生产构建"
fi

echo "📦 开始构建 IPA..."
echo "构建类型: $BUILD_TYPE"
echo "Scheme: $SCHEME"
echo "Team ID: $TEAM_ID"
echo ""

# 清理之前的构建
echo "🧹 清理之前的构建..."
rm -rf build/${SCHEME}.xcarchive
rm -rf build/export

# 创建 build 目录
mkdir -p build

# 0. Bundle JavaScript for production
echo "📦 步骤 0/4: 打包 JavaScript Bundle..."
cd ..
BUNDLE_DIR="ios/ChineseWordsLearning"
BUNDLE_OUTPUT="$BUNDLE_DIR/main.jsbundle"
mkdir -p "$BUNDLE_DIR"
mkdir -p "$BUNDLE_DIR/assets"

# 使用 Metro bundler 打包 JavaScript
# 对于 Expo 项目，入口文件是 package.json 中定义的 main
ENTRY_FILE=$(node -p "require('./package.json').main")
echo "   入口文件: $ENTRY_FILE"

# 确保有 metro.config.js 文件
if [ ! -f "metro.config.js" ]; then
  echo "⚠️  警告: metro.config.js 不存在，将使用默认配置"
fi

# 使用 React Native CLI 打包（带 --assets-dest），这样 assets 目录下的图片等资源会一并输出，否则 IPA 里没有图片
# 必须加 --minify false：部分 Expo/Metro 组合下 minify 会把 import 移出顶层导致报错
export EXPO_PUBLIC_IS_PRODUCTION=true
export NODE_ENV=production
npx @react-native-community/cli bundle \
  --platform ios \
  --dev false \
  --minify false \
  --entry-file "$ENTRY_FILE" \
  --bundle-output "$BUNDLE_OUTPUT" \
  --assets-dest "$BUNDLE_DIR" \
  --reset-cache

# 验证 bundle 是否存在
if [ ! -f "$BUNDLE_OUTPUT" ]; then
  echo "❌ JavaScript Bundle 打包失败"
  echo "   检查的文件: $BUNDLE_OUTPUT"
  ls -la "$BUNDLE_DIR"/*.js* 2>/dev/null || echo "   目录中没有找到 bundle 文件"
  exit 1
fi

echo "✅ JavaScript Bundle 打包成功: $BUNDLE_OUTPUT"
BUNDLE_SIZE=$(du -h "$BUNDLE_OUTPUT" | cut -f1)
echo "   Bundle 大小: $BUNDLE_SIZE"
echo ""
cd ios

# 确保 main.jsbundle 在正确的位置
if [ ! -f "ChineseWordsLearning/main.jsbundle" ]; then
    echo "⚠️  警告: main.jsbundle 不在 ChineseWordsLearning 目录中"
    if [ -f "../ios/ChineseWordsLearning/main.jsbundle" ]; then
        cp "../ios/ChineseWordsLearning/main.jsbundle" "ChineseWordsLearning/main.jsbundle"
        echo "✅ 已复制 main.jsbundle 到正确位置"
    fi
fi

# 使用预生成的 bundle，跳过 Xcode 的 “Bundle React Native code and images” 阶段（避免在 Xcode 环境中再次跑 Metro 失败）
echo 'export SKIP_BUNDLING=1' > .xcode.env.local
trap 'rm -f .xcode.env.local' EXIT

# 1. Archive
echo "📦 步骤 1/4: 创建 Archive..."
echo "   注意: 使用 Xcode 项目配置中的代码签名设置"
xcodebuild archive \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -archivePath "$ARCHIVE_PATH" \
    -allowProvisioningUpdates

if [ ! -d "$ARCHIVE_PATH" ]; then
    echo "❌ Archive 创建失败"
    exit 1
fi

echo "✅ Archive 创建成功: $ARCHIVE_PATH"
echo ""

# 2. Export IPA
echo "📤 步骤 2/4: 导出 IPA..."
xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportPath "$EXPORT_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS" \
    -allowProvisioningUpdates

if [ ! -f "$EXPORT_PATH/${SCHEME}.ipa" ]; then
    echo "❌ IPA 导出失败"
    exit 1
fi

echo "✅ IPA 导出成功"
echo ""

# 3. 验证 Bundle 已包含
echo "🔍 步骤 3/4: 验证 Bundle..."
if [ -f "ChineseWordsLearning/main.jsbundle" ]; then
  BUNDLE_SIZE=$(du -h "ChineseWordsLearning/main.jsbundle" | cut -f1)
  echo "✅ Bundle 文件存在，大小: $BUNDLE_SIZE"
else
  echo "⚠️  警告: Bundle 文件不存在，应用可能无法正常运行"
fi
echo ""

# 4. 显示结果
IPA_PATH="$EXPORT_PATH/${SCHEME}.ipa"
IPA_SIZE=$(du -h "$IPA_PATH" | cut -f1)

echo "🎉 构建完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 IPA 文件位置:"
echo "   $IPA_PATH"
echo ""
echo "📊 文件大小: $IPA_SIZE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 提示:"
echo "   - Ad-Hoc IPA 可以安装到已注册的设备上"
echo "   - App Store IPA 需要上传到 App Store Connect"
echo ""




