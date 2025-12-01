# Google Cloud Speech-to-Text API 申请指南

## ⚠️ 重要说明

### 关于 Google Login 的 API Key

**Google Login (OAuth) 使用的是客户端 SDK，不需要后端 API 密钥**。但是，如果您之前已经为其他 Google Cloud 服务（如 Google Vision API）申请过 API 密钥，可以：

1. **复用同一个 Google Cloud 项目**：在您现有的项目中启用 Speech-to-Text API
2. **使用现有 API 密钥**：如果您的 `GOOGLE_VISION_API_KEY` 是"无限制"的 API 密钥，可以直接复用
3. **创建新的 API 密钥**：为了安全，建议为 Speech-to-Text 创建专门的 API 密钥

### 检查现有配置

如果您的服务器上已经有 `GOOGLE_VISION_API_KEY`，说明您已经有一个 Google Cloud 项目。您只需要：

- 在**同一个项目**中启用 Speech-to-Text API
- 创建新的 API 密钥（或复用现有的无限制密钥）

## 📋 申请步骤

### 1. 访问 Google Cloud 控制台

- 打开 [Google Cloud 控制台](https://console.cloud.google.com/)
- 使用您的 Google 账号登录

### 2. 选择或创建项目

**如果您已经有 Google Vision API 的项目**：

- 点击左上角的项目下拉菜单
- 选择您现有的项目（用于 Vision API 的项目）

**如果您还没有项目**：

- 点击左上角的项目下拉菜单
- 选择"新建项目"（New Project）
- 输入项目名称（例如：`words-learning`）
- 点击"创建"（Create）

### 3. 启用结算功能（必需）

⚠️ **重要**：Google Cloud Speech-to-Text API 需要启用结算功能才能使用

- 在左侧导航栏，点击"结算"（Billing）
- 如果没有结算账号，点击"关联结算账号"（Link a billing account）
- 按照提示添加付款方式（信用卡）
- 注意：Google Cloud 提供免费试用额度（$300，有效期 90 天）

### 4. 启用 Speech-to-Text API

- 在左侧导航栏，点击"API 和服务"（APIs & Services）> "库"（Library）
- 在搜索框中输入"Speech-to-Text"
- 找到"Cloud Speech-to-Text API"，点击进入
- 点击"启用"（Enable）按钮

### 5. 创建或复用 API 密钥

**选项 A：创建新的 API 密钥（推荐）**

- 在左侧导航栏，点击"API 和服务"（APIs & Services）> "凭据"（Credentials）
- 点击"创建凭据"（Create Credentials）按钮
- 选择"API 密钥"（API Key）
- 系统将生成一个新的 API 密钥，复制并保存
- 这个密钥专门用于 Speech-to-Text API

**选项 B：复用现有的 API 密钥（如果它是无限制的）**

- 在左侧导航栏，点击"API 和服务"（APIs & Services）> "凭据"（Credentials）
- 找到您现有的 API 密钥（例如用于 Vision API 的密钥）
- 点击密钥名称进入编辑页面
- 在"API 限制"部分，确保已勾选"Cloud Speech-to-Text API"
- 如果没有勾选，添加它并保存
- 然后可以直接使用这个密钥作为 `GOOGLE_SPEECH_API_KEY`

### 6. 配置 API 密钥限制（推荐）

为了安全，建议对 API 密钥设置限制：

#### 应用限制（Application restrictions）

- 点击刚创建的 API 密钥名称进入编辑页面
- 在"应用限制"部分，选择"IP 地址（网络服务器、cron 作业等）"
- 添加您的服务器 IP 地址（例如：`gordenfl.com` 的 IP）

#### API 限制（API restrictions）

- 在"API 限制"部分，选择"限制密钥"
- 勾选"Cloud Speech-to-Text API"（如果复用现有密钥，还需要勾选其他已使用的 API，如 Vision API）
- 点击"保存"

**注意**：如果您选择复用现有的 `GOOGLE_VISION_API_KEY`，可以：

- 在 `.env` 文件中设置：`GOOGLE_SPEECH_API_KEY=${GOOGLE_VISION_API_KEY}`
- 或者直接使用同一个密钥，但确保该密钥已启用 Speech-to-Text API 权限

## 🔧 配置到服务器

### 方法 1：通过 SSH 编辑 .env 文件

```bash
ssh -i ~/.ssh/gordongmail.com.pem ec2-user@gordenfl.com
cd ~/CI/words-learning
nano .env
```

在 `.env` 文件中添加：

```bash
GOOGLE_SPEECH_API_KEY=your_api_key_here
```

保存后重启服务：

```bash
docker-compose restart backend
```

### 方法 2：在本地配置后重新部署

在本地项目的 `.env` 文件中添加：

```bash
GOOGLE_SPEECH_API_KEY=your_api_key_here
```

然后重新运行部署脚本（注意：部署脚本会排除 `.env` 文件，所以需要在服务器上手动添加）

## 💰 定价信息

Google Cloud Speech-to-Text API 的定价：

- **标准模型**：前 60 分钟/月免费，之后 $0.006/15 秒
- **增强模型**：前 60 分钟/月免费，之后 $0.009/15 秒

详细定价：<https://cloud.google.com/speech-to-text/pricing>

## 🔍 测试 API 密钥

配置完成后，可以通过以下方式测试：

```bash
# 在服务器上查看日志
ssh -i ~/.ssh/gordongmail.com.pem ec2-user@gordenfl.com
cd ~/CI/words-learning
docker-compose logs -f backend
```

然后在移动应用中测试语音识别功能，查看日志中是否有错误信息。

## 📚 相关文档

- [Google Cloud Speech-to-Text 官方文档](https://cloud.google.com/speech-to-text/docs)
- [API 密钥最佳实践](https://cloud.google.com/docs/authentication/api-keys)
- [定价页面](https://cloud.google.com/speech-to-text/pricing)

## ⚠️ 注意事项

1. **安全**：不要将 API 密钥提交到 Git 仓库
2. **配额**：注意 API 使用配额，避免超出预算
3. **测试**：建议先在测试环境验证 API 密钥是否正常工作
4. **备用方案**：如果 Google API 不可用，可以考虑使用百度语音识别 API

## 🔄 备用方案：百度语音识别

如果不想使用 Google Cloud，也可以使用百度语音识别：

1. 访问 [百度智能云](https://cloud.baidu.com/)
2. 注册/登录账号
3. 创建应用并获取 API Key 和 Secret Key
4. 在 `.env` 文件中配置：

   ```bash
   USE_BAIDU_SPEECH=true
   BAIDU_SPEECH_API_KEY=your_baidu_api_key
   BAIDU_SPEECH_SECRET_KEY=your_baidu_secret_key
   ```
