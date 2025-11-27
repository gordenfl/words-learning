# Xcode Organizer 使用指南

## 如何打开 Organizer

### 方法 1：菜单栏（推荐）

1. 在 Xcode 中，点击顶部菜单栏
2. 选择 **Window** → **Organizer**
3. 或使用快捷键：**⌘ + Shift + 9**（Command + Shift + 9）

### 方法 2：Archive 成功后自动打开

当 Archive 成功完成后，Xcode 通常会：
- 自动打开 Organizer 窗口
- 显示新创建的 Archive

如果自动打开被关闭了，可以手动打开。

## Organizer 窗口说明

### 左侧导航栏

Organizer 窗口左侧显示：
- **Archives**：所有已创建的 Archive
- **Projects**：项目列表
- **Devices**：连接的设备

### Archives 标签

点击 **Archives** 后，右侧会显示：

1. **应用列表**：
   - 显示所有已 Archive 的应用
   - 按应用名称分组

2. **Archive 列表**：
   - 每个应用下有多个 Archive
   - 显示版本号、构建号、日期
   - 最新 Archive 在最上面

3. **Archive 信息**：
   - Version（版本号）：如 1.0.1
   - Build（构建号）：如 11
   - Date（日期）：创建时间
   - Distribution（分发方式）：App Store / Ad Hoc / Enterprise

## 常用操作

### 查看 Archive 详情

1. 在 Archives 列表中选择一个 Archive
2. 右侧会显示详细信息：
   - 版本信息
   - 构建配置
   - 签名信息
   - 文件大小

### 分发应用（Distribute App）

1. 选择要分发的 Archive
2. 点击右侧的 **Distribute App** 按钮
3. 选择分发方式：
   - **App Store Connect**：上传到 App Store / TestFlight
   - **Ad Hoc**：分发给测试设备
   - **Enterprise**：企业内部分发
   - **Development**：开发版本

### 导出 IPA

1. 选择 Archive
2. 点击 **Distribute App**
3. 选择分发方式（如 Ad Hoc）
4. 选择签名选项
5. 选择导出位置
6. 点击 **Export** 生成 IPA 文件

### 验证 Archive

在分发前，可以验证 Archive：

1. 选择 Archive
2. 点击 **Validate App** 按钮
3. 选择分发方式
4. Xcode 会检查：
   - 签名是否正确
   - 配置是否完整
   - 是否符合 App Store 要求

### 删除 Archive

1. 选择要删除的 Archive
2. 按 **Delete** 键（或右键 → Delete）
3. 确认删除

## 如果看不到 Organizer

### 问题 1：菜单中没有 Organizer

**解决方案**：
- 确保 Xcode 版本是最新的
- 某些旧版本可能菜单位置不同
- 尝试：**Product** → **Archive** 后会自动打开

### 问题 2：Archive 列表为空

**可能原因**：
- 还没有创建过 Archive
- Archive 被删除了
- 选择了错误的工作区

**解决方案**：
1. 先创建一个 Archive：
   - **Product** → **Archive**
   - 等待构建完成
   - Organizer 会自动打开

### 问题 3：找不到刚创建的 Archive

**检查**：
1. 确认 Archive 是否成功完成
2. 检查左侧是否选择了正确的应用
3. 尝试刷新：关闭并重新打开 Organizer

## 快捷键

- **打开 Organizer**：⌘ + Shift + 9
- **创建 Archive**：⌘ + B（先构建），然后 Product → Archive
- **删除 Archive**：选中后按 Delete 键

## 查看 Archive 位置

Archive 文件通常保存在：

```
~/Library/Developer/Xcode/Archives/[日期]/[应用名] [日期] [时间].xcarchive
```

例如：
```
~/Library/Developer/Xcode/Archives/2025-11-26/ChineseWordsLearning 2025-11-26 10.30 AM.xcarchive
```

## 最佳实践

### 1. 定期清理旧 Archive

- 旧 Archive 占用磁盘空间
- 保留最近几个版本即可
- 删除不需要的 Archive

### 2. 在 Archive 名称中添加信息

虽然 Xcode 自动命名，但可以通过版本号区分：
- 确保每次构建都递增 Build Number
- 这样在列表中更容易识别

### 3. 分发前验证

- 上传到 App Store 前先验证
- 可以提前发现签名或配置问题
- 节省上传时间

## 常见问题

### Q: Archive 成功后没有自动打开 Organizer？

**A:** 
1. 手动打开：Window → Organizer
2. 检查 Xcode 偏好设置：
   - Xcode → Settings → Locations
   - 确认 Archive 路径正确

### Q: 如何查看 Archive 的详细信息？

**A:**
1. 选择 Archive
2. 右侧面板会显示：
   - 版本信息
   - 构建配置
   - 签名证书
   - 文件大小

### Q: 可以导出多个 Archive 吗？

**A:** 可以，但通常只需要最新的。选择需要的 Archive，点击 Distribute App 即可。

### Q: Archive 文件可以移动吗？

**A:** 可以，但建议通过 Organizer 管理。如果移动了，需要在 Organizer 中重新导入。

## 快速操作流程

### 创建并上传到 TestFlight

1. **创建 Archive**：
   - Product → Archive
   - 等待完成

2. **打开 Organizer**：
   - Window → Organizer（⌘ + Shift + 9）
   - 或自动打开

3. **分发应用**：
   - 选择 Archive
   - 点击 Distribute App
   - 选择 App Store Connect
   - 选择 Upload
   - 等待上传完成

4. **在 App Store Connect 中**：
   - 登录 App Store Connect
   - TestFlight → 等待处理
   - 添加到测试组

## 总结

**打开 Organizer 的三种方法**：

1. ✅ **快捷键**：⌘ + Shift + 9（最快）
2. ✅ **菜单栏**：Window → Organizer
3. ✅ **自动打开**：Archive 成功后自动显示

**查看 Archive**：
- 左侧选择应用
- 右侧显示所有 Archive
- 最新 Archive 在最上面

**常用操作**：
- Distribute App：分发应用
- Validate App：验证应用
- Delete：删除 Archive

