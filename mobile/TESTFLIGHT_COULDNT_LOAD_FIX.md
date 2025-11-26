# TestFlight "Couldn't Load App" 问题修复指南

## 问题描述

- **错误信息**：`Couldn't Load App, your request couldn't be completed Try again.`
- **现象**：完全看不到应用
- **设备**：iPhone 14 Pro Max, iOS 18.6.2

## 可能原因

这个错误通常表示：

1. **构建还在处理中**（最常见）
   - App Store Connect 需要时间处理上传的构建
   - 通常需要 10-30 分钟

2. **构建处理失败**
   - 签名问题
   - 配置错误
   - 缺少必需文件

3. **构建未正确上传**
   - 上传过程中断
   - 网络问题

4. **测试组配置问题**
   - 设备未添加到测试组
   - 测试组未启用

## 解决步骤

### 步骤 1：检查 App Store Connect 中的构建状态

1. 登录 [App Store Connect](https://appstoreconnect.apple.com)
2. 选择您的应用
3. 进入 **TestFlight** 标签
4. 查看构建状态：

   - **Processing**（处理中）：
     - ✅ 正常，等待处理完成
     - 通常需要 10-30 分钟
     - 处理完成后会变为 "Ready to Test"

   - **Ready to Test**（准备测试）：
     - ✅ 构建成功
     - 需要添加到测试组并启用

   - **Failed**（失败）：
     - ❌ 构建失败
     - 查看错误详情
     - 需要重新构建

   - **Missing Compliance**（缺少合规性信息）：
     - ⚠️ 需要填写出口合规性信息
     - 在构建详情中填写

### 步骤 2：检查测试组配置

1. 在 TestFlight 页面：
   - 点击 **内部测试** 或 **外部测试**
   - 确认有测试组存在

2. 检查构建是否添加到测试组：
   - 点击测试组
   - 查看 "构建" 部分
   - 确认构建已添加

3. 检查测试组是否启用：
   - 确认测试组状态为 "启用"
   - 确认测试组有测试员

### 步骤 3：检查设备注册

1. 确认设备已添加到 Apple Developer：
   - [Apple Developer Portal](https://developer.apple.com/account)
   - Certificates, Identifiers & Profiles
   - Devices
   - 确认您的设备已注册

2. 确认设备已添加到测试组：
   - App Store Connect → TestFlight
   - 测试组 → 测试员
   - 确认您的 Apple ID 已添加

### 步骤 4：检查构建配置

如果构建失败，检查以下配置：

#### 4.1 检查 exportOptions.plist

确保 `teamID` 已正确设置：

```xml
<key>teamID</key>
<string>KH69R2835S</string> <!-- 您的 Team ID -->
```

#### 4.2 检查签名证书

1. 在 Xcode 中：
   - 打开项目
   - 选择 target → Signing & Capabilities
   - 确认：
     - Team: 正确的团队
     - Signing Certificate: iOS Distribution
     - Provisioning Profile: 自动管理

#### 4.3 检查版本号

确保版本号正确：
- Version: 1.0.1
- Build: 8（或更高）

### 步骤 5：重新构建（如果构建失败）

如果构建状态是 "Failed"，需要重新构建：

```bash
cd mobile
./build-ipa.sh app-store
```

然后：
1. 在 Xcode Organizer 中上传
2. 或使用 Transporter 应用上传
3. 等待处理完成

## 常见问题排查

### Q1: 构建一直显示 "Processing"

**可能原因：**
- 正常情况，需要等待
- 如果超过 1 小时，可能是问题

**解决方案：**
1. 等待 30-60 分钟
2. 如果超过 1 小时仍显示 Processing：
   - 检查 App Store Connect 是否有通知
   - 查看构建详情中的错误信息
   - 尝试重新上传

### Q2: 构建显示 "Failed"

**检查：**
1. 构建详情中的错误信息
2. 常见错误：
   - 签名失败 → 检查证书
   - 缺少必需文件 → 检查构建配置
   - 版本号冲突 → 递增 Build Number

### Q3: 构建成功但看不到应用

**检查：**
1. 测试组配置：
   - 构建是否添加到测试组
   - 测试组是否启用
   - 您是否在测试组中

2. 设备注册：
   - 设备是否已注册
   - 设备是否已添加到测试组

3. TestFlight 应用：
   - 更新 TestFlight 应用到最新版本
   - 退出并重新登录
   - 重启设备

### Q4: 看到应用但无法安装

**检查：**
1. 设备兼容性：
   - iOS 版本 ≥ 15.1 ✅（您的设备是 18.6.2，满足要求）
   - 设备型号支持 ✅（iPhone 14 Pro Max 支持）

2. 存储空间：
   - 确保有足够空间

3. 网络连接：
   - 尝试切换网络
   - 使用 WiFi 而不是移动数据

## 立即检查清单

请按以下顺序检查：

- [ ] **App Store Connect → TestFlight → 构建状态是什么？**
  - Processing → 等待处理完成
  - Ready to Test → 检查测试组配置
  - Failed → 查看错误详情，重新构建

- [ ] **构建是否已添加到测试组？**
  - 测试组 → 构建 → 确认构建已添加

- [ ] **测试组是否启用？**
  - 测试组状态 → 启用

- [ ] **您是否在测试组中？**
  - 测试组 → 测试员 → 确认您的 Apple ID

- [ ] **设备是否已注册？**
  - Apple Developer Portal → Devices → 确认设备

- [ ] **TestFlight 应用是否最新？**
  - App Store → 更新 TestFlight

## 快速修复

如果构建失败，最常见的修复方法：

1. **递增 Build Number**：
   ```bash
   # 编辑 mobile/app.config.js
   buildNumber: "9", // 从 8 改为 9
   
   # 编辑 mobile/ios/ChineseWordsLearning/Info.plist
   <key>CFBundleVersion</key>
   <string>9</string>
   ```

2. **重新构建**：
   ```bash
   cd mobile
   ./build-ipa.sh app-store
   ```

3. **重新上传**：
   - 使用 Xcode Organizer 或 Transporter

4. **等待处理**：
   - 通常需要 10-30 分钟

## 需要的信息

为了更准确地诊断，请提供：

1. **App Store Connect 中的构建状态**：
   - Processing / Ready to Test / Failed / 其他？

2. **构建详情**：
   - 如果有错误信息，请提供

3. **测试组配置**：
   - 构建是否已添加到测试组？
   - 测试组是否启用？

4. **上传时间**：
   - 什么时候上传的构建？
   - 已经等待了多长时间？

## 下一步

请先检查 App Store Connect 中的构建状态，然后告诉我结果，我可以提供更具体的解决方案。

