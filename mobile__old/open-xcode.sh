#!/bin/bash

# 打开 Xcode 项目的脚本

cd /Users/yiliu/Documents/GitHub/words-learning/mobile__old/ios

# 关闭所有 Xcode 实例
killall Xcode 2>/dev/null
sleep 2

# 打开项目
open -a Xcode ChineseWordsLearning.xcworkspace

# 等待并激活窗口
sleep 3
osascript -e 'tell application "Xcode" to activate' 2>/dev/null

echo "✅ Xcode 项目已打开"
echo ""
echo "如果窗口仍然没有出现，请尝试："
echo "1. 在 Dock 中点击 Xcode 图标"
echo "2. 菜单栏：Window → Bring All to Front"
echo "3. 或者手动在 Finder 中双击 ChineseWordsLearning.xcworkspace"




