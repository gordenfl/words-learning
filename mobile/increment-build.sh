#!/bin/bash

# Build 号自动递增脚本
# 使用方法: ./increment-build.sh

set -e

cd "$(dirname "$0")"
MOBILE_DIR="$(pwd)"
IOS_DIR="$MOBILE_DIR/ios"

# 从 app.config.js 读取当前 build 号
CURRENT_BUILD=$(grep -oP 'buildNumber:\s*"\K[^"]+' "$MOBILE_DIR/app.config.js" | head -1)

if [ -z "$CURRENT_BUILD" ]; then
    echo "❌ 无法从 app.config.js 读取 build 号"
    exit 1
fi

# 递增 build 号
NEW_BUILD=$((CURRENT_BUILD + 1))

echo "📦 更新 Build 号"
echo "   当前: $CURRENT_BUILD"
echo "   新的: $NEW_BUILD"
echo ""

# 1. 更新 app.config.js
echo "📝 更新 app.config.js..."
sed -i '' "s/buildNumber: \"$CURRENT_BUILD\"/buildNumber: \"$NEW_BUILD\"/" "$MOBILE_DIR/app.config.js"
echo "   ✅ app.config.js 已更新"

# 2. 更新 Info.plist
echo "📝 更新 Info.plist..."
sed -i '' "s/<string>$CURRENT_BUILD<\/string>/<string>$NEW_BUILD<\/string>/" "$IOS_DIR/ChineseWordsLearning/Info.plist"
# 更精确的替换，只替换 CFBundleVersion 后面的值
sed -i '' "/<key>CFBundleVersion<\/key>/,/<string>/s/<string>$CURRENT_BUILD<\/string>/<string>$NEW_BUILD<\/string>/" "$IOS_DIR/ChineseWordsLearning/Info.plist"
echo "   ✅ Info.plist 已更新"

# 3. 更新 project.pbxproj
echo "📝 更新 project.pbxproj..."
sed -i '' "s/CURRENT_PROJECT_VERSION = $CURRENT_BUILD;/CURRENT_PROJECT_VERSION = $NEW_BUILD;/g" "$IOS_DIR/ChineseWordsLearning.xcodeproj/project.pbxproj"
echo "   ✅ project.pbxproj 已更新"

echo ""
echo "✅ Build 号已从 $CURRENT_BUILD 更新为 $NEW_BUILD"
echo ""
echo "💡 提示: 现在可以运行 ./build-ipa.sh 进行构建"


