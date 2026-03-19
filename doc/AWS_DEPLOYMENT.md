# AWS 服务器部署指南

## 🚀 将 words-learning 部署到 AWS

本指南将帮助你将项目部署到 AWS EC2 服务器。

---

## 📋 部署前准备

### **1. AWS 服务器要求**

- **实例类型**: t2.small 或更高（至少 2GB 内存）
- **操作系统**: Ubuntu 22.04 LTS 或 Amazon Linux 2023
- **存储**: 至少 20GB
- **安全组**: 开放端口 22 (SSH), 3003 (API), 443 (HTTPS)

### **2. 你需要准备**

- ✅ AWS EC2 实例已创建并运行
- ✅ SSH 密钥（.pem 文件）
- ✅ 服务器的公网 IP 地址
- ✅ MongoDB 选择（本地或云服务）

---

## 🔧 部署步骤

### **步骤 1: 连接到 AWS 服务器**

```bash
# 设置密钥权限（仅第一次）
chmod 400 ~/Downloads/your-key.pem

# SSH 连接到服务器
ssh -i ~/Downloads/your-key.pem ubuntu@your-server-ip
# 或 Amazon Linux:
# ssh -i ~/Downloads/your-key.pem ec2-user@your-server-ip
```

---

### **步骤 2: 安装 Docker 和 Docker Compose**

#### **Ubuntu 22.04:**

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER

# 重新登录或运行
newgrp docker

# 验证安装
docker --version
docker compose version
```

#### **Amazon Linux 2023:**

```bash
# 安装 Docker
sudo yum update -y
sudo yum install docker -y

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 添加用户到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证
docker --version
docker-compose --version
```

---

### **步骤 3: 上传项目代码**

#### **方式 1: 使用 Git（推荐）**

```bash
# 在服务器上
cd ~
git clone https://github.com/your-username/words-learning.git
cd words-learning
```

#### **方式 2: 使用 scp 上传**

```bash
# 在本地 Mac 上
cd /Users/yiliu/Documents/GitHub/words-learning
tar czf words-learning.tar.gz --exclude=node_modules --exclude=.git .

# 上传到服务器
scp -i ~/Downloads/your-key.pem words-learning.tar.gz ubuntu@your-server-ip:~/

# 在服务器上解压
ssh -i ~/Downloads/your-key.pem ubuntu@your-server-ip
mkdir -p ~/words-learning
cd ~/words-learning
tar xzf ../words-learning.tar.gz
```

---

### **步骤 4: 配置环境变量**

```bash
# 在服务器上
cd ~/words-learning

# 复制模板
cp .env.example .env

# 编辑配置
nano .env
```

#### **重要配置项：**

```bash
# ============================================
# 服务器端口
# ============================================
PORT=3003

# ============================================
# MongoDB 配置（选择一个方案）
# ============================================

# 方案 A: 使用 AWS MongoDB 服务（推荐）
# 比如 MongoDB Atlas (免费套餐)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/words-learning?retryWrites=true&w=majority

# 方案 B: 使用服务器本地 MongoDB（需要安装）
# MONGODB_URI=mongodb://localhost:27017/words-learning

# 方案 C: 使用其他服务器的 MongoDB
# MONGODB_URI=mongodb://admin:password@other-server-ip:27017/words-learning?authSource=admin

# ============================================
# JWT Secret（必须修改！）
# ============================================
JWT_SECRET=生成一个新的安全密钥

# ============================================
# AI API（必需）
# ============================================
DEEPSEEK_API_KEY=你的DeepSeek密钥
USE_DEEPSEEK=true

# ============================================
# OCR API（可选）
# ============================================
GOOGLE_VISION_API_KEY=你的Google密钥
USE_GOOGLE_VISION=true
```

#### **生成安全密钥：**

```bash
# 在服务器上生成
python3 -c "import secrets; print('JWT_SECRET=' + secrets.token_urlsafe(48))"
```

---

### **步骤 5: 配置 MongoDB**

#### **方案 A: 使用 MongoDB Atlas（推荐，免费）**

1. 访问 <https://www.mongodb.com/cloud/atlas>
2. 注册/登录账号
3. 创建免费集群（Free Tier）
4. 创建数据库用户
5. 获取连接字符串
6. 添加服务器 IP 到白名单

**优点**：

- ✅ 免费 512MB
- ✅ 自动备份
- ✅ 高可用性
- ✅ 不占用服务器资源

#### **方案 B: 服务器本地 MongoDB**

```bash
# 修改 docker-compose.yml 添加 MongoDB 服务
# 或直接在服务器安装 MongoDB
```

**优点**：

- ✅ 完全控制
- ✅ 低延迟

**缺点**：

- ❌ 需要管理和备份
- ❌ 占用服务器资源

---

### **步骤 6: 启动服务**

```bash
# 在服务器上
cd ~/words-learning

