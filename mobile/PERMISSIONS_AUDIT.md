# iOS 权限审计报告

## 已声明的权限

### 1. ✅ NSCameraUsageDescription (相机权限)
**状态**: **正在使用**
- **用途**: 扫描和识别书本中的中文字符
- **使用位置**:
  - `HomeScreen.js`: `ImagePicker.launchCameraAsync()`
  - `CameraScreen.js`: `ImagePicker.launchCameraAsync()`
  - `ProfileScreen.js`: `ImagePicker.launchCameraAsync()`
- **结论**: ✅ **保留**

### 2. ✅ NSMicrophoneUsageDescription (麦克风权限)
**状态**: **正在使用**
- **用途**: 录音用于语音识别（组词练习和句子练习）
- **使用位置**:
  - `SentencePracticeScreen.js`: `Audio.Recording()` 用于录音
  - `CompoundPracticeScreen.js`: `Audio.Recording()` 用于录音
- **结论**: ✅ **保留**

### 3. ✅ NSPhotoLibraryUsageDescription (相册读取权限)
**状态**: **正在使用**
- **用途**: 从相册选择图片进行中文字符识别
- **使用位置**:
  - `HomeScreen.js`: `ImagePicker.launchImageLibraryAsync()`
  - `CameraScreen.js`: `ImagePicker.launchImageLibraryAsync()`
  - `ProfileScreen.js`: `ImagePicker.launchImageLibraryAsync()`
- **结论**: ✅ **保留**

### 4. ❌ NSPhotoLibraryAddUsageDescription (相册写入权限)
**状态**: **未使用**
- **用途**: 保存处理后的图片到相册
- **使用位置**: **无**
- **检查结果**: 
  - 未安装 `expo-media-library` 包
  - 代码中没有任何保存图片到相册的功能
  - 应用只读取相册，不写入相册
- **结论**: ❌ **应该移除**

### 5. ❌ NSUserTrackingUsageDescription (App Tracking Transparency)
**状态**: **已移除** ✅
- **问题**: 应用声明了 ATT 权限但没有正确实现
- **解决方案**: 已从 `app.config.js` 和 `Info.plist` 中移除
- **结论**: ✅ **已修复**

## 建议操作

### 需要移除的权限

1. **NSPhotoLibraryAddUsageDescription** - 相册写入权限
   - 从 `app.config.js` 中移除
   - 从 `Info.plist` 中移除（运行 prebuild 后会自动同步）

## 修复步骤

1. 从 `app.config.js` 中移除 `NSPhotoLibraryAddUsageDescription`
2. 运行 `npx expo prebuild --clean --platform ios` 同步配置
3. 验证 `Info.plist` 中不再有 `NSPhotoLibraryAddUsageDescription`

## 最终权限列表（修复后）

✅ **保留的权限**:
- NSCameraUsageDescription
- NSMicrophoneUsageDescription
- NSPhotoLibraryUsageDescription

❌ **移除的权限**:
- NSPhotoLibraryAddUsageDescription
- NSUserTrackingUsageDescription


