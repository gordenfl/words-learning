# iOS 26.1 设备选择问题修复

## 重要说明

### ❌ 不需要模拟器
- **打包 IPA 安装到真机不需要模拟器**
- 你的手机 iOS 26.1 是真机，不是模拟器
- 只需要 iOS SDK（已经安装了）

### ✅ 需要什么
- iOS 26.1 SDK（已安装 ✓）
- iOS 26.1 运行时组件（可能需要安装）

## 问题原因

Xcode 显示 "iOS 26.1 is not installed" 可能是因为：
1. iOS 26.1 的运行时组件没有完全安装
2. Xcode 的组件管理器需要更新

## 解决方案

### 方案 1: 安装 iOS 26.1 运行时（推荐）

1. **打开 Xcode**
2. **菜单栏**：`Xcode` → `Settings` (或 `Preferences`)
3. **点击 `Platforms` 标签**（或 `Components`）
4. **查找 iOS 26.1**
   - 如果显示 "Download" 或 "Install"，点击安装
   - 如果显示已安装但有问题，先删除再重新安装
5. **等待下载完成**（可能需要一些时间）

### 方案 2: 直接尝试 Archive（可能可以工作）

即使显示错误，有时 Archive 仍然可以工作：

1. 在 Xcode 中
2. 菜单栏：`Product` → `Archive`
3. 如果成功，就继续导出 IPA
4. 如果失败，再安装运行时组件

### 方案 3: 使用命令行强制构建

```bash
cd /Users/yiliu/Documents/GitHub/words-learning/mobile/ios

# 尝试 Archive，忽略设备选择器的问题
xcodebuild archive \
  -workspace ChineseWordsLearning.xcworkspace \
  -scheme ChineseWordsLearning \
  -configuration Release \
  -archivePath ./build/ChineseWordsLearning.xcarchive \
  -destination 'generic/platform=iOS' \
  -allowProvisioningUpdates
```

### 方案 4: 检查 Xcode 命令行工具

```bash
# 检查 Xcode 路径
xcode-select -p

# 如果路径不对，设置正确路径
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

## 快速检查清单

- [ ] 打开 Xcode → Settings → Platforms
- [ ] 检查 iOS 26.1 是否完全安装
- [ ] 如果未安装，点击下载/安装
- [ ] 等待安装完成
- [ ] 重启 Xcode
- [ ] 再次尝试 Archive

## 重要提示

**即使设备选择器不显示 "Any iOS Device"，你仍然可以：**

1. 直接使用 `Product` → `Archive`
2. 或者使用命令行构建
3. 真机打包**不需要模拟器**，只需要 SDK 和运行时组件




