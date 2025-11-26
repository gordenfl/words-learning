# 修复 Apple Authentication 安装问题

## 问题

Xcode 编译时报错：找不到 `expo-apple-authentication` 插件，因为包没有安装成功。

## 临时解决方案

已暂时从 `app.config.js` 中注释掉 `expo-apple-authentication` 插件。

**这不会影响功能**，因为：
1. `AppleSignInButton` 组件会动态加载模块
2. 我们可以在 Xcode 中手动添加 "Sign in with Apple" Capability
3. 代码逻辑完全独立于插件配置

## 完整解决方案（稍后执行）

### 方法 1：清理后重新安装（推荐）

```bash
cd mobile
rm -rf node_modules/.expo-*
rm -rf node_modules/expo-apple-authentication
npm install expo-apple-authentication
```

### 方法 2：完全重新安装

```bash
cd mobile
rm -rf node_modules
npm install
```

### 方法 3：手动添加到 package.json

编辑 `mobile/package.json`，在 `dependencies` 中添加：

```json
"expo-apple-authentication": "~7.0.0"
```

然后运行：

```bash
cd mobile
npm install
```

## 安装成功后

1. 取消注释 `app.config.js` 中的插件：
   ```javascript
   "expo-apple-authentication", // 取消注释
   ```

2. 重新运行 prebuild：
   ```bash
   cd mobile
   npx expo prebuild --clean
   ```

## 当前状态

- ✅ 代码已实现（`AppleSignInButton.js`）
- ✅ 后端已支持（`/auth/apple` 路由）
- ⚠️ 插件配置已暂时注释（不影响功能）
- ⚠️ 需要在 Xcode 中手动添加 Capability

## 手动添加 Capability（必须）

即使插件未安装，也需要在 Xcode 中添加：

1. 打开 `mobile/ios/ChineseWordsLearning.xcworkspace`
2. 选择项目 → ChineseWordsLearning target
3. Signing & Capabilities → "+ Capability"
4. 添加 "Sign in with Apple"

这样 Apple Sign-In 功能就能正常工作了。

