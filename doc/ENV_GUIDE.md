# 环境变量配置指南

## 📁 .env 文件位置

### ✅ 正确位置：项目根目录

```
words-learning/
├── .env           ← ✅ 这里！所有环境变量都在这里
├── .env.example   ← ✅ 模板文件
├── docker-compose.yml
├── backend/
│   └── server.js  ← 通过 Docker 环境变量传递
└── mobile__old/
    └── config.js  ← 不使用 .env（直接配置）
```

### ❌ 不要放在

```
❌ backend/.env       # 不要在这里
❌ mobile__old/.env        # 不要在这里
❌ 其他子目录         # 不要在这里
```

---

## 🔧 工作原理

### **1. Docker Compose 读取根目录 .env**

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      PORT: ${PORT:-3003}           ← 从根目录 .env 读取
      MONGODB_URI: ${MONGODB_URI}   ← 从根目录 .env 读取
      JWT_SECRET: ${JWT_SECRET}     ← 从根目录 .env 读取
```

### **2. 环境变量传递给容器**

```bash
.env (根目录)
  ↓ Docker Compose 读取
  ↓
docker-compose.yml
  ↓ 传递给容器
  ↓
backend 容器中的 process.env
  ↓
server.js 使用 process.env.PORT
```

### **3. 本地开发（不用 Docker）**

如果直接运行 `node backend/server.js`：

```javascript
// backend/server.js
dotenv.config(); // 默认读取当前目录的 .env

// 需要指定路径
dotenv.config({ path: '../.env' });
```

**但我们用 Docker，所以不需要 dotenv！**

---

## 📝 最佳实践

### **生产环境（Docker）：**

```
项目结构：
words-learning/
├── .env              ← 唯一的环境变量文件
├── .env.example      ← 模板
└── docker-compose.yml

运行：
docker-compose up -d

工作流程：
1. Docker Compose 读取 .env
2. 传递给容器
3. Node.js 直接使用 process.env
4. ✅ 不需要 dotenv.config()
```

### **本地开发（不用 Docker）：**

```
项目结构：
words-learning/
├── .env              ← 环境变量
└── backend/
    └── server.js

修改 server.js：
// 指定 .env 路径
dotenv.config({ path: path.join(__dirname, '../.env') });

运行：
cd backend
node server.js
```

---

## 🔄 当前配置清理

### **现在的文件：**

```bash
✅ ./.env              # 唯一的配置文件
✅ ./.env.example      # 模板文件
❌ ./backend/.env.example  # 已删除（不需要）
```

### **如果本地开发需要 dotenv：**

修改 `backend/server.js`：

```javascript
const path = require('path');
const dotenv = require('dotenv');

// 加载根目录的 .env
dotenv.config({ path: path.join(__dirname, '../.env') });
```

---

## 📊 两种部署方式对比

### **方式 1: 使用 Docker（当前，推荐）**

```
.env 位置: 根目录
读取方式: Docker Compose → 环境变量 → 容器
server.js: 直接使用 process.env（不需要 dotenv）
```

**优点**：

- ✅ 统一管理
- ✅ 生产环境标准做法
- ✅ 多服务共享配置

### **方式 2: 本地运行 Node.js**

```
.env 位置: 根目录或 backend/
读取方式: dotenv.config() → process.env
server.js: 需要 dotenv.config({ path: '../.env' })
```

**优点**：

- ✅ 快速启动
- ✅ 便于调试

---

## ✅ 推荐配置

### **最终文件结构：**

```
words-learning/
├── .env                    ← 唯一的环境变量文件
├── .env.example            ← 模板（可提交）
├── docker-compose.yml      ← 读取 .env
├── backend/
│   └── server.js           
└── mobile__old/
    └── config.js           ← 不使用 .env
```

### **修改 backend/server.js（可选，用于本地调试）：**

<function_calls>
<invoke name="search_replace">
<parameter name="file_path">/Users/yiliu/Documents/GitHub/words-learning/backend/server.js
