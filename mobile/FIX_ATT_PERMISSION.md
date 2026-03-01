# 修复 App Tracking Transparency (ATT) 权限问题

## 问题描述

苹果审核反馈：应用使用了 App Tracking Transparency 框架，但在 iOS 26.1 和 iPadOS 26.1 上查看时，无法找到 App Tracking Transparency 权限请求。

## 问题原因

1. **应用声明了 ATT 权限**：在 `Info.plist` 中有 `NSUserTrackingUsageDescription` 键
2. **但应用实际上不使用跟踪功能**：
   - `FacebookAdvertiserIDCollectionEnabled` 设置为 `false`
   - `FacebookAutoLogAppEventsEnabled` 设置为 `false`
3. **没有正确实现 ATT 权限请求代码**

根据苹果的要求：
- 如果应用声明了 ATT 权限，必须正确实现权限请求
- 如果应用不跟踪用户，不应该声明 ATT 权限

## 解决方案

由于应用不收集广告ID，我们移除了 ATT 相关的配置：

### 1. 移除 `app.config.js` 中的 `iosUserTrackingPermission`

```javascript
// 已移除
iosUserTrackingPermission: "This identifier will be used to deliver personalized ads to you.",
```

### 2. 移除 `Info.plist` 中的 `NSUserTrackingUsageDescription`

```xml
<!-- 已移除 -->
<key>NSUserTrackingUsageDescription</key>
<string>This identifier will be used to deliver personalized ads to you.</string>
```

## 下一步操作

### 方法 1：使用 prebuild（推荐）

运行以下命令重新生成 iOS 项目，确保配置同步：

```bash
cd mobile
npx expo prebuild --clean --platform ios
```

这会：
- 根据 `app.config.js` 重新生成 `Info.plist`
- 确保所有配置一致

### 方法 2：直接构建

如果不想运行 prebuild，可以直接构建，但需要确保 `Info.plist` 中的 `NSUserTrackingUsageDescription` 已被移除（已完成）。

## 验证

构建后，检查 `Info.plist` 文件，确认：
- ✅ 没有 `NSUserTrackingUsageDescription` 键
- ✅ `FacebookAdvertiserIDCollectionEnabled` 为 `false`
- ✅ `FacebookAutoLogAppEventsEnabled` 为 `false`

## 注意事项

如果将来需要使用跟踪功能：
1. 将 `advertiserIDCollectionEnabled` 设置为 `true`
2. 添加 `iosUserTrackingPermission` 配置
3. 在代码中实现 `ATTrackingManager.requestTrackingAuthorization()` 调用
4. 确保在请求权限前显示清晰的说明

## 参考

- [Apple App Tracking Transparency 文档](https://developer.apple.com/documentation/apptrackingtransparency)
- [Facebook SDK 配置文档](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios)


