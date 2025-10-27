# Google OAuth 故障排除指南

## 🚨 当前错误

```
ERROR 400: Request details: redirect_uri=exp://192.168.101.95:8081flowName=GeneralOAuthFlow
```

## 🔍 问题分析

这个错误表明Google OAuth正在使用错误的重定向URI。即使我们在代码中设置了正确的URI，Expo可能仍然在使用内部生成的URI。

## ✅ 解决方案

### 1. 检查Google Cloud Console配置

请确保在Google Cloud Console中：

1. 进入 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的项目
3. 导航到：APIs & Services → Credentials
4. 找到你的Web OAuth客户端（Client ID: `123044373895-bf1p23r83kdcabs4frpvtq9o38k2uo9m.apps.googleusercontent.com`）
5. 点击编辑
6. 在"Authorized redirect URIs"中添加：

   ```
   https://auth.expo.io/@gordenfl/words-learning
   ```

### 2. 验证配置

确保以下URI都已添加到Google Cloud Console的Web OAuth客户端中：

```
https://auth.expo.io/@gordenfl/words-learning
```

### 3. 如果仍然出现错误

如果仍然出现 `exp://` 相关的错误，可能需要：

1. 清除Expo缓存：

   ```bash
   npx expo start --clear
   ```

2. 或者使用开发构建而不是Expo Go：

   ```bash
   npx expo run:ios
   # 或
   npx expo run:android
   ```

## 🔧 代码修复

我已经修复了代码中的重定向URI问题：

```javascript
// 强制使用Expo代理的重定向URI
const redirectUri = "https://auth.expo.io/@gordenfl/words-learning";
```

## 📱 测试步骤

1. 确保Google Cloud Console配置正确
2. 重新启动Expo服务器
3. 扫描二维码打开应用
4. 点击"使用 Google 登录"按钮
5. 应该会打开Google登录页面，而不是出现400错误

## 🆘 如果问题仍然存在

如果问题仍然存在，请检查：

1. Google Cloud Console中的OAuth客户端类型是否为"Web application"
2. 重定向URI是否完全匹配（包括大小写）
3. 项目是否已启用Google+ API或Google Identity API
4. 是否在正确的Google Cloud项目中配置

## 📞 联系支持

如果以上步骤都无法解决问题，请提供：

1. Google Cloud Console的截图
2. 完整的错误日志
3. 当前使用的Expo版本
