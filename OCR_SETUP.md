# OCR配置指南

当前Google Vision API需要启用billing（收费），推荐使用百度OCR的免费配额。

## 方案1：百度OCR（推荐 - 免费）

### 1. 注册百度智能云账号
访问：https://login.bce.baidu.com/

### 2. 创建OCR应用
1. 访问文字识别控制台：https://console.bce.baidu.com/ai/#/ai/ocr/overview/index
2. 点击"创建应用"
3. 应用名称：words-learning
4. 接口选择：通用文字识别（高精度版）
5. 创建成功后会得到：
   - **API Key**
   - **Secret Key**

### 3. 配置环境变量
```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件，填入你的密钥：
```env
# 使用百度OCR
USE_GOOGLE_VISION=false
BAIDU_OCR_API_KEY=你的API_Key
BAIDU_OCR_SECRET_KEY=你的Secret_Key
```

### 4. 重启服务器
```bash
# 停止现有服务器（Ctrl+C）
node server.js
```

### 5. 测试
拍照后在后端日志中会看到：
```
🔍 Selected OCR: Baidu OCR
📝 百度OCR识别的完整文字:
今天天气很好...
```

---

## 方案2：Google Cloud Vision（需要付费）

### 1. 启用billing
访问：https://console.developers.google.com/billing/enable?project=123044373895

### 2. 配置环境变量
```env
USE_GOOGLE_VISION=true
GOOGLE_VISION_API_KEY=你的Google_API_Key
```

---

## 免费配额对比

| 服务 | 免费额度 | 超出后价格 |
|------|---------|----------|
| 百度OCR | 每天1000次 | ¥0.002/次 |
| Google Vision | 每月1000次 | $1.50/1000次 |

**建议**：开发测试用百度OCR，生产环境可选Google Vision（识别准确度更高）。

