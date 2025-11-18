# 修复 dSYM 上传错误

## 问题原因

React Native 的某些框架（如 React.framework）可能没有正确生成 dSYM 文件，导致上传符号失败。

## 解决方案

### 方案 1: 禁用符号上传（最简单，推荐用于 Ad-Hoc）

如果你是在导出 **Ad-Hoc** 版本（用于测试），可以禁用符号上传：

**在 Xcode Organizer 中导出时：**
1. 选择 Archive
2. 点击 "Distribute App"
3. 选择 "Ad Hoc"
4. 在导出选项中，**取消勾选 "Upload your app's symbols"** 或类似选项

**或者修改 exportOptions.plist：**

如果使用命令行导出，确保 `uploadSymbols` 设置为 `false`（Ad-Hoc 版本已经正确设置了）。

### 方案 2: 修改 App Store 导出选项（如果提交到 App Store）

如果你要提交到 App Store，但遇到这个问题，可以临时禁用符号上传：

修改 `ios/exportOptions.plist`：
```xml
<key>uploadSymbols</key>
<false/>
```

**注意**：禁用符号上传后，App Store 的崩溃报告可能无法正确符号化，但对于大多数情况影响不大。

### 方案 3: 修复 dSYM 生成（高级，可选）

如果需要完整的符号支持，可以尝试：

1. 在 Xcode 中打开项目
2. 选择项目 → ChineseWordsLearning target
3. Build Settings → 搜索 "Debug Information Format"
4. 确保设置为 "DWARF with dSYM File"
5. 重新 Archive

但 React Native 的某些预编译框架可能仍然无法生成 dSYM。

## 推荐方案

**对于 Ad-Hoc 测试版本：**
- 使用 `exportOptionsAdHoc.plist`（已经设置了 `uploadSymbols = false`）
- 或者手动取消符号上传选项

**对于 App Store 版本：**
- 如果错误阻止了导出，临时设置 `uploadSymbols = false`
- 大多数情况下，App Store 仍然可以处理崩溃报告

## 快速修复

最简单的方法：**在导出时取消符号上传选项**

这不会影响 IPA 的功能，只是无法上传调试符号到 App Store。




