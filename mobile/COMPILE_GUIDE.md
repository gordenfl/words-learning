# iOS 编译指南

## 方式 1: 使用 Xcode GUI（推荐）

### 步骤：

1. **打开项目**
   ```bash
   cd /Users/yiliu/Documents/GitHub/words-learning/mobile/ios
   open ChineseWordsLearning.xcworkspace
   ```
   或者直接在 Finder 中双击 `ChineseWordsLearning.xcworkspace`

2. **配置签名**
   - 在 Xcode 左侧项目导航器中，选择 "ChineseWordsLearning" 项目
   - 选择 "ChineseWordsLearning" target
   - 点击 "Signing & Capabilities" 标签
   - 勾选 "Automatically manage signing"
   - 选择你的 Team（Apple Developer 账号）

3. **选择构建目标**
   - 在顶部工具栏，选择 "Any iOS Device" 或你的真机设备
   - 不要选择模拟器

4. **创建 Archive**
   - 菜单栏：`Product` → `Archive`
   - 等待构建完成（可能需要几分钟）

5. **导出 IPA**
   - Archive 完成后，会自动打开 Organizer 窗口
   - 选择刚创建的 Archive
   - 点击 "Distribute App"
   - 选择分发方式：
     - **Ad Hoc**: 用于测试，可以安装到已注册的设备
     - **App Store**: 用于提交到 App Store
   - 按照向导完成导出
   - IPA 文件会保存到你选择的位置

---

## 方式 2: 使用命令行脚本

### 前提条件：
- 已配置好代码签名（在 Xcode 中配置）
- 已安装 Xcode Command Line Tools

### 使用方法：

```bash
cd /Users/yiliu/Documents/GitHub/words-learning/mobile

# Ad-Hoc 版本（用于测试）
./build-ipa.sh ad-hoc

# App Store 版本（用于提交）
./build-ipa.sh app-store
```

### 注意事项：
- 首次使用需要在 Xcode 中配置好签名
- 如果签名失败，请使用方式 1（Xcode GUI）
- IPA 文件会保存在 `ios/build/export/` 目录

---

## 方式 3: 直接使用 xcodebuild 命令

```bash
cd /Users/yiliu/Documents/GitHub/words-learning/mobile/ios

# 1. 清理
xcodebuild clean -workspace ChineseWordsLearning.xcworkspace -scheme ChineseWordsLearning

# 2. Archive
xcodebuild archive \
  -workspace ChineseWordsLearning.xcworkspace \
  -scheme ChineseWordsLearning \
  -configuration Release \
  -archivePath ./build/ChineseWordsLearning.xcarchive \
  -destination 'generic/platform=iOS' \
  -allowProvisioningUpdates

# 3. 导出 IPA（Ad-Hoc）
xcodebuild -exportArchive \
  -archivePath ./build/ChineseWordsLearning.xcarchive \
  -exportPath ./build/export \
  -exportOptionsPlist exportOptionsAdHoc.plist \
  -allowProvisioningUpdates
```

---

## 快速开始（最简单）

```bash
# 1. 打开 Xcode
cd /Users/yiliu/Documents/GitHub/words-learning/mobile/ios
open ChineseWordsLearning.xcworkspace

# 2. 在 Xcode 中：
#    - 配置签名（Signing & Capabilities）
#    - 选择 "Any iOS Device"
#    - Product → Archive
#    - 等待完成后点击 "Distribute App"
#    - 选择 "Ad Hoc" 或 "App Store"
#    - 完成导出
```

---

## 常见问题

### 1. 签名错误
**问题**: "No signing certificate found"
**解决**: 
- 在 Xcode 中打开项目
- 配置 Signing & Capabilities
- 选择你的 Team

### 2. Archive 按钮是灰色的
**解决**:
- 确保选择了 "Any iOS Device" 或真机设备（不是模拟器）
- 确保选择了正确的 Scheme（ChineseWordsLearning）
- 尝试 `Product` → `Clean Build Folder` (Shift + Command + K)

### 3. 找不到 Scheme
**解决**:
- Product → Scheme → Manage Schemes
- 确保 "ChineseWordsLearning" scheme 存在并勾选 "Shared"

---

## 推荐流程

1. **首次编译**：使用 Xcode GUI，配置好签名
2. **后续编译**：可以使用命令行脚本快速构建
3. **测试版本**：使用 Ad-Hoc 方式
4. **正式发布**：使用 App Store 方式




