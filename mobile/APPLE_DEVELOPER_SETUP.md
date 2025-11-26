# Apple Developer 中配置 Apple Sign-In 指南

## 重要说明

**好消息**：Apple Sign-In 与 Google/Facebook 不同，**不需要申请额外的参数或密钥**！

Apple Sign-In 使用的是您已有的 App ID 和 Bundle Identifier，不需要像 Google OAuth 那样需要 Client ID 和 Client Secret。

## 需要完成的配置步骤

### 1. 在 Apple Developer Portal 中确认 App ID

1. 登录 [Apple Developer Portal](https://developer.apple.com/account)
2. 进入 **Certificates, Identifiers & Profiles**
3. 选择 **Identifiers** → 找到您的 App ID（`com.gordenfl.wordslearning`）
4. 确认 App ID 已正确配置

**注意**：不需要在这里单独启用 "Sign in with Apple" capability，这会在 Xcode 中自动处理。

### 2. 在 Xcode 中添加 Capability（最重要）

这是**唯一必须手动配置**的步骤：

1. 打开 Xcode：
   ```bash
   cd mobile/ios
   open ChineseWordsLearning.xcworkspace
   ```

2. 选择项目：
   - 在左侧导航栏选择 **ChineseWordsLearning** 项目（蓝色图标）
   - 选择 **ChineseWordsLearning** target

3. 添加 Capability：
   - 点击顶部的 **Signing & Capabilities** 标签
   - 点击左上角的 **"+ Capability"** 按钮
   - 搜索并添加 **"Sign in with Apple"**

4. 验证：
   - 添加后，您应该看到 "Sign in with Apple" 出现在 Capabilities 列表中
   - 不需要任何额外配置

### 3. 在 App Store Connect 中启用（推荐，可选）

虽然这不是必须的，但建议启用：

1. 登录 [App Store Connect](https://appstoreconnect.apple.com)
2. 选择您的应用
3. 进入 **App Information** 页面
4. 找到 **"Sign in with Apple"** 部分
5. 启用该选项

**注意**：这一步是可选的，主要用于 App Store 审核时显示您的应用支持 Apple Sign-In。

## 不需要的配置

与 Google/Facebook 不同，Apple Sign-In **不需要**：

- ❌ Client ID
- ❌ Client Secret
- ❌ Service ID（除非使用 web 登录）
- ❌ 额外的 API 密钥
- ❌ 在代码中配置任何参数

## 为什么不需要额外参数？

Apple Sign-In 使用：
- **App ID**：您的 Bundle Identifier（`com.gordenfl.wordslearning`）
- **系统级认证**：直接使用 iOS 系统的 Apple ID 认证
- **自动配置**：Xcode 会自动处理证书和配置

这与 Google/Facebook 不同：
- Google 需要：Client ID、Client Secret、OAuth 配置
- Facebook 需要：App ID、App Secret、配置回调 URL
- Apple 只需要：App ID（已有）+ Capability（在 Xcode 中添加）

## 验证配置

### 方法 1：在 Xcode 中检查

1. 打开项目
2. 选择 target → Signing & Capabilities
3. 确认 "Sign in with Apple" 在列表中

### 方法 2：在代码中检查

运行应用后，Apple Sign-In 按钮应该：
- 在 iOS 设备/模拟器上显示
- 点击后能弹出 Apple 登录界面
- 登录成功后能正常使用

### 方法 3：检查日志

在 Xcode 控制台中，应该看到：
```
✅ Apple Sign-In is available
```

## 常见问题

### Q: 需要像 Google 那样申请 Client ID 吗？
**A:** 不需要。Apple Sign-In 使用您的 App ID，不需要额外的 Client ID。

### Q: 需要在 Apple Developer Portal 中单独启用吗？
**A:** 不需要。只需要在 Xcode 中添加 Capability 即可。

### Q: 为什么 Google/Facebook 需要参数，而 Apple 不需要？
**A:** 
- Google/Facebook 是第三方服务，需要注册应用并获取凭证
- Apple Sign-In 是 Apple 的系统服务，使用您的 App ID 即可

### Q: 如果添加 Capability 后仍然不工作？
**A:** 检查：
1. 是否在真实设备或模拟器上运行（Expo Go 不支持）
2. 是否已安装 `expo-apple-authentication` 包
3. 是否已运行 `npx expo prebuild`
4. 设备是否登录了 Apple ID

## 总结

**只需要做一件事**：在 Xcode 中添加 "Sign in with Apple" Capability。

这就是全部！不需要申请任何参数、密钥或配置。