# 构建并启动（第一次可能需要几分钟）
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 应该看到：
# 🚀 Server is running on port 3003
# ✅ Connected to MongoDB
```

---

### **步骤 7: 配置防火墙和安全组**

#### **AWS 安全组设置：**

1. 打开 AWS EC2 控制台
2. 选择你的实例
3. 点击 Security → Security Groups
4. 编辑 Inbound Rules，添加：

| Type | Protocol | Port | Source | 描述 |
|------|----------|------|--------|------|
| SSH | TCP | 22 | Your IP | SSH 访问 |
| Custom TCP | TCP | 3003 | 0.0.0.0/0 | API 访问 |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS（可选）|

#### **Ubuntu UFW 防火墙：**

```bash
# 启用防火墙
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3003/tcp  # API
sudo ufw enable

# 查看状态
sudo ufw status
```

---

### **步骤 8: 测试部署**

```bash
# 在本地 Mac 测试
curl http://your-server-ip:3003/api/health

# 应该返回：
# {"status":"ok","message":"Words Learning API is running"}

# 测试注册
curl -X POST http://your-server-ip:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"test123"}'
```

---

### **步骤 9: 更新移动 App 配置**

修改 `mobile/config.js`：

```javascript
const Config = {
  API: {
    HOST: 'your-server-ip',  // 改成 AWS 服务器的公网 IP
    PORT: '3003',
    get BASE_URL() {
      return `http://${this.HOST}:${this.PORT}/api`;
    }
  },
};
```

---

## 🔄 常用运维命令

### **查看服务状态：**

```bash
ssh -i your-key.pem ubuntu@your-server-ip

# 查看容器状态
docker ps

# 查看日志
docker-compose logs -f backend

# 查看资源使用
docker stats
```

### **重启服务：**

```bash
# 重启
docker-compose restart

# 或完全重新部署
docker-compose down
docker-compose up -d --build
```

### **更新代码：**

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

### **备份数据：**

```bash
# 如果使用本地 MongoDB
docker exec mongodb mongodump \
  -u admin -p password \
  --authenticationDatabase admin \
  --db words-learning \
  --out /backup

# 下载备份到本地
scp -i your-key.pem -r ubuntu@your-server-ip:/backup ./mongodb-backup
```

---

## 🌐 配置域名（可选）

### **步骤 1: 获取域名**

- 从 Namecheap, GoDaddy, 或 Cloudflare 购买域名
- 例如：`api.words-learning.com`

### **步骤 2: 配置 DNS**

在域名提供商的 DNS 设置中：

```
Type: A
Name: api (或 @)
Value: your-server-ip
TTL: 3600
```

### **步骤 3: 安装 Nginx 和 SSL**

```bash
# 安装 Nginx
sudo apt install nginx -y

# 安装 Certbot（Let's Encrypt）
sudo apt install certbot python3-certbot-nginx -y

# 配置 Nginx
sudo nano /etc/nginx/sites-available/words-learning

