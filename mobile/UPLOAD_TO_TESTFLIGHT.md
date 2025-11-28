# 上传 IPA 到 TestFlight 并安装到手机

## 步骤概览

1. **导出 IPA 文件**（已完成）
2. **上传到 App Store Connect**
3. **等待处理**
4. **添加到 TestFlight 测试组**
5. **在手机上安装**

## 详细步骤

### 步骤 1：确认 IPA 文件位置

脚本导出后，IPA 文件通常在：

```bash
mobile/ios/build/export/ChineseWordsLearning.ipa
```

### 步骤 2：上传到 App Store Connect

有两种方法上传：

#### 方法 A：使用 Transporter 应用（推荐，最简单）

1. **下载 Transporter**：
   - 在 Mac App Store 搜索 "Transporter"
   - 或访问：https://apps.apple.com/app/transporter/id1450874784
   - 免费下载安装

2. **打开 Transporter**：
   - 启动应用
   - 使用您的 Apple ID 登录（与 App Store Connect 相同的账号）

3. **拖拽 IPA 文件**：
   - 将 `ChineseWordsLearning.ipa` 文件拖到 Transporter 窗口
   - 或点击 "+" 按钮选择文件

4. **上传**：
   - 点击 "交付"（Deliver）按钮
   - 等待上传完成（显示进度条）
   - 上传成功后会有提示

#### 方法 B：使用 Xcode Organizer

1. **打开 Organizer**：
   - 在 Xcode 中：Window → Organizer（⌘ + Shift + 9）
   - 或快捷键：⌘ + Shift + 9

2. **导入 Archive**（如果还没有）：
   - 如果 IPA 是从脚本导出的，可能没有 Archive
   - 需要先在 Xcode 中 Archive，然后使用 Organizer 上传

3. **分发应用**：
   - 选择 Archive
   - 点击 "Distribute App"
   - 选择 "App Store Connect"
   - 选择 "Upload"
   - 等待上传完成

#### 方法 C：使用命令行（高级）

```bash
# 使用 altool（需要安装 Xcode Command Line Tools）
xcrun altool --upload-app \
  --type ios \
  --file mobile/ios/build/export/ChineseWordsLearning.ipa \
  --username "your-apple-id@example.com" \
  --password "app-specific-password"
```

**注意**：需要生成 App-Specific Password：
- Apple ID 设置 → App-Specific Passwords
- 生成密码用于命令行上传

### 步骤 3：在 App Store Connect 中等待处理

1. **登录 App Store Connect**：
   - 访问：https://appstoreconnect.apple.com
   - 使用您的 Apple ID 登录

2. **查看构建状态**：
   - 选择您的应用
   - 进入 **TestFlight** 标签
   - 查看构建状态：
     - **Processing**：正在处理（通常 10-30 分钟）
     - **Ready to Test**：准备测试 ✅
     - **Failed**：处理失败 ❌

3. **等待处理完成**：
   - 处理通常需要 10-30 分钟
   - 处理完成后状态会变为 "Ready to Test"

### 步骤 4：添加到 TestFlight 测试组

1. **进入测试组**：
   - 在 TestFlight 页面
   - 点击 **内部测试** 或 **外部测试**

2. **添加构建**：
   - 如果测试组中没有构建，点击 **"+ 构建"** 或 **"Add Build"**
   - 选择处理完成的构建（状态为 "Ready to Test"）
   - 点击 **"完成"** 或 **"Done"**

3. **启用测试组**（如果未启用）：
   - 确认测试组状态为 **"启用"**（Enabled）
   - 如果未启用，点击启用

4. **添加测试员**（如果还没有）：
   - 点击测试组
   - 进入 **"测试员"** 标签
   - 点击 **"+ 添加测试员"**
   - 输入测试员的 Apple ID 邮箱
   - 或使用内部测试（自动包含所有团队成员）

### 步骤 5：在手机上安装

#### 前提条件

1. **安装 TestFlight 应用**：
   - 在 iPhone 上打开 App Store
   - 搜索 "TestFlight"
   - 下载并安装（Apple 官方应用，免费）

