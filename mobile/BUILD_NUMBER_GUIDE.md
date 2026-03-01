# Build 号管理指南

## 📋 重要规则

**每次有改动重新编译时，build 号必须加 1！**

## 🔢 当前 Build 号

**当前 Build 号：20**

## 📝 需要同步的三个地方

每次更新 build 号时，必须同时更新以下三个文件：

### 1. `mobile/app.config.js`
```javascript
ios: {
  buildNumber: "20",  // ← 更新这里
  // ...
}
```

### 2. `mobile/ios/ChineseWordsLearning/Info.plist`
```xml
<key>CFBundleVersion</key>
<string>20</string>  <!-- ← 更新这里 -->
```

### 3. `mobile/ios/ChineseWordsLearning.xcodeproj/project.pbxproj`
```
CURRENT_PROJECT_VERSION = 20;  // ← 更新这里（可能有多个地方）
```

## 🚀 快速更新方法

### 方法 1：使用脚本（推荐）

创建一个简单的脚本来递增 build 号：

```bash
# 在 mobile 目录下运行
./increment-build.sh
```

### 方法 2：手动更新

1. 打开 `mobile/app.config.js`，将 `buildNumber` 加 1
2. 打开 `mobile/ios/ChineseWordsLearning/Info.plist`，将 `CFBundleVersion` 加 1
3. 打开 `mobile/ios/ChineseWordsLearning.xcodeproj/project.pbxproj`，搜索 `CURRENT_PROJECT_VERSION`，将所有值加 1

### 方法 3：使用 prebuild（会覆盖手动修改）

```bash
cd mobile
# 先更新 app.config.js 中的 buildNumber
# 然后运行：
npx expo prebuild --clean --platform ios
```

这会根据 `app.config.js` 自动更新 `Info.plist`，但 `project.pbxproj` 可能需要手动更新。

## ⚠️ 注意事项

1. **Build 号必须递增**：不能重复使用已使用的 build 号
2. **三个地方必须一致**：不一致会导致构建失败或版本冲突
3. **TestFlight 要求**：每次上传到 TestFlight 的 build 号必须大于之前的版本

## 📊 Build 号历史

- 20 - 当前版本（2024-11-29）
- 11 - 之前版本
- ...

## 🔍 验证 Build 号

构建前，运行以下命令验证所有地方的 build 号是否一致：

```bash
cd mobile

# 检查 app.config.js
grep "buildNumber" app.config.js

# 检查 Info.plist
grep -A 1 "CFBundleVersion" ios/ChineseWordsLearning/Info.plist

# 检查 project.pbxproj
grep "CURRENT_PROJECT_VERSION" ios/ChineseWordsLearning.xcodeproj/project.pbxproj
```

所有输出应该显示相同的数字。


