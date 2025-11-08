# 开发环境设置指南

## 目录
1. [前置要求](#前置要求)
2. [后端设置](#后端设置)
3. [移动应用设置](#移动应用设置)
4. [Docker部署](#docker部署)
5. [常见问题](#常见问题)

## 前置要求

### 必需软件
- Node.js (v16或更高版本)
- npm 或 yarn
- MongoDB (v5.0或更高版本)
- Git

### 可选软件
- Docker Desktop (用于容器化部署)
- Expo Go App (用于移动设备测试)
- iOS Simulator (macOS)
- Android Studio (Android开发)

## 后端设置

### 1. 安装MongoDB

**macOS:**
```bash
# 使用 Homebrew
brew tap mongodb/brew
brew install mongodb-community@7.0

# 启动 MongoDB
brew services start mongodb-community@7.0

# 验证安装
mongosh
```

**Windows:**
1. 下载 MongoDB Community Server: https://www.mongodb.com/try/download/community
2. 运行安装程序
3. 启动 MongoDB 服务

**Linux (Ubuntu):**
```bash
# 导入公钥
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# 添加仓库
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 安装
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动服务
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. 配置后端

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 创建环境变量文件
touch .env
```

编辑 `.env` 文件:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/words-learning
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

### 3. 启动后端服务

```bash
# 开发模式（自动重启）
npm run dev

# 或生产模式
npm start
```

验证服务运行:
```bash
curl http://localhost:3000/api/health
```

预期响应:
```json
{
  "status": "ok",
  "message": "Words Learning API is running"
}
```

## 移动应用设置

### 1. 安装Expo CLI

```bash
npm install -g expo-cli
```

### 2. 安装移动应用依赖

```bash
# 进入移动应用目录
cd mobile

# 安装依赖
npm install
```

### 3. 配置API地址

编辑 `mobile/src/services/api.js`:

```javascript
// 本地开发
const API_BASE_URL = 'http://localhost:3000/api';

// 如果使用Android模拟器
// const API_BASE_URL = 'http://10.0.2.2:3000/api';

// 如果使用物理设备（替换为你的电脑IP地址）
// const API_BASE_URL = 'http://192.168.1.100:3000/api';
```

### 4. 启动应用

```bash
npm start
```

### 5. 在设备上运行

**iOS模拟器 (仅macOS):**
```bash
# 按 'i' 键或运行:
npm run ios
```

**Android模拟器:**
```bash
# 按 'a' 键或运行:
npm run android
```

**物理设备:**
1. 安装 Expo Go 应用 (iOS/Android)
2. 扫描终端中的二维码

## Docker部署

### 1. 安装Docker

**macOS:**
```bash
brew install --cask docker
```

**Windows/Linux:**
访问 https://docs.docker.com/get-docker/

### 2. 启动所有服务

```bash
# 从项目根目录运行
docker-compose up -d

# 查看日志
docker-compose logs -f

# 仅查看后端日志
docker-compose logs -f backend
```

### 3. 停止服务

```bash
docker-compose down

# 删除数据卷（会清除所有数据）
docker-compose down -v
```

### 4. 重新构建

```bash
docker-compose up --build -d
```

## 测试API

### 使用curl测试

**注册用户:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**登录:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

保存返回的token，然后使用它访问受保护的路由:

**添加单词:**
```bash
curl -X POST http://localhost:3000/api/words \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "word": "challenge",
    "definition": "A difficult task"
  }'
```

## 常见问题

### Q: MongoDB连接失败
**A:** 
1. 确保MongoDB正在运行: `brew services list` (macOS) 或 `sudo systemctl status mongod` (Linux)
2. 检查 `.env` 中的 `MONGODB_URI` 是否正确
3. 尝试使用mongosh连接: `mongosh mongodb://localhost:27017`

### Q: 无法在Android模拟器访问API
**A:** 
Android模拟器不能使用 `localhost`，需要使用 `10.0.2.2`:
```javascript
const API_BASE_URL = 'http://10.0.2.2:3000/api';
```

### Q: iOS模拟器无法访问API
**A:**
1. 确保后端服务正在运行
2. 使用 `localhost` 或你的电脑IP地址
3. 检查防火墙设置

### Q: 依赖安装失败
**A:**
```bash
# 清除npm缓存
npm cache clean --force

# 删除node_modules和package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### Q: Expo启动失败
**A:**
```bash
# 清除Expo缓存
expo start -c

# 或
rm -rf .expo
npm start
```

### Q: Docker容器无法启动
**A:**
```bash
# 查看详细日志
docker-compose logs backend

# 重新构建
docker-compose up --build

# 检查端口是否被占用
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

## 开发工具推荐

### 编辑器
- VS Code + 插件:
  - ESLint
  - Prettier
  - React Native Tools
  - MongoDB for VS Code

### API测试
- Postman
- Insomnia
- REST Client (VS Code插件)

### 数据库管理
- MongoDB Compass
- Studio 3T
- mongosh (命令行)

## 下一步

完成环境设置后，你可以:

1. 查看 [README.md](README.md) 了解项目整体架构
2. 查看 [Requirements/BaseRequirement.md](Requirements/BaseRequirement.md) 了解功能需求
3. 开始开发新功能或修复问题

## 获取帮助

如有问题，请:
1. 查看本指南的[常见问题](#常见问题)部分
2. 搜索项目Issues
3. 创建新的Issue描述你的问题

