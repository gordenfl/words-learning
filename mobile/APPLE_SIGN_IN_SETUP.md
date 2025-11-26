# Apple Sign-In 设置指南

## 概述

为了符合 App Store 的 Guideline 4.8 要求，应用已添加了 "Sign in with Apple" 功能。当应用使用第三方登录服务（如 Google、Facebook）时，必须提供 Apple 登录作为替代选项。

## 已完成的更改

### 后端
1. ✅ 更新了 `backend/models/User.js`：
   - 添加了 `appleId` 字段
   - 在 `authProvider` enum 中添加了 `"apple"`

2. ✅ 更新了 `backend/routes/auth.js`：
   - 添加了 `POST /auth/apple` 路由
   - 支持 Apple 用户登录和账户创建
   - 更新了密码更改逻辑以支持 Apple 用户

### 前端
1. ✅ 创建了 `mobile/src/components/AppleSignInButton.js` 组件
2. ✅ 更新了 `mobile/src/screens/LoginScreen.js`：
   - 添加了 Apple 登录按钮（显示在 Google 和 Facebook 按钮之前）
3. ✅ 更新了 `mobile/src/services/api.js`：
   - 添加了 `appleSignIn` API 方法
4. ✅ 更新了 `mobile/src/screens/ProfileScreen.js`：
   - 支持 Apple 用户设置密码
5. ✅ 更新了 `mobile/app.config.js`：
   - 添加了 `expo-apple-authentication` 插件

## 需要手动完成的步骤

### 1. 安装依赖包

由于 npm 安装可能遇到问题，请手动执行：

```bash
cd mobile
rm -rf node_modules/.expo-*
npm install expo-apple-authentication
```

或者如果仍有问题，可以尝试：

```bash
cd mobile
rm -rf node_modules
npm install
```

### 2. 重新运行 prebuild

安装包后，需要重新生成 iOS 项目：

```bash
cd mobile
npx expo prebuild --clean
```

### 3. 在 Xcode 中配置 Apple Sign-In Capability

1. 打开 Xcode：
   ```bash
   cd mobile/ios
   open ChineseWordsLearning.xcworkspace
   ```

2. 选择项目 → ChineseWordsLearning target → Signing & Capabilities

3. 点击 "+ Capability"

4. 添加 "Sign in with Apple" capability

5. 确保在 App Store Connect 中已启用 Apple Sign-In：
   - 登录 [App Store Connect](https://appstoreconnect.apple.com)
   - 选择您的应用
   - 转到 "App Information"
   - 在 "Sign in with Apple" 部分启用

### 4. 重新构建应用

```bash
cd mobile
./build-ipa.sh app-store
```

## 验证

1. 在 iOS 设备上运行应用
2. 在登录界面，应该能看到 "使用 Apple 登录" 按钮（黑色背景，白色文字）
3. 点击按钮应该能触发 Apple 登录流程
4. 登录成功后应该能正常使用应用

## 注意事项

1. **Apple Sign-In 仅在 iOS 上可用**：组件会自动检测平台，只在 iOS 上显示
2. **需要真实设备或模拟器**：Apple Sign-In 在 Expo Go 中不可用
3. **需要 Apple Developer 账户**：必须在 App Store Connect 中启用 Apple Sign-In
4. **隐私邮箱**：Apple 可能提供私有中继邮箱（`@privaterelay.appleid.com`），后端已处理这种情况

## 提交到 App Store 时的说明

如果审核团队询问，可以回复：

> "我们的应用已实现 'Sign in with Apple' 功能，它符合 Guideline 4.8 的所有要求：
> - 只收集用户的姓名和邮箱地址
> - 允许用户保持邮箱地址对各方私密（通过 Apple 的私有中继邮箱）
> - 不收集应用交互用于广告目的
> 
> Apple 登录按钮显示在登录界面的社交登录区域，位于 Google 和 Facebook 登录按钮之前。"

## 故障排除

### 问题：Apple 登录按钮不显示
- 检查是否在 iOS 设备/模拟器上运行
- 检查是否已安装 `expo-apple-authentication` 包
- 检查是否已运行 `npx expo prebuild`

### 问题：点击按钮后没有反应
- 检查 Xcode 中是否已添加 "Sign in with Apple" capability
- 检查 App Store Connect 中是否已启用 Apple Sign-In
- 查看控制台日志以获取详细错误信息

### 问题：登录失败
- 检查后端 `/auth/apple` 路由是否正常工作
- 检查数据库连接是否正常
- 查看后端日志以获取详细错误信息

