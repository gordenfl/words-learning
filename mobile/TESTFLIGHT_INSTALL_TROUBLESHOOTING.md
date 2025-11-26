# TestFlight 安装问题排查指南

## 常见问题和解决方案

### 1. "无法安装此应用" 或 "安装失败"

**可能原因：**
- 设备不兼容（iOS 版本太低）
- 证书/签名问题
- 设备未添加到测试组

**解决方案：**
1. 检查设备 iOS 版本：
   - 应用要求 iOS 15.1+
   - 设置 → 通用 → 关于本机 → 软件版本

2. 检查设备是否已添加到 TestFlight：
   - App Store Connect → TestFlight → 内部测试/外部测试
   - 确认设备已添加

3. 检查证书：
   - 确保使用正确的 Distribution 证书
   - 在 Xcode 中检查 Signing & Capabilities

### 2. "此应用需要更新" 或版本号问题

**可能原因：**
- 版本号低于已安装版本
- Build Number 未递增

**解决方案：**
1. 检查版本号：
   - 当前版本：1.0.1
   - 当前 Build：8
   - 如果设备上已有更高版本，需要卸载后重新安装

2. 递增 Build Number：
   ```javascript
   // app.config.js
   buildNumber: "9", // 递增
   ```

### 3. "无法验证应用" 或签名问题

**可能原因：**
- 证书过期
- 签名配置错误
- Provisioning Profile 问题

**解决方案：**
1. 检查证书有效期：
   - Apple Developer Portal → Certificates
   - 确认证书未过期

2. 重新生成 Provisioning Profile：
   - App Store Connect → Users and Access → Keys
   - 重新下载并安装证书

3. 在 Xcode 中重新签名：
   - Product → Clean Build Folder
   - 重新 Archive 和 Export

### 4. 设备兼容性问题

**检查清单：**
- ✅ iOS 版本：15.1 或更高
- ✅ 设备型号：iPhone/iPad（不支持模拟器）
- ✅ 存储空间：确保有足够空间

### 5. TestFlight 特定问题

**检查清单：**
1. 应用状态：
   - App Store Connect → TestFlight
   - 确认构建已处理完成（Processing → Ready to Test）

2. 测试组：
   - 确认您已添加到测试组
   - 检查是否收到测试邀请邮件

3. 设备限制：
   - 某些企业账户可能有设备数量限制
   - 检查是否达到设备上限

### 6. 网络问题

**可能原因：**
- 网络连接不稳定
- App Store 服务器问题

**解决方案：**
- 尝试切换网络（WiFi/移动数据）
- 稍后重试

## 诊断步骤

### 步骤 1：检查应用配置

```bash
# 检查版本号
cd mobile
grep -A 2 "version\|buildNumber" app.config.js
```

应该显示：
- version: "1.0.1"
- buildNumber: "8" 或更高

### 步骤 2：检查 Info.plist

```bash
# 检查 iOS 最低版本要求
cd mobile/ios/ChineseWordsLearning
grep -i "minimum\|deployment" Info.plist
```

应该显示：
- IPHONEOS_DEPLOYMENT_TARGET = 15.1

### 步骤 3：检查 Xcode 项目设置

1. 打开 `mobile/ios/ChineseWordsLearning.xcworkspace`
2. 选择项目 → ChineseWordsLearning target
3. 检查：
   - **General → Deployment Info → iOS Deployment Target**: 15.1
   - **Signing & Capabilities → Team**: 正确的团队
   - **Signing & Capabilities → Signing Certificate**: iOS Distribution

### 步骤 4：检查 App Store Connect

1. 登录 [App Store Connect](https://appstoreconnect.apple.com)
2. 选择应用 → TestFlight
3. 检查：
   - 构建状态：应该是 "Ready to Test"
   - 测试组：确认您已添加
   - 设备：确认设备已注册

## 快速修复

### 如果版本号冲突：

```bash
# 1. 更新 buildNumber
# 编辑 mobile/app.config.js
buildNumber: "9", // 从 8 改为 9

# 2. 更新 Info.plist
# 编辑 mobile/ios/ChineseWordsLearning/Info.plist
<key>CFBundleVersion</key>
<string>9</string>

# 3. 重新构建
cd mobile
./build-ipa.sh app-store
```

### 如果签名问题：

1. 在 Xcode 中：
   - Product → Clean Build Folder (Shift + Cmd + K)
   - Product → Archive
   - Window → Organizer → Distribute App
   - 选择 App Store Connect
   - 选择正确的证书和 Provisioning Profile

## 需要的信息

为了更准确地诊断问题，请提供：

1. **具体错误信息**：
   - TestFlight 显示的确切错误消息
   - 截图（如果有）

2. **设备信息**：
   - 设备型号（如 iPhone 14 Pro）
   - iOS 版本（如 iOS 17.0）

3. **应用状态**：
   - App Store Connect 中构建的状态
   - 是否能看到应用但无法安装
   - 还是完全看不到应用

4. **之前的版本**：
   - 设备上是否已安装过此应用
   - 之前的版本号是多少

## 联系支持

如果以上方法都无法解决，可以：
1. 在 App Store Connect 中提交支持请求
2. 检查 Apple Developer 论坛
3. 查看 Xcode 和 App Store Connect 的日志

