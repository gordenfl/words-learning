# 如何在 Xcode 中添加 "Sign in with Apple" Capability

## 步骤详解

### 步骤 1：打开 Xcode 项目

1. **打开终端**，进入项目目录：
   ```bash
   cd /Users/yiliu/Documents/GitHub/words-learning/mobile/ios
   open ChineseWordsLearning.xcworkspace
   ```

   **重要**：必须打开 `.xcworkspace` 文件，不是 `.xcodeproj` 文件！

2. **或者手动打开**：
   - 打开 Finder
   - 导航到 `mobile/ios` 目录
   - 双击 `ChineseWordsLearning.xcworkspace` 文件

### 步骤 2：选择项目和 Target

1. **在 Xcode 左侧导航栏**（Project Navigator）：
   - 点击最顶部的蓝色项目图标（`ChineseWordsLearning`）
   - 这会显示项目设置

2. **选择 Target**：
   - 在中间的主编辑区域
   - 点击 **TARGETS** 下的 **ChineseWordsLearning**（不是 PROJECT 下的）
   - 确保选中了正确的 target

### 步骤 3：打开 Signing & Capabilities 标签

1. **点击顶部标签栏**：
   - 找到并点击 **"Signing & Capabilities"** 标签
   - 它位于 "General"、"Signing & Capabilities"、"Info" 等标签中

2. **查看当前 Capabilities**：
   - 您会看到当前已添加的 Capabilities 列表
   - 可能包括：Push Notifications、Background Modes 等

### 步骤 4：添加 "Sign in with Apple" Capability

1. **点击 "+ Capability" 按钮**：
   - 在 "Signing & Capabilities" 标签的左上角
   - 有一个 **"+ Capability"** 按钮
   - 点击它

2. **搜索 Capability**：
   - 会弹出一个搜索/选择窗口
   - 在搜索框中输入：**"Sign in with Apple"**
   - 或直接滚动查找

3. **选择并添加**：
   - 找到 **"Sign in with Apple"**
   - 双击或点击添加
   - Capability 会自动添加到列表中

### 步骤 5：验证添加成功

添加后，您应该看到：

1. **Capability 出现在列表中**：
   - 在 "Signing & Capabilities" 标签中
   - 显示 "Sign in with Apple"
   - 通常显示一个绿色的对勾 ✅

2. **没有错误提示**：
   - 如果配置正确，不会有红色错误提示
   - 如果有错误，通常是签名或证书问题

## 详细截图说明

### 位置 1：项目导航栏
```
ChineseWordsLearning (蓝色图标) ← 点击这里
  ├── ChineseWordsLearning (target) ← 选择这个
  ├── Pods
  └── ...
```

### 位置 2：顶部标签栏
```
[General] [Signing & Capabilities] [Info] [Build Settings] ...
           ↑ 点击这个标签
```

### 位置 3：Capability 区域
```
+ Capability  ← 点击这个按钮
─────────────
Current Capabilities:
  - Push Notifications
  - Background Modes
  - Sign in with Apple  ← 添加后会显示在这里
```

## 常见问题

### Q1: 找不到 "+ Capability" 按钮？

**检查**：
1. 是否选择了正确的 target（ChineseWordsLearning）
2. 是否在 "Signing & Capabilities" 标签中
3. 是否在正确的位置（左上角）

**解决方案**：
- 确保选中了 TARGETS 下的 ChineseWordsLearning
- 不是 PROJECT 下的

### Q2: 添加后显示红色错误？

**可能原因**：
- 签名配置问题
- 证书问题

**解决方案**：
1. 检查 **Team** 设置：
   - 在 "Signing & Capabilities" 标签顶部
   - 确认 **Team** 选择了正确的团队
   - 如果没有，选择您的 Apple Developer 团队

2. 检查 **Signing Certificate**：
   - 确认使用的是正确的证书
   - 如果是自动签名，Xcode 会自动处理

### Q3: 添加后没有显示？

**检查**：
1. 是否真的添加成功
2. 尝试重新打开 Xcode
3. 检查项目文件是否保存

**解决方案**：
- 重新添加一次
- 保存项目（⌘ + S）
- 重新打开 Xcode

### Q4: 在模拟器上测试时不可用？

**说明**：
- Apple Sign-In 在模拟器上可能不可用
- 需要在真实设备上测试
- 这是正常现象

## 验证方法

### 方法 1：在 Xcode 中检查

1. 打开项目
2. 选择 target → Signing & Capabilities
3. 确认 "Sign in with Apple" 在列表中

### 方法 2：检查项目文件

```bash
cd mobile/ios
grep -r "com.apple.developer.applesignin" ChineseWordsLearning.xcodeproj
```

如果找到相关配置，说明已添加。

### 方法 3：检查 Entitlements 文件

```bash
cd mobile/ios
cat ChineseWordsLearning/ChineseWordsLearning.entitlements
```

应该包含：
```xml
<key>com.apple.developer.applesignin</key>
<array>
    <string>Default</string>
</array>
```

## 完整流程总结

1. ✅ 打开 `ChineseWordsLearning.xcworkspace`
2. ✅ 选择项目 → TARGETS → ChineseWordsLearning
3. ✅ 点击 "Signing & Capabilities" 标签
4. ✅ 点击 "+ Capability" 按钮
5. ✅ 搜索 "Sign in with Apple"
6. ✅ 添加 Capability
7. ✅ 验证添加成功（绿色对勾）
8. ✅ 保存项目（⌘ + S）

## 重要提示

### 必须使用 .xcworkspace

- ✅ 使用 `ChineseWordsLearning.xcworkspace`
- ❌ 不要使用 `ChineseWordsLearning.xcodeproj`

### 必须选择正确的 Target

- ✅ 选择 TARGETS 下的 ChineseWordsLearning
- ❌ 不要选择 PROJECT 下的

### 保存更改

添加 Capability 后：
- Xcode 会自动保存到项目文件
- 但建议手动保存（⌘ + S）
- 确保更改已写入磁盘

## 下一步

添加 Capability 后：

1. **保存项目**：⌘ + S
2. **重新构建**：
   ```bash
   cd mobile
   ./build-ipa.sh app-store
   ```
3. **上传到 TestFlight**
4. **测试功能**

## 如果仍然不可用

如果添加 Capability 后仍然不可用，检查：

1. **包是否安装**：
   ```bash
   cd mobile
   npm list expo-apple-authentication
   ```

2. **插件是否启用**：
   - 检查 `app.config.js` 中插件是否取消注释

3. **是否重新构建**：
   - 添加 Capability 后必须重新构建
   - 旧的 IPA 不包含新的 Capability

4. **是否重新上传**：
   - 必须上传新的构建
   - 旧的构建不包含新的配置

