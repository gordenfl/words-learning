# 修复 Xcode 设备选择器问题

## 问题原因
Xcode 显示 "iOS 26.1 is not installed"，导致 "Any iOS Device" 选项不可用。

## 解决方案

### 方案 1: 重新安装 iOS SDK（推荐）

1. **打开 Xcode 设置**
   - Xcode → Settings (或 Preferences)
   - 点击 "Platforms" (或 "Components") 标签

2. **检查 iOS SDK**
   - 查看 iOS 26.1 是否显示为已安装
   - 如果显示未安装，点击下载/安装

3. **如果已安装但仍有问题**
   - 删除 iOS 26.1 SDK
   - 重新下载安装

### 方案 2: 直接使用 Archive（最简单）

即使设备选择器不显示 "Any iOS Device"，你仍然可以直接 Archive：

1. **在 Xcode 中**
   - 确保选择了 "ChineseWordsLearning" scheme
   - 菜单栏：`Product` → `Archive`
   - Xcode 会自动使用正确的配置进行构建

2. **如果 Archive 按钮是灰色的**
   - 先尝试 `Product` → `Clean Build Folder` (Shift + Command + K)
   - 然后再次尝试 Archive

### 方案 3: 使用命令行构建

如果 Xcode GUI 有问题，可以使用命令行：

```bash
cd /Users/yiliu/Documents/GitHub/words-learning/mobile/ios

# 清理构建
xcodebuild clean -workspace ChineseWordsLearning.xcworkspace -scheme ChineseWordsLearning

# 创建 Archive（会自动选择正确的设备）
xcodebuild archive \
  -workspace ChineseWordsLearning.xcworkspace \
  -scheme ChineseWordsLearning \
  -configuration Release \
  -archivePath ./build/ChineseWordsLearning.xcarchive \
  -allowProvisioningUpdates
```

### 方案 4: 修复 Xcode 缓存

```bash
# 清理 Xcode 派生数据
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# 重启 Xcode
```

### 方案 5: 检查 Xcode 版本

确保使用最新版本的 Xcode：
- Xcode → About Xcode
- 如果有更新，更新到最新版本

## 快速解决（推荐）

**最简单的方法**：直接忽略设备选择器，使用 Archive：

1. 打开 Xcode 项目
2. 选择 "ChineseWordsLearning" scheme
3. 菜单栏：`Product` → `Archive`
4. 等待构建完成
5. 在 Organizer 中导出 IPA

即使设备选择器显示错误，Archive 功能通常仍然可以正常工作。




