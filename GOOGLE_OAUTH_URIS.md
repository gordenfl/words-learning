# Google OAuth 重定向URI配置

## 🚨 当前错误

```
ERROR 400: Request details: redirect_uri=flowName=GeneralOAuthFlow
```

## 🔧 解决方案

### 1. 在Google Cloud Console中添加重定向URI

请访问 [Google Cloud Console](https://console.cloud.google.com/) 并添加以下重定向URI：

1. 进入：**APIs & Services** → **Credentials**
2. 找到你的Web OAuth客户端（Client ID: `123044373895-bf1p23r83kdcabs4frpvtq9o38k2uo9m.apps.googleusercontent.com`）
3. 点击**编辑**
4. 在"**Authorized redirect URIs**"中添加以下URI：

```
https://auth.expo.io/@gordenfl/words-learning
https://auth.expo.io/@gordenfl/words-learning/
https://auth.expo.io/@gordenfl/words-learning?flowName=GeneralOAuthFlow
```

### 2. 为什么需要多个URI？

- `https://auth.expo.io/@gordenfl/words-learning` - 基本URI
- `https://auth.expo.io/@gordenfl/words-learning/` - 带斜杠的URI
- `https://auth.expo.io/@gordenfl/words-learning?flowName=GeneralOAuthFlow` - 带flowName参数的URI

### 3. 验证配置

确保所有三个URI都已添加到Google Cloud Console中，然后重新测试Google登录功能。

## 📱 测试步骤

1. 添加所有重定向URI到Google Cloud Console
2. 重新启动Expo服务器
3. 扫描二维码打开应用
4. 点击"使用 Google 登录"按钮
5. 应该能正常完成OAuth流程

## 🔍 如果仍有问题

如果添加了所有URI后仍有问题，请检查：

1. Google Cloud Console中的OAuth客户端类型是否为"Web application"
2. 所有URI是否完全匹配（包括大小写和特殊字符）
3. 项目是否已启用Google+ API或Google Identity API
