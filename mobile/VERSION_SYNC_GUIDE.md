# 版本号同步指南

## 重要：版本号必须一致！

**是的，Xcode 项目中的 Bundle Version 和 `app.config.js` 中的 `buildNumber` 必须完全一致！**

如果不一致，可能导致：
- ❌ TestFlight 安装失败
- ❌ 版本冲突
- ❌ 构建错误
- ❌ App Store 提交被拒绝

## 需要同步的三个地方

### 1. `mobile/app.config.js`
```javascript
ios: {
  buildNumber: "10",  // ← 源配置
  // ...
}
```

### 2. `mobile/ios/ChineseWordsLearning/Info.plist`
```xml
<key>CFBundleVersion</key>
<string>10</string>  <!-- ← 必须与 buildNumber 一致 -->
```

### 3. `mobile/ios/ChineseWordsLearning.xcodeproj/project.pbxproj`
```
CURRENT_PROJECT_VERSION = 10;  // ← 必须与 buildNumber 一致
MARKETING_VERSION = 1.0.1;     // ← 这是版本号（Version），不是 Build Number
```

## 版本号 vs Build Number

### Version（版本号）
- **位置**：`app.config.js` 中的 `version`
- **Xcode**：`MARKETING_VERSION`
- **Info.plist**：`CFBundleShortVersionString`
- **示例**：`"1.0.1"`
- **用途**：用户看到的版本号
- **规则**：可以相同，但通常递增（1.0.1 → 1.0.2）

### Build Number（构建号）
- **位置**：`app.config.js` 中的 `buildNumber`
- **Xcode**：`CURRENT_PROJECT_VERSION`
- **Info.plist**：`CFBundleVersion`
- **示例**：`"10"`
- **用途**：内部构建标识
- **规则**：**每次构建必须递增**（8 → 9 → 10）

## 如何同步版本号

### 方法 1：使用 Expo prebuild（推荐）

当您修改 `app.config.js` 后：

```bash
cd mobile
npx expo prebuild --clean
```

这会自动同步所有配置到 Xcode 项目。

### 方法 2：手动同步

如果不想运行 prebuild，需要手动更新三个地方：

1. **更新 `app.config.js`**：
   ```javascript
   buildNumber: "11", // 递增
   ```

2. **更新 `Info.plist`**：
   ```xml
   <key>CFBundleVersion</key>
   <string>11</string>
   ```

3. **更新 `project.pbxproj`**：
   ```
   CURRENT_PROJECT_VERSION = 11;
   ```

## 当前配置状态

✅ **已修复**：所有三个地方现在都是 **10**

- `app.config.js`: `buildNumber: "10"` ✅
- `Info.plist`: `CFBundleVersion: "10"` ✅
- `project.pbxproj`: `CURRENT_PROJECT_VERSION = 10` ✅

## 最佳实践

### 递增 Build Number 的流程

1. **修改源配置**（`app.config.js`）：
   ```javascript
   buildNumber: "11", // 从 10 改为 11
   ```

2. **运行 prebuild**（自动同步）：
   ```bash
   npx expo prebuild --clean
   ```

3. **验证同步**：
   ```bash
   # 检查 Info.plist
   grep -A 1 "CFBundleVersion" mobile/ios/ChineseWordsLearning/Info.plist
   
   # 检查 project.pbxproj
   grep "CURRENT_PROJECT_VERSION" mobile/ios/ChineseWordsLearning.xcodeproj/project.pbxproj
   ```

4. **构建**：
   ```bash
   ./build-ipa.sh app-store
   ```

### 何时递增 Build Number

- ✅ 每次上传到 TestFlight 前
- ✅ 每次提交到 App Store 前
- ✅ 如果 TestFlight 显示版本冲突
- ✅ 如果构建失败提示版本号问题

### 何时递增 Version

- ✅ 发布新功能
- ✅ 修复重要 bug
- ✅ 准备 App Store 发布

## 常见问题

### Q: 如果版本号不一致会怎样？

**A:** 可能导致：
- TestFlight 无法安装
- 构建失败
- 版本冲突错误

### Q: 可以跳过 prebuild 吗？

**A:** 可以，但必须手动同步三个地方。**强烈建议使用 prebuild**。

### Q: Build Number 可以重复吗？

**A:** **不可以！** 每次构建必须使用新的 Build Number。App Store Connect 会拒绝重复的 Build Number。

### Q: Version 和 Build Number 的关系？

**A:** 
- **Version**：用户看到的版本（如 1.0.1）
- **Build Number**：内部构建标识（如 10）
- 同一个 Version 可以有多个 Build Number（1.0.1 的 Build 8, 9, 10...）

## 检查清单

在每次构建前，确认：

- [ ] `app.config.js` 中的 `buildNumber` 已更新
- [ ] `Info.plist` 中的 `CFBundleVersion` 已同步
- [ ] `project.pbxproj` 中的 `CURRENT_PROJECT_VERSION` 已同步
- [ ] 所有三个值完全一致
- [ ] Build Number 比上次构建更高

## 快速验证命令

```bash
# 检查所有版本号配置
cd mobile

echo "=== app.config.js ==="
grep -A 1 "buildNumber" app.config.js

echo "=== Info.plist ==="
grep -A 1 "CFBundleVersion" ios/ChineseWordsLearning/Info.plist

echo "=== project.pbxproj ==="
grep "CURRENT_PROJECT_VERSION" ios/ChineseWordsLearning.xcodeproj/project.pbxproj | head -1
```

所有输出应该显示相同的数字！