2. **确认已添加到测试组**：
   - 确保您的 Apple ID 已添加到测试组
   - 内部测试：自动包含所有 App Store Connect 团队成员
   - 外部测试：需要手动添加测试员

#### 安装步骤

1. **打开 TestFlight 应用**：
   - 在 iPhone 上启动 TestFlight

2. **查看可用应用**：
   - 如果已添加到测试组，应用会自动显示
   - 如果没有，检查：
     - 是否收到测试邀请邮件
     - 是否已添加到测试组
     - TestFlight 应用是否已更新到最新版本

3. **安装应用**：
   - 点击应用卡片
   - 点击 **"安装"** 或 **"Install"** 按钮
   - 等待下载和安装完成

4. **首次安装**：
   - 可能需要信任开发者
   - 设置 → 通用 → VPN与设备管理
   - 找到应用，点击 "信任"

## 常见问题

### Q1: 上传后看不到构建？

**检查**：
1. 上传是否成功完成
2. 等待 10-30 分钟处理时间
3. 刷新 App Store Connect 页面
4. 检查是否有错误通知

### Q2: 构建一直显示 "Processing"？

**可能原因**：
- 正常情况，需要等待
- 如果超过 1 小时，检查是否有错误

**解决方案**：
- 等待 30-60 分钟
- 检查 App Store Connect 的通知
- 查看构建详情中的错误信息

### Q3: 构建显示 "Failed"？

**检查**：
1. 构建详情中的错误信息
2. 常见错误：
   - 签名问题 → 检查证书
   - 缺少必需文件 → 检查构建配置
   - 版本号冲突 → 递增 Build Number

### Q4: TestFlight 中看不到应用？

**检查**：
1. 构建是否已添加到测试组
2. 测试组是否启用
3. 您是否在测试组中
4. TestFlight 应用是否最新版本

**解决方案**：
- 退出并重新登录 TestFlight
- 重启手机
- 检查 App Store Connect 中的测试组配置

### Q5: 点击安装后没有反应？

**检查**：
1. 网络连接是否正常
2. 存储空间是否足够
3. iOS 版本是否满足要求（≥ 15.1）

**解决方案**：
- 切换网络（WiFi/移动数据）
- 清理存储空间
- 重启 TestFlight 应用

### Q6: 安装后无法打开应用？

**检查**：
1. 是否信任了开发者
2. 设备是否已注册

**解决方案**：
- 设置 → 通用 → VPN与设备管理 → 信任开发者
- 在 Apple Developer Portal 中注册设备

## 快速检查清单

上传前：
- [ ] IPA 文件已成功导出
- [ ] 确认文件路径正确
- [ ] 版本号和构建号已更新

上传中：
- [ ] Transporter 或 Xcode Organizer 已登录
- [ ] 上传进度显示正常
- [ ] 上传成功提示出现

上传后：
- [ ] App Store Connect 中能看到构建
- [ ] 等待处理完成（10-30 分钟）
- [ ] 构建状态变为 "Ready to Test"

添加到测试组：
- [ ] 构建已添加到测试组
- [ ] 测试组已启用
- [ ] 测试员已添加（或使用内部测试）

手机上安装：
- [ ] TestFlight 应用已安装
- [ ] 已登录正确的 Apple ID
- [ ] 应用显示在 TestFlight 中
- [ ] 点击安装成功

## 推荐流程总结

1. **导出 IPA**：
   ```bash
   cd mobile
   ./build-ipa.sh app-store
   ```

2. **上传**：
   - 使用 Transporter 应用（最简单）
   - 或使用 Xcode Organizer

3. **等待处理**：
   - 在 App Store Connect 中查看
   - 等待 10-30 分钟

4. **添加到测试组**：
   - TestFlight → 内部测试/外部测试
   - 添加构建并启用

5. **安装到手机**：
   - 打开 TestFlight 应用
   - 点击安装

## 提示

- **内部测试**：最快，自动包含所有团队成员
- **外部测试**：需要添加测试员，可能需要审核
- **首次上传**：可能需要填写出口合规性信息
- **更新版本**：确保 Build Number 递增

