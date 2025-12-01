# Google Speech API 快速创建指南

## 🎯 您当前看到的是什么？

您当前看到的是 **OAuth 2.0 Client IDs**，这些是用于：

- ✅ Google Login（移动端登录）
- ❌ **不能用于** Speech-to-Text API

## 📝 需要额外创建什么？

您需要创建一个 **API 密钥（API Key）**，用于后端调用 Speech-to-Text API。

## 🚀 快速操作步骤

### 步骤 1：启用 Speech-to-Text API

1. 在左侧导航栏，点击 **"API 和服务"（APIs & Services）** > **"库"（Library）**
2. 在搜索框中输入 **"Speech-to-Text"**
3. 找到 **"Cloud Speech-to-Text API"**，点击进入
4. 点击 **"启用"（Enable）** 按钮

### 步骤 2：创建 API 密钥

1. 在左侧导航栏，点击 **"API 和服务"（APIs & Services）** > **"凭据"（Credentials）**
2. 点击页面右上角的 **"+ CREATE CREDENTIALS"** 按钮
3. 在下拉菜单中选择 **"API key"**
4. 系统会生成一个新的 API 密钥，**立即复制并保存**（只显示一次）

### 步骤 3：配置 API 密钥限制（推荐）

1. 点击刚创建的 API 密钥名称进入编辑页面
2. **API 限制（API restrictions）**：
   - 选择 "限制密钥"（Restrict key）
   - 勾选 "Cloud Speech-to-Text API"
   - 如果还要用于 Vision API，也勾选 "Cloud Vision API"
3. **应用限制（Application restrictions）**（可选）：
   - 选择 "IP 地址（网络服务器、cron 作业等）"
   - 添加您的服务器 IP 地址
4. 点击 **"保存"（Save）**

### 步骤 4：配置到服务器

```bash
ssh -i ~/.ssh/gordongmail.com.pem ec2-user@gordenfl.com
cd ~/CI/words-learning
nano .env
```

在 `.env` 文件中添加：

```bash
GOOGLE_SPEECH_API_KEY=你刚才复制的API密钥
```

保存后重启服务：

```bash
docker-compose restart backend
```

## 📊 总结

| 凭据类型 | 用途 | 您需要创建吗？ |
|---------|------|--------------|
| OAuth 2.0 Client IDs | Google Login（移动端） | ✅ 已有（不需要再创建） |
| API Key | Speech-to-Text API（后端） | ❌ **需要创建** |

## ✅ 检查清单

- [ ] 已启用 Speech-to-Text API
- [ ] 已创建 API 密钥
- [ ] 已配置 API 密钥限制
- [ ] 已添加到服务器 `.env` 文件
- [ ] 已重启后端服务

## 🔍 验证

配置完成后，测试语音识别功能，查看服务器日志：

```bash
docker-compose logs -f backend
```

如果看到 "✅ Google Speech recognized: ..." 说明配置成功！

