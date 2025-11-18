# Xcode 设备选择问题解决指南

## 为什么看不到 "Any iOS Device (arm64)"？

### 原因 1: 设备选择器位置
在 Xcode 顶部工具栏，设备选择器在 Scheme 选择器的**右侧**，看起来像这样：

```
[Scheme: ChineseWordsLearning] [设备选择器 ▼]
```

### 原因 2: 需要先连接真机或选择通用设备
如果没有连接真机设备，可能只显示模拟器选项。

## 解决方法

### 方法 1: 直接点击设备选择器
1. 在 Xcode 顶部工具栏，找到 Scheme 选择器（显示 "ChineseWordsLearning"）
2. 在它的**右侧**，有一个下拉菜单（可能显示模拟器名称或 "No Device"）
3. 点击这个下拉菜单
4. 在列表顶部应该能看到：
   - **"Any iOS Device (arm64)"** - 用于打包
   - 已连接的设备（如果有）
   - 模拟器列表

### 方法 2: 如果没有看到 "Any iOS Device"
1. **确保选择了正确的 Scheme**
   - 点击 Scheme 选择器（显示 "ChineseWordsLearning"）
   - 确保选择了 "ChineseWordsLearning" scheme

2. **检查 Build Settings**
   - 选择项目 → ChineseWordsLearning target
   - 打开 "Build Settings" 标签
   - 搜索 "Supported Platforms"
   - 确保包含 "iphoneos"

3. **尝试连接一个真机设备**
   - 用 USB 连接 iPhone/iPad 到 Mac
   - 在设备上信任此电脑
   - 设备选择器中会显示你的设备
   - 也可以选择 "Any iOS Device"

### 方法 3: 使用菜单栏
1. 菜单栏：`Product` → `Destination`
2. 选择 `Any iOS Device` 或你的真机设备

### 方法 4: 直接 Archive（推荐）
即使看不到 "Any iOS Device"，也可以直接 Archive：

1. 菜单栏：`Product` → `Archive`
2. Xcode 会自动选择正确的目标设备进行构建
3. 如果提示选择设备，选择 "Generic iOS Device" 或已连接的设备

## 快速检查清单

- [ ] 打开了 `.xcworkspace` 文件（不是 `.xcodeproj`）
- [ ] 选择了正确的 Scheme（ChineseWordsLearning）
- [ ] 在顶部工具栏查看设备选择器（Scheme 右侧）
- [ ] 如果还是看不到，直接尝试 `Product` → `Archive`

## 如果仍然有问题

尝试以下命令检查项目配置：

```bash
cd /Users/yiliu/Documents/GitHub/words-learning/mobile/ios
xcodebuild -list -workspace ChineseWordsLearning.xcworkspace
```

这会显示所有可用的 schemes 和 destinations。




