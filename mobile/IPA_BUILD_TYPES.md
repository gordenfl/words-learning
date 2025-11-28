# IPA 构建类型说明

## 构建类型对比

### `./build-ipa.sh app-store`

**导出类型**：App Store Connect

**用途**：

- ✅ **TestFlight 内部测试**（Internal Testing）
- ✅ **TestFlight 外部测试**（External Testing）
- ✅ **App Store 发布**（Production Release）

**特点**：

- 使用 App Store Distribution 证书签名
- 可以上传到 App Store Connect
- 上传后可以用于 TestFlight 或直接发布到 App Store
- **同一个 IPA 可以同时用于测试和发布**

**导出配置**：

- `method: "app-store"`
- 使用 `exportOptions.plist`

### `./build-ipa.sh ad-hoc`

**导出类型**：Ad Hoc

**用途**：

- ✅ **直接安装到已注册的设备**（最多 100 台设备）
- ❌ **不能上传到 App Store Connect**
- ❌ **不能用于 TestFlight**

**特点**：

- 使用 Ad Hoc Distribution 证书签名
- 需要设备 UDID 已注册到 Apple Developer
- 可以直接通过 iTunes/Finder 或第三方工具安装
- 不需要 App Store Connect

**导出配置**：

- `method: "ad-hoc"`
- 使用 `exportOptionsAdHoc.plist`

## 回答您的问题

**`./build-ipa.sh app-store` 打包出来的 IPA：**

✅ **可以用于 TestFlight 内部测试**

- 上传到 App Store Connect 后
- 添加到内部测试组
- 团队成员可以在 TestFlight 中安装

✅ **也可以用于 TestFlight 外部测试**

- 添加到外部测试组
- 外部测试员可以安装

✅ **也可以用于 App Store 发布**

- 提交审核
- 发布到 App Store

**总结**：`app-store` 类型的 IPA 是**通用的**，可以用于：

1. TestFlight 内部测试
2. TestFlight 外部测试  
3. App Store 发布

**同一个 IPA 文件**，上传后您可以选择：

- 只用于 TestFlight 测试
- 只用于 App Store 发布
- 或者两者都用（先测试，测试通过后发布）

## 使用流程

### 用于 TestFlight 内部测试

1. **构建**：

   ```bash
   ./build-ipa.sh app-store
   ```

2. **上传**：
   - 使用 Transporter 上传 IPA
   - 或使用 Xcode Organizer

3. **添加到测试组**：
   - App Store Connect → TestFlight
   - 内部测试 → 添加构建

4. **安装**：
   - 团队成员在 TestFlight 中安装

### 用于 App Store 发布

1. **构建**（同样的命令）：

   ```bash
   ./build-ipa.sh app-store
   ```

2. **上传**（同样的步骤）：
   - 使用 Transporter 上传 IPA

3. **提交审核**：
   - App Store Connect → 应用版本
   - 选择构建并提交审核

## 重要提示

### 同一个 IPA 可以用于多个目的

您**不需要**为 TestFlight 和 App Store 分别构建：

- 构建一次 `app-store` 类型的 IPA
- 上传到 App Store Connect
- 可以同时用于 TestFlight 测试和 App Store 发布

### 版本号管理

- **Version**（版本号）：如 1.0.1
  - 用于 TestFlight 和 App Store 都使用同一个版本号
- **Build Number**（构建号）：如 11
  - 每次构建必须递增
  - TestFlight 和 App Store 可以使用不同的构建号

### 推荐流程

1. **开发阶段**：

   ```bash
   ./build-ipa.sh app-store  # 构建
   # 上传到 TestFlight 内部测试
   ```

2. **测试阶段**：
   - 在 TestFlight 中测试
   - 修复问题
   - 递增 Build Number，重新构建

3. **发布阶段**：
   - 测试通过后
   - 使用同一个或新的构建提交到 App Store
   - 或直接使用 TestFlight 中的构建提交审核

## 总结

**`./build-ipa.sh app-store` 导出的 IPA：**

✅ **可以用于 TestFlight 内部测试**
✅ **可以用于 TestFlight 外部测试**
✅ **可以用于 App Store 发布**

**您不需要区分**，同一个 IPA 可以同时用于测试和发布！
