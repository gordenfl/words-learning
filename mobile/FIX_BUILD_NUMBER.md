# 修复 Build Number 不更新问题

## 问题原因

Build Number 在多个地方配置，需要同步更新：

1. **app.config.js** - Expo 配置文件（源配置）
2. **Info.plist** - iOS 应用信息文件
3. **project.pbxproj** - Xcode 项目文件（CURRENT_PROJECT_VERSION）

如果只修改了 Xcode 中的设置，Expo 的配置可能会覆盖它。

## 当前配置状态

- `app.config.js`: buildNumber = "4"
- `Info.plist`: CFBundleVersion = "3"  
- `project.pbxproj`: CURRENT_PROJECT_VERSION = 6

**这些值不一致！**

## 解决方案

### 方法 1: 修改 app.config.js（推荐）

这是 Expo 项目的正确方式：

1. **修改 `mobile/app.config.js`**：
   ```javascript
   ios: {
     buildNumber: "5",  // 改成新值
     // ...
   }
   ```

2. **重新同步配置**：
   ```bash
   cd /Users/yiliu/Documents/GitHub/words-learning/mobile
   npx expo prebuild --clean
   ```

3. **重新 Archive**

### 方法 2: 直接修改 Xcode 项目（如果不用 Expo 同步）

如果不想用 Expo 同步，需要修改三个地方：

1. **Xcode 中修改**：
   - 项目 → ChineseWordsLearning target
   - General → Identity → Build: 改成新值（如 "5"）

2. **修改 Info.plist**：
   - 打开 `ios/ChineseWordsLearning/Info.plist`
   - 修改 `CFBundleVersion` 的值

3. **清理并重新构建**：
   - Product → Clean Build Folder (Shift + Command + K)
   - 重新 Archive

### 方法 3: 同时修改所有位置（确保一致）

```bash
# 1. 修改 app.config.js
# 2. 运行 prebuild 同步
cd /Users/yiliu/Documents/GitHub/words-learning/mobile
npx expo prebuild --clean

# 3. 验证配置
# 检查 Info.plist 和 project.pbxproj 是否已更新
```

## 验证 Build Number

Archive 完成后，检查：

1. **在 Xcode Organizer 中**：
   - 选择 Archive
   - 查看 Build 号

2. **或者检查 IPA**：
   ```bash
   # 解压 IPA 检查
   unzip -q YourApp.ipa
   plutil -p Payload/YourApp.app/Info.plist | grep CFBundleVersion
   ```

## 推荐流程

**对于 Expo 项目，推荐使用方法 1**：

1. 修改 `app.config.js` 中的 `buildNumber`
2. 运行 `npx expo prebuild --clean`
3. 在 Xcode 中 Archive
4. 验证 Build Number 是否正确

这样可以确保所有配置保持一致。




