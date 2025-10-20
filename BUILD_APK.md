# Android APK 打包指南

## 🎯 打包并连接外网服务器

本指南将帮你构建 Android APK，连接到 gordenfl.com 服务器。

---

## 📋 准备工作

### **1. 配置已自动完成** ✅

- ✅ `mobile/config.js` - 自动切换开发/生产环境

  ```javascript
  // 开发模式（Expo Go）: 192.168.101.95:3003
  // 生产模式（APK）: gordenfl.com:3003
  ```

- ✅ `mobile/app.json` - Android 打包配置
- ✅ `mobile/eas.json` - EAS Build 配置

---

## 🔧 打包方式

### **方式 1: EAS Build（推荐）**

最现代、最简单的方式。

#### **步骤 1: 安装 EAS CLI**

```bash
cd /Users/yiliu/Documents/GitHub/words-learning/mobile
npm install -g eas-cli
```

#### **步骤 2: 登录 Expo 账号**

```bash
eas login
# 如果没有账号，访问 https://expo.dev/ 注册
```

#### **步骤 3: 配置项目**

```bash
eas build:configure
```

#### **步骤 4: 构建 APK**

```bash
# 构建预览版（APK 文件）
eas build -p android --profile preview

# 或构建生产版
eas build -p android --profile production
```

**构建过程**（约 10-15 分钟）：

1. 上传代码到 Expo 服务器
2. 在云端构建 APK
3. 完成后提供下载链接

#### **步骤 5: 下载并安装**

```bash
# EAS 会提供下载链接
# 方式 1: 在手机浏览器打开链接直接下载
# 方式 2: 下载到电脑，通过 USB 传输到手机
```

---

### **方式 2: 本地构建（无需 Expo 账号）**

使用 Expo 的本地 APK 构建。

#### **步骤 1: 安装 Android Studio（如果还没有）**

```bash
# macOS 通过 Homebrew
brew install --cask android-studio

# 或从官网下载
# https://developer.android.com/studio
```

#### **步骤 2: 配置环境变量**

```bash
# 添加到 ~/.zshrc 或 ~/.bash_profile
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# 重新加载
source ~/.zshrc
```

#### **步骤 3: 构建 APK**

```bash
cd /Users/yiliu/Documents/GitHub/words-learning/mobile

# 构建生产版 APK
npx expo build:android -t apk
```

---

### **方式 3: 最简单 - Expo Publish + APK**

快速生成可分享的 APK。

```bash
cd /Users/yiliu/Documents/GitHub/words-learning/mobile

# 发布应用
npx expo publish

# 使用 Expo Application Services
npx eas build -p android --profile preview
```

---

## 🚀 推荐流程（最快）

### **使用 EAS Build（5 分钟开始构建）**

```bash
# 1. 进入 mobile 目录
cd /Users/yiliu/Documents/GitHub/words-learning/mobile

# 2. 安装 EAS CLI（如果还没有）
npm install -g eas-cli

# 3. 登录 Expo
eas login

# 4. 构建 APK
eas build -p android --profile preview

# 输出：
# ✔ Build started successfully
# 🔗 Build URL: https://expo.dev/accounts/.../builds/...
# 
# 等待 10-15 分钟，完成后会显示下载链接
```

---

## 📱 安装到手机

### **方式 1: 扫码下载（最简单）**

```bash
# 构建完成后，EAS 会生成一个二维码
# 用手机扫描即可下载安装
```

### **方式 2: 直接下载**

```bash
# 1. 在手机浏览器访问 EAS 提供的链接
# 2. 点击下载 APK
# 3. 允许安装未知来源
# 4. 安装
```

### **方式 3: USB 传输**

```bash
# 1. 下载 APK 到电脑
wget <eas-build-url> -O words-learning.apk

# 2. 通过 USB 传输到手机
adb install words-learning.apk

# 或直接拷贝到手机，手动安装
```

---

## 🔍 验证配置

### **检查 APK 会连接到哪里：**

```bash
cd /Users/yiliu/Documents/GitHub/words-learning/mobile

# 查看生产环境配置
grep "gordenfl.com" config.js

# 应该看到：
# HOST: IS_DEVELOPMENT ? '192.168.101.95' : 'gordenfl.com',
```

---

## ⚙️ 构建配置说明

### **开发 vs 生产自动切换：**

```javascript
// mobile/config.js
const IS_DEVELOPMENT = __DEV__;

// 开发模式（Expo Go 调试）
// → HOST: '192.168.101.95'（本地）

// 生产模式（APK 打包后）
// → HOST: 'gordenfl.com'（外网）
```

**好处**：

- ✅ Expo Go 开发时连接本地
- ✅ 打包 APK 后自动连接外网
- ✅ 不需要手动修改配置

---

## 🎨 需要的图标文件

EAS Build 需要以下图标（可选，有默认图标）：

```bash
cd /Users/yiliu/Documents/GitHub/words-learning/mobile

# 创建简单的占位图标
mkdir -p assets

# 使用默认图标（如果不想自定义）
# EAS 会使用默认的 Expo 图标
```

**如果要自定义图标**：

- `assets/icon.png` - 1024x1024px（应用图标）
- `assets/splash.png` - 2048x2048px（启动屏幕）
- `assets/adaptive-icon.png` - 1024x1024px（Android 自适应图标）
- `assets/favicon.png` - 48x48px（Web 图标）

---

## 🚀 立即开始打包

### **最快方式（推荐）：**

```bash
cd /Users/yiliu/Documents/GitHub/words-learning/mobile

# 一键构建 APK
eas build -p android --profile preview
```

**等待完成后**：

1. 在手机浏览器访问提供的链接
2. 下载并安装 APK
3. 打开 App
4. 🎉 自动连接到 gordenfl.com:3003

---

## 📊 构建配置说明

### **三种 Profile：**

| Profile | 用途 | 生成文件 | 适用场景 |
|---------|------|---------|---------|
| `preview` | 测试版 | APK | **你现在需要的！** |
| `production` | 正式版 | APK/AAB | 发布到 Google Play |
| `development` | 开发版 | - | 本地开发 |

---

## ⚠️ 常见问题

### **Q: 需要 Expo 账号吗？**

A: 使用 EAS Build 需要（免费账号即可）

### **Q: 构建需要多久？**

A: 约 10-15 分钟

### **Q: 安装时提示"未知来源"？**

A: Android 设置 → 安全 → 允许安装未知应用

### **Q: 无法连接服务器？**

A: 确保服务器端口 3003 对外开放：

```bash
# 在服务器上检查
sudo firewall-cmd --list-ports  # 或
sudo ufw status
```

---

## ✅ 准备就绪

现在运行：

```bash
cd /Users/yiliu/Documents/GitHub/words-learning/mobile
eas build -p android --profile preview
```

想让我帮你执行吗？🚀
