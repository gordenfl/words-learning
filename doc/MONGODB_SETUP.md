# MongoDB 配置指南

## 🎯 使用外部 MongoDB 实例

你的系统中已经有一个运行中的 MongoDB 实例（`mongodb`），本项目将复用它。

---

## 📋 当前 MongoDB 信息

- **容器名**: `mongodb`
- **镜像**: `mongo:6.0`
- **端口**: `27017`
- **与 words-learning 后端同网**: `words-learning-network`（`docker-compose` 创建；`mongodb` 容器需接入该网，见部署脚本或手动 `docker network connect`）

---

## 🔧 配置步骤

### **1. 检查 MongoDB 的用户名和密码**

```bash
# 查看 photoshare 的 docker-compose.yml 或 .env 文件
# 找到 MONGO_INITDB_ROOT_USERNAME 和 MONGO_INITDB_ROOT_PASSWORD
```

### **2. 更新本项目的 `.env` 文件**

编辑 `/Users/yiliu/Documents/GitHub/words-learning/.env`：

```bash
# MongoDB Configuration (使用 mongodb 的凭证)
MONGO_ROOT_USERNAME=admin  # 替换为 MongoDB 用户名
MONGO_ROOT_PASSWORD=your_actual_password  # 替换为 MongoDB 密码

# Backend MongoDB 连接 URI
# 通过容器名连接（推荐 - backend 容器会加入同一网络）
MONGODB_URI=mongodb://admin:your_actual_password@mongodb:27017/words-learning?authSource=admin

# JWT Secret (保持不变)
JWT_SECRET=TEcxMOFjVx5jj075m8j3pFwlUpQeFkmzHPtOemssBTk6RMpjcUG26-zX6bo5_A6U
PORT=3000
```

### **3. 启动后端服务**

```bash
# 启动 backend 容器
docker-compose up -d

# 查看日志
docker-compose logs -f backend
```

---

## 🌐 三种连接方式对比

### **方式 1: 通过容器名（推荐）✅**

```bash
MONGODB_URI=mongodb://admin:password@mongodb:27017/words-learning?authSource=admin
```

**优点**:

- ✅ 最快速，无需经过网络栈
- ✅ Docker 内部 DNS 自动解析
- ✅ 最安全，不暴露到宿主机

**前提**:

- backend 与 `mongodb` 容器必须在同一网络（`words-learning-network`）
- 已在根目录 `docker-compose.yml` 中配置；独立运行的 `mongodb` 需 `docker network connect words-learning-network mongodb`（或由 `scripts/cicd/remote-deploy.sh` 自动执行）

---

### **方式 2: 通过 host.docker.internal**

```bash
MONGODB_URI=mongodb://admin:password@host.docker.internal:27017/words-learning?authSource=admin
```

**优点**:

- ✅ 不需要在同一网络
- ✅ 适用于任何容器

**缺点**:

- ⚠️ 需要端口映射到宿主机（已有：0.0.0.0:27017）
- ⚠️ 稍慢一点

---

### **方式 3: 通过 localhost（本地运行 backend）**

```bash
MONGODB_URI=mongodb://admin:password@localhost:27017/words-learning?authSource=admin
```

**适用场景**:

- 如果你直接运行 `node server.js` 而不是用 Docker

---

## 📝 在 MongoDB 中创建新数据库

连接成功后，MongoDB 会自动创建 `words-learning` 数据库（第一次插入数据时）。

**验证连接**:

```bash
# 进入 MongoDB 容器
docker exec -it mongodb mongosh -u admin -p your_password --authenticationDatabase admin

# 查看所有数据库
show dbs

# 切换到新数据库（会自动创建）
use words-learning

# 查看集合（应该有：users, words, articles）
show collections
```

---

## ⚠️ 重要注意事项

### **1. 用户名和密码**

你需要知道 `mongodb` 容器的实际用户名和密码：

```bash
# 方法 1: 查看 photoshare 项目的 docker-compose.yml
cat /path/to/photoshare/docker-compose.yml | grep MONGO

# 方法 2: 查看容器的环境变量
docker inspect mongodb --format '{{.Config.Env}}' | grep MONGO
```

### **2. 网络配置**

当前配置让 backend 使用固定名称的桥接网络 `words-learning-network`，并把独立运行的 `mongodb` 容器接入该网：

```yaml
networks:
  words-learning-network:
    name: words-learning-network
    driver: bridge
```

这样 backend 和 MongoDB 就能用主机名 `mongodb` 互通。

### **3. 数据隔离**

虽然共用 MongoDB 实例，但是：

- ✅ `words-learning` 数据库是独立的
- ✅ 不会影响其他数据库（如 photoshare 的数据库）
- ✅ 数据完全隔离

---

## 🚀 快速开始

### **步骤 1: 复制并编辑 .env**

```bash
cp .env.example .env
nano .env
```

### **步骤 2: 填入 mongodb 的凭证**

找到 photoshare 项目的 MongoDB 用户名和密码，填入：

```bash
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=photoshare_mongodb_的实际密码

MONGODB_URI=mongodb://admin:实际密码@mongodb:27017/words-learning?authSource=admin
```

### **步骤 3: 启动服务**

```bash
docker-compose up -d
```

### **步骤 4: 验证连接**

```bash
# 查看日志
docker-compose logs backend

# 应该看到：
# ✅ Connected to MongoDB
```

---

## 🔍 故障排查

### **问题 1: 连接失败**

```bash
# 检查网络
docker network inspect words-learning-network

# 确认 backend 是否在网络中
docker inspect words-learning-backend --format '{{.NetworkSettings.Networks}}'
```

### **问题 2: 认证失败**

```bash
# 测试 MongoDB 凭证
docker exec -it mongodb mongosh -u admin -p 你的密码 --authenticationDatabase admin
```

### **问题 3: 找不到数据库**

```bash
# 数据库会在第一次写入数据时自动创建
# 注册一个用户或添加一个单词即可
```

---

## ✅ 优势总结

使用外部 MongoDB 的好处：

| 优势 | 说明 |
|------|------|
| 🔄 **资源共享** | 不需要运行两个 MongoDB 实例 |
| 💾 **节省内存** | MongoDB 比较占内存，共用一个更好 |
| 🔧 **统一管理** | 所有数据库在一个地方 |
| 📊 **数据隔离** | 不同项目的数据库完全独立 |

---

## 🎯 总结

**你需要做的**：

1. ✅ 找到 `mongodb` 的用户名和密码
2. ✅ 更新 `.env` 文件中的 `MONGO_ROOT_USERNAME` 和 `MONGO_ROOT_PASSWORD`
3. ✅ 更新 `MONGODB_URI`，使用 `mongodb` 作为主机名
4. ✅ 运行 `docker-compose up -d`

**docker-compose.yml 已经配置好了**：

- ❌ 不会创建新的 MongoDB 容器
- ✅ backend 使用 `words-learning-network`；需将现有 `mongodb` 容器接入该网（部署脚本可自动执行）
- ✅ 接入后可通过容器名 `mongodb` 直接连接

就这么简单！🎉
