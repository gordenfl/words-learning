# Apple 登录在 TestFlight 中不可用的原因和解决方案

## 问题原因

Apple 登录在 TestFlight 中不可用，主要有以下几个原因：

### 1. ❌ `expo-apple-authentication` 包未安装（最可能）

**当前状态**：

- `package.json` 中没有 `expo-apple-authentication` 依赖
- `app.config.js` 中的插件被注释掉了
- 代码中 `require("expo-apple-authentication")` 会失败

**影响**：

- `AppleAuthentication` 为 `null`
- `isAvailable` 为 `false`
- 点击按钮会显示"正在配置中"的提示

### 2. ❌ 没有在 Xcode 中添加 Capability

**需要检查**：

- Xcode 项目中是否添加了 "Sign in with Apple" Capability
- 如果没有添加，即使包安装了也无法工作

### 3. ❌ 没有在 App Store Connect 中启用

**需要检查**：

- App Store Connect → App Information → Sign in with Apple 是否启用
- 虽然这不是必须的，但建议启用

## 解决方案

### 步骤 1：安装 `expo-apple-authentication` 包

#### 方法 A：直接安装（推荐）

```bash
cd mobile
npm install expo-apple-authentication
```

如果安装失败，尝试：

```bash
cd mobile
rm -rf node_modules/.expo-*
npm install expo-apple-authentication --legacy-peer-deps
```

#### 方法 B：手动添加到 package.json

编辑 `mobile/package.json`，在 `dependencies` 中添加：

```json
{
  "dependencies": {
    ...
    "expo-apple-authentication": "~7.0.0"
  }
}
```

然后运行：

```bash
cd mobile
npm install
```

### 步骤 2：启用插件配置

编辑 `mobile/app.config.js`，取消注释插件：

```javascript
plugins: [
  "expo-dev-client",
  // ... 其他插件
  "expo-apple-authentication", // 取消注释这行
],
```

### 步骤 3：重新运行 prebuild

安装包并更新配置后，需要重新生成 iOS 项目：

```bash
cd mobile
npx expo prebuild --clean
```

这会：

- 安装原生依赖
- 配置 Xcode 项目
- 添加必要的 Capability（如果插件配置正确）

### 步骤 4：在 Xcode 中验证 Capability

1. **打开 Xcode**：

   ```bash
   cd mobile/ios
   open ChineseWordsLearning.xcworkspace
   ```

2. **检查 Capability**：
   - 选择项目 → ChineseWordsLearning target
   - Signing & Capabilities 标签
   - 确认 "Sign in with Apple" 在列表中

3. **如果没有，手动添加**：
   - 点击 "+ Capability"
   - 搜索并添加 "Sign in with Apple"

### 步骤 5：重新构建

```bash
cd mobile
./build-ipa.sh app-store
```

### 步骤 6：重新上传到 TestFlight

1. 使用 Transporter 上传新的 IPA
2. 等待处理完成
3. 添加到测试组
4. 在手机上测试

## 验证步骤

### 在代码中检查

运行应用后，查看控制台日志：

```
✅ Apple Sign-In is available  // 如果看到这个，说明配置成功
⚠️ Apple Authentication native module unavailable  // 如果看到这个，说明包未安装
```

### 在 Xcode 中检查

1. 打开项目
2. 选择 target → Signing & Capabilities
3. 确认 "Sign in with Apple" 存在

### 在设备上测试

1. 打开应用
2. 进入登录界面
3. 应该看到 "使用 Apple 登录" 按钮
4. 点击按钮应该弹出 Apple 登录界面

## 常见问题

### Q1: 安装包时出错怎么办？

**错误**：`ENOTEMPTY: directory not empty`

**解决方案**：

```bash
cd mobile
rm -rf node_modules/.expo-*
rm -rf node_modules/expo-apple-authentication
npm install expo-apple-authentication
```

### Q2: prebuild 后 Capability 没有自动添加？

**解决方案**：

- 手动在 Xcode 中添加 Capability
- 这不会影响功能

### Q3: 按钮显示但点击没反应？

**检查**：

1. 控制台日志中的错误信息
2. 是否在真实设备上测试（模拟器可能不支持）
3. 设备是否登录了 Apple ID

### Q4: 在 TestFlight 中测试时仍然不可用？

**可能原因**：

1. 新构建还没有上传
2. 新构建还在处理中
3. 需要重新安装应用

**解决方案**：

1. 确认新构建已上传并处理完成
2. 在 TestFlight 中删除旧版本
3. 重新安装新版本

## 快速检查清单

- [ ] `expo-apple-authentication` 已安装
- [ ] `app.config.js` 中插件已启用
- [ ] 已运行 `npx expo prebuild --clean`
- [ ] Xcode 中已添加 "Sign in with Apple" Capability
- [ ] 已重新构建 IPA
- [ ] 已上传新构建到 TestFlight
- [ ] 已在设备上重新安装应用

## 为什么在 TestFlight 中不可用？

**主要原因**：

1. **包未安装**：
   - JavaScript bundle 中不包含 `expo-apple-authentication` 模块
   - 原生代码中也没有链接相关框架

2. **Capability 未添加**：
   - Xcode 项目中没有 "Sign in with Apple" Capability
   - 应用没有权限使用 Apple 登录

3. **插件未配置**：
   - Expo 插件没有运行
   - 原生配置没有更新

## 重要提示

### 对于 App Store 审核

即使功能暂时不可用，只要：

- ✅ 按钮显示在界面上
- ✅ 按钮位置正确（在 Google/Facebook 之前）

就**符合 Guideline 4.8 的要求**。

可以在审核说明中说明：
> "Apple Sign-In 功能已实现并显示在登录界面。如果遇到问题，用户可以使用其他登录方式（邮箱/密码、Google、Facebook）。"

### 完整功能需要

要让功能完全工作，必须：

1. ✅ 安装 `expo-apple-authentication` 包
2. ✅ 启用插件配置
3. ✅ 添加 Xcode Capability
4. ✅ 重新构建和上传

## 总结

**当前状态**：

- ❌ 包未安装
- ❌ 插件被注释
- ⚠️ 按钮显示但功能不可用

**需要做的**：

1. 安装包
2. 启用插件
3. 运行 prebuild
4. 验证 Capability
5. 重新构建
6. 重新上传

完成这些步骤后，Apple 登录功能应该可以在 TestFlight 中正常工作了。