# 添加配置：
server {
    listen 80;
    server_name api.words-learning.com;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# 启用配置
sudo ln -s /etc/nginx/sites-available/words-learning /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 获取 SSL 证书
sudo certbot --nginx -d api.words-learning.com

# 自动续期
sudo certbot renew --dry-run
```

### **步骤 4: 更新 App 配置**

```javascript
// mobile/config.js
const Config = {
  API: {
    HOST: 'api.words-learning.com',  // 使用域名
    PORT: '',  // HTTPS 默认 443
    get BASE_URL() {
      const port = this.PORT ? `:${this.PORT}` : '';
      return `https://${this.HOST}${port}/api`;  // 使用 HTTPS
    }
  },
};
```

---

## 📊 架构对比

### **本地开发（现在）：**

```
你的 Mac
└─ Docker
   └─ words-learning-backend (3003)
   └─ mongodb (27017)

手机 App → http://192.168.101.95:3003
```

### **部署到 AWS（未来）：**

```
AWS EC2 服务器 (公网 IP: 1.2.3.4)
├─ Docker
│  └─ words-learning-backend (3003)
│
└─ MongoDB 选择：
   选项 A: MongoDB Atlas (云数据库) ← 推荐
   选项 B: 本地 Docker MongoDB
   选项 C: 另一台 MongoDB 服务器

手机 App → http://1.2.3.4:3003
或域名 → https://api.words-learning.com
```

---

## 🎯 快速部署脚本

创建一个自动化部署脚本：

```bash
#!/bin/bash
# deploy.sh - 在服务器上运行

echo "🚀 Starting deployment..."

# 1. 更新代码
echo "📥 Pulling latest code..."
git pull

# 2. 停止旧容器
echo "🛑 Stopping old containers..."
docker-compose down

# 3. 构建新镜像
echo "🏗️ Building new images..."
docker-compose build

# 4. 启动服务
echo "▶️ Starting services..."
docker-compose up -d

# 5. 清理旧镜像
echo "🧹 Cleaning up..."
docker image prune -f

# 6. 显示状态
echo "✅ Deployment complete!"
docker-compose ps
docker-compose logs --tail 20 backend

echo ""
echo "🌐 API URL: http://$(curl -s ifconfig.me):3003/api/health"
```

---

## 📦 部署检查清单

### **在服务器上：**

- [ ] Docker 已安装
- [ ] Docker Compose 已安装
- [ ] 代码已上传
- [ ] .env 文件已配置
- [ ] MongoDB 已配置（Atlas 或本地）
- [ ] 端口 3003 已开放
- [ ] 容器正在运行

### **验证：**

```bash
# 1. 检查容器
docker ps | grep words-learning

# 2. 检查日志
docker logs words-learning-backend

# 3. 测试 API
curl http://localhost:3003/api/health

# 4. 从外部测试
curl http://your-server-ip:3003/api/health
```

---

## 🔐 安全建议

### **1. 使用环境变量**

```bash
# 永远不要在代码中硬编码：
❌ const password = "123456"
✅ const password = process.env.PASSWORD
```

### **2. 限制 SSH 访问**

```bash
# 只允许特定 IP SSH
sudo nano /etc/ssh/sshd_config
# 添加：
AllowUsers ubuntu@your-ip

sudo systemctl restart sshd
```

### **3. 使用 HTTPS**

```bash
# 安装 Let's Encrypt SSL 证书
sudo certbot --nginx
```

### **4. 定期更新**

```bash
# 自动更新安全补丁
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 🗄️ MongoDB 方案对比

### **方案 A: MongoDB Atlas（推荐）**

**优点**：

- ✅ 免费 512MB
- ✅ 自动备份
- ✅ 全球 CDN
- ✅ 不占用服务器资源
- ✅ 3 分钟完成设置

**步骤**：

1. 访问 <https://www.mongodb.com/cloud/atlas/register>
2. 创建免费集群
3. 创建数据库用户
4. 获取连接字符串
5. 添加服务器 IP 到白名单（或 0.0.0.0/0）

**连接字符串示例**：

```bash
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/words-learning?retryWrites=true&w=majority
```

---

### **方案 B: 服务器本地 MongoDB**

修改 `docker-compose.yml`，添加 MongoDB 服务：

```yaml
services:
  mongodb:
    image: mongo:6.0
    container_name: words-learning-mongodb
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    networks:
      - words-learning-network

  backend:
    # ... existing config
    networks:
      - words-learning-network

volumes:
  mongodb_data:

networks:
  words-learning-network:
    driver: bridge
```

---

## 📱 更新移动 App

### **本地开发配置：**

```javascript
// mobile/config.js
const Config = {
  API: {
    HOST: '192.168.101.95',  // 本地 IP
    PORT: '3003',
  },
};
```

### **生产环境配置：**

```javascript
// mobile/config.js
const IS_PRODUCTION = false; // 发布时改为 true

const Config = {
  API: {
    HOST: IS_PRODUCTION 
      ? 'api.words-learning.com'  // 或服务器 IP
      : '192.168.101.95',         // 本地开发
    PORT: IS_PRODUCTION ? '' : '3003',
    get BASE_URL() {
      const protocol = IS_PRODUCTION ? 'https' : 'http';
      const port = this.PORT ? `:${this.PORT}` : '';
      return `${protocol}://${this.HOST}${port}/api`;
    }
  },
};
```

---

## 🔄 持续部署（CI/CD）

### **使用 GitHub Actions（可选）**

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ubuntu
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/words-learning
            git pull
            docker-compose down
            docker-compose up -d --build
            docker-compose logs --tail 50 backend
```

---

## 📊 成本估算

| 服务 | 方案 | 月费用 |
|------|------|--------|
| **服务器** | AWS EC2 t2.small | ~$17 |
| **服务器** | AWS EC2 t2.micro (免费层) | $0（首年）|
| **MongoDB** | MongoDB Atlas (Free) | $0 |
| **MongoDB** | MongoDB Atlas (M10) | $57 |
| **域名** | .com 域名 | ~$12/年 |
| **SSL** | Let's Encrypt | $0 |

**推荐配置（低成本）**：

- EC2 t2.micro（免费层）+ MongoDB Atlas Free = **$0/月** 🎉

---

## ✅ 部署完成检查

```bash
# 1. 服务器上检查
docker ps  # 容器运行中
docker logs words-learning-backend | grep "Connected to MongoDB"

# 2. 本地测试 API
curl http://your-server-ip:3003/api/health

# 3. 手机 App 测试
# 更新 config.js 后重新加载 App

# 4. 监控
docker stats  # 查看资源使用
```

---

## 🆘 常见问题

### **Q: 容器无法启动**

```bash
# 查看详细日志
docker-compose logs backend
docker inspect words-learning-backend
```

### **Q: MongoDB 连接失败**

```bash
# 测试连接
docker exec -it words-learning-backend sh
ping mongodb  # 或测试 MongoDB Atlas
```

### **Q: 端口无法访问**

```bash
# 检查防火墙
sudo ufw status
# 检查 AWS 安全组
```

---

## 🎯 总结

### **最简单的部署方式：**

```bash
# 1. 在服务器上
sudo apt update
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 2. 上传代码
git clone your-repo
cd words-learning

# 3. 配置
cp .env.example .env
nano .env  # 填入 MongoDB Atlas 连接字符串

# 4. 启动
docker-compose up -d

# 5. 测试
curl http://localhost:3003/api/health
```

**完成！** 🚀

你需要我帮你一步步执行这些操作吗？我可以帮你生成具体的命令！
