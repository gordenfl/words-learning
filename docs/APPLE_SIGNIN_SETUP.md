# Apple ID 登录 - mobile_new 配置指南

仅针对 **mobile_new**（Vue + Capacitor）项目。

---

## 一、前置条件

1. **Apple Developer 账号**（$99/年）
   - 申请：https://developer.apple.com/programs/enroll/

2. **Bundle ID**：`com.gordenfl.wordslearning`（已在 `capacitor.config.ts` 中配置）

---

## 二、设置步骤

### 1. Apple Developer 后台

1. 登录 https://developer.apple.com/account
2. 进入 **Certificates, Identifiers & Profiles** → **Identifiers**
3. 找到 App ID：`com.gordenfl.wordslearning`（没有则新建）
4. 在 **Capabilities** 中勾选 **Sign in with Apple**
5. 点击 **Save**

### 2. 安装 Capacitor 插件

```bash
cd mobile_new
npm i @capacitor-community/apple-sign-in
npx cap sync ios
```

### 3. Xcode 配置

1. 运行 `npx cap open ios` 打开 Xcode
2. 选择项目 → **Signing & Capabilities**
3. 点击 **+ Capability** → 搜索 **Sign in with Apple** → 添加

### 4. 后端（可选）

后端 `backend_new` 已支持 Apple 登录，默认接受 `com.gordenfl.wordslearning`。

如需自定义，在 `.env` 中设置：
```
APPLE_BUNDLE_ID=com.gordenfl.wordslearning
```

---

## 三、检查清单

- [ ] Apple Developer 中 App ID 已勾选 Sign in with Apple
- [ ] 已安装 `@capacitor-community/apple-sign-in` 并执行 `cap sync ios`
- [ ] Xcode 中已添加 Sign in with Apple Capability
- [ ] 在**真机**上测试（模拟器可能异常）
- [ ] 设备已登录 Apple ID（设置 → 登录 iPhone）

---

## 四、常见问题

**"The authorization attempt failed for an unknown reason"**
- 用真机测试
- 确认设备已登录 Apple ID
- 检查 Xcode Capability 和 Apple Developer 配置

**"Invalid identity token"**
- 确认 Bundle ID 与 `capacitor.config.ts` 中的 `appId` 一致
