# Google 登录配置指南

## 📋 配置步骤

### 1. 在 Google Cloud Console 中创建 OAuth 2.0 客户端

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的项目或创建新项目
3. 导航到：APIs & Services → Credentials
4. 点击 "Create Credentials" → "OAuth 2.0 Client IDs"

### 2. 创建 Web 应用程序客户端

1. 选择 "Web application" 类型
2. 输入名称：`Words Learning Web Client`
3. 在 "Authorized redirect URIs" 中添加：

   ```
   https://auth.expo.io/@gordenfl/words-learning
   ```

4. 点击 "Create"
5. 复制生成的 Client ID 和 Client Secret

### 3. 创建 Android 应用程序客户端

1. 选择 "Android" 类型
2. 输入名称：`Words Learning Android Client`
3. 输入包名：`com.wordslearning.app`
4. 输入 SHA-1 指纹：`89:E5:F6:46:42:3C:C2:39:3B:42:D3:05:CA:64:2D:ED:A2:3C:66:D2`
5. 点击 "Create"
6. 复制生成的 Client ID

### 4. 创建 iOS 应用程序客户端

1. 选择 "iOS" 类型
2. 输入名称：`Words Learning iOS Client`
3. 输入 Bundle ID：`com.gordenfl.wordslearning`
4. 点击 "Create"
5. 复制生成的 Client ID

### 5. 更新配置文件

编辑 `mobile/src/config/googleAuth.js` 文件，替换以下占位符：

```javascript
const GoogleAuthConfig = {
  OAuth: {
    CLIENT_ID: {
      ANDROID: "你的Android客户端ID",
      IOS: "你的iOS客户端ID", 
      WEB: "你的Web客户端ID",
    },
    CLIENT_SECRET: {
      WEB: "你的Web客户端密钥",
    },
    // ... 其他配置保持不变
  },
  // ... 其他配置保持不变
};
```

### 6. 在 Google Cloud Console 中添加重定向URI

在 Web 客户端的 "Authorized redirect URIs" 中添加：

```
https://auth.expo.io/@gordenfl/words-learning
```

## 🔧 测试步骤

1. 更新配置文件后，重新启动 Expo 服务器
2. 扫描二维码打开应用
3. 点击 "使用 Google 登录" 按钮
4. 完成 Google OAuth 流程
5. 检查是否成功登录并跳转到主页面

## ❗ 注意事项

- 确保所有 Client ID 和 Client Secret 都正确配置
- 重定向 URI 必须与 Google Cloud Console 中配置的完全一致
- 如果遇到 "应用未通过Google验证" 错误，需要在 Google Cloud Console 中完成应用验证流程
- 开发阶段可以使用测试用户，生产环境需要完成应用验证

## 🐛 常见问题

### 1. Error 400: invalid_request

- 检查重定向 URI 是否正确配置
- 确保 Client ID 和 Client Secret 正确

### 2. 应用未通过Google验证

- 在 Google Cloud Console 中完成应用验证
- 或者添加测试用户到 OAuth 客户端

### 3. 重定向 URI 不匹配

- 确保 Google Cloud Console 中的重定向 URI 与应用中使用的完全一致
- 检查是否有额外的参数或路径
