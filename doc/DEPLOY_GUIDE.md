# 部署指南

## 🔒 安全说明

### **哪些文件可以提交到 GitHub？**

| 文件 | 可以提交？ | 原因 |
|------|----------|------|
| `deploy.sh.example` | ✅ 可以 | 只包含占位符，无敏感信息 |
| `deploy.sh` | ❌ **不可以** | 包含真实服务器地址和密钥路径 |
| `.env.example` | ✅ 可以 | 只包含示例值 |
| `.env` | ❌ **不可以** | 包含真实密码和 API keys |
| `docker-compose.yml` | ✅ 可以 | 使用环境变量，无硬编码 |

### **已加入 `.gitignore` 的敏感文件：**

```
.env              # 环境变量（密码、API keys）
.env.server       # 服务器端环境变量
deploy.sh         # 部署脚本（服务器信息）
*.tar.gz          # 部署包
```

---

## 🚀 快速部署到外网

### **步骤 1: 准备部署脚本**

```bash
# 复制模板
cp deploy.sh.example deploy.sh

# 编辑配置
nano deploy.sh

# 修改这些值：
SERVER_USER="ec2-user"                      # 你的服务器用户名
SERVER_HOST="gordenfl.com"                  # 你的服务器地址
SSH_KEY="$HOME/.ssh/gordongmail.com.pem"   # 你的 SSH 密钥路径
DEPLOY_PATH="/home/ec2-user/CI/words-learning"  # 部署目录
```

---

### **步骤 2: 测试 SSH 连接**

```bash
# 确保能 SSH 到服务器
ssh -i ~/.ssh/gordongmail.com.pem ec2-user@gordenfl.com

# 如果成功，退出服务器
exit
```

---

### **步骤 3: 执行部署**

```bash
# 运行部署脚本
./deploy.sh
```

**脚本会自动：**

1. 📦 打包代码（排除 node_modules, .git, .env）
2. 📤 上传到服务器
3. 📂 解压到服务器目录
4. ⚙️  配置环境变量
5. 🐳 启动 Docker 容器

---

### **步骤 4: 在服务器上配置 .env**

```bash
# SSH 到服务器
ssh -i ~/.ssh/gordongmail.com.pem ec2-user@gordenfl.com

# 进入项目目录
cd ~/CI/words-learning

# 编辑 .env（第一次部署需要）
nano .env

# 修改 MongoDB URI 为 localhost（因为在同一台服务器）
MONGODB_URI=mongodb://gordon_admin:gordenfl@localhost:27017/words-learning?authSource=admin

# 保存并退出（Ctrl+X, Y, Enter）

# 重启服务
docker-compose restart backend

# 查看日志
docker-compose logs -f backend
```

---

### **步骤 5: 配置服务器防火墙**

```bash
# 在服务器上
sudo firewall-cmd --permanent --add-port=3003/tcp  # CentOS/RHEL
# 或
sudo ufw allow 3003/tcp  # Ubuntu

# AWS 安全组设置
# 在 AWS 控制台添加入站规则：
# Type: Custom TCP
# Port: 3003
# Source: 0.0.0.0/0 (或限制为特定 IP)
```

---

### **步骤 6: 测试外网访问**

```bash
# 从本地测试
curl http://gordenfl.com:3003/api/health

# 应该返回：
# {"status":"ok","message":"Words Learning API is running"}
```

---

### **步骤 7: 更新手机 App 配置**

编辑 `mobile/config.js`：

```javascript
const Config = {
  API: {
    HOST: 'gordenfl.com',  // 改为你的服务器域名
    PORT: '3003',
    get BASE_URL() {
      return `http://${this.HOST}:${this.PORT}/api`;
    }
  },
};
```

**重新加载 App，现在可以从任何地方访问了！** 🌍

---

## 🔐 安全最佳实践

### **1. 不要硬编码敏感信息**

❌ **不安全：**

```bash
# deploy.sh
SSH_KEY="/Users/yiliu/.ssh/my-private-key.pem"
SERVER_PASSWORD="mypassword123"
```

✅ **安全：**

```bash
# deploy.sh
SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/default-key.pem}"
# 或从配置文件读取
source deploy.config  # deploy.config 在 .gitignore 中
```

---

### **2. 使用配置文件**

创建 `deploy.config`（不提交到 Git）：

```bash
# deploy.config（加入 .gitignore）
export DEPLOY_SSH_KEY="$HOME/.ssh/gordongmail.com.pem"
export DEPLOY_SERVER_USER="ec2-user"
export DEPLOY_SERVER_HOST="gordenfl.com"
export DEPLOY_PATH="/home/ec2-user/CI/words-learning"
```

修改 `deploy.sh`：

```bash
# 加载配置
if [ -f deploy.config ]; then
  source deploy.config
else
  echo "❌ deploy.config not found! Copy from deploy.config.example"
  exit 1
fi
```

---

### **3. 你的 deploy.sh 的安全性分析**

| 信息 | 敏感度 | 风险 |
|------|--------|------|
| `gordenfl.com` | 🟡 中 | 域名是公开的，但暴露了服务器地址 |
| `ec2-user` | 🟢 低 | AWS 默认用户名，很常见 |
| `gordongmail.com.pem` | 🟡 中 | 暴露了密钥文件名（但密钥本身不在仓库中）|
| `/home/ec2-user/CI/words-learning` | 🟢 低 | 只是路径，不敏感 |

**总体风险**: 🟡 **中等**

**建议**: 不要提交真实的 `deploy.sh`，只提交 `deploy.sh.example`

---

## ✅ 我已经做的安全改进

### **1. 更新了 `.gitignore`**

```
.env              # 密码和 API keys
.env.server       # 服务器端配置
deploy.sh         # 真实部署脚本 ← 新增
*.tar.gz          # 部署包 ← 新增
```

### **2. 创建了安全模板**

```
deploy.sh.example  # ✅ 可以提交（占位符）
deploy.sh          # ❌ 不提交（真实配置）
```

---

## 📝 正确的使用流程

### **其他开发者克隆项目后：**

```bash
# 1. 克隆仓库
git clone https://github.com/your/words-learning.git
cd words-learning

# 2. 复制模板
cp deploy.sh.example deploy.sh

# 3. 编辑配置（填入自己的服务器信息）
nano deploy.sh

# 4. 执行部署
./deploy.sh
```

---

## 🎯 立即部署到外网

现在你可以运行：

```bash
# 1. 执行部署脚本
./deploy.sh

# 2. 等待完成（约 2-3 分钟）

# 3. 测试外网访问
curl http://gordenfl.com:3003/api/health

# 4. 更新手机 App
# 编辑 mobile/config.js
# HOST: 'gordenfl.com'
```

**你想现在就部署吗？** 🚀
