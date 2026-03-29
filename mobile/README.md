# Chinese Words Learning (Vue 3 + Capacitor)

主移动应用：**Vue 3 + Capacitor**（本目录）。旧版 React Native/Expo 已移至仓库根目录的 `mobile__old/`，仅作归档参考。

## 技术栈

- **Vue 3** + **Vite**
- **Vue Router** 路由
- **Pinia** 状态（登录态）
- **Axios** 请求（与 `backend` 同一 API）
- **Capacitor** 原生壳（iOS / Android）

## 开发

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173 ，可对接本地或远程 backend（见 `src/config.js`）。

## 打包 iOS / Android

1. 首次添加原生项目（只需一次）：

```bash
npm run cap:init
```

2. 构建并同步到原生工程，然后打开 Xcode / Android Studio：

```bash
# iOS
npm run cap:ios

# Android
npm run cap:android
```

3. 在 Xcode 中选真机/模拟器运行；在 Android Studio 中选设备运行。

也可分步执行：

```bash
npm run build
npx cap sync
npx cap open ios    # 或 open android
```

## 已实现功能（与旧版 RN 应用对齐）

- 登录 / 注册（邮箱密码）
- 首页（统计 + 入口）
- 生词列表（筛选 unknown/known）
- 生词详情 + AI 生成组词/例句
- 阅读（文章列表 + 生成 + 阅读）
- 学习计划
- 个人资料与退出登录

API 与 `mobile__old`（归档）一致，使用同一 backend（`config.js` 中 HOST/PORT）。

## 配置

- **API 地址**：编辑 `src/config.js` 中 `ENV_CONFIG` 的 `HOST` / `PORT`。
- **Capacitor**：`capacitor.config.json` 中 `appId`、`appName` 可按需修改。

## 图标与启动图

可将 `mobile__old/assets/icon.png`、`mobile__old/assets/adaptive-icon.png` 等复制到 `public/` 或按 Capacitor 文档替换各平台图标与 splash。
