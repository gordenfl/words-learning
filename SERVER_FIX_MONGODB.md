# 服务器上 MongoDB 连接修复

## 🔍 问题

backend 容器无法连接到 MongoDB（ECONNREFUSED 127.0.0.1:27017）

## 🔧 解决方案（三选一）

---

### **方案 A: 使用 host.docker.internal（最简单）**

在服务器上执行：

```bash
# 1. 编辑 .env
cd ~/CI/words-learning
nano .env

# 2. 将 MONGODB_URI 改为：
MONGODB_URI=mongodb://gordon_admin:gordenfl@host.docker.internal:27017/words-learning?authSource=admin
#                                            ^^^^^^^^^^^^^^^^^^^^ 改这里

# 3. 保存并重启
docker-compose restart backend

# 4. 查看日志
docker logs words-learning-backend

# 应该看到：
# ✅ Connected to MongoDB
```

---

### **方案 B: 使用宿主机 IP**

```bash
# 1. 获取宿主机内网 IP
hostname -I | awk '{print $1}'
# 假设输出：172.31.x.x

# 2. 编辑 .env
nano .env

# 3. 修改 MONGODB_URI：
MONGODB_URI=mongodb://gordon_admin:gordenfl@172.31.x.x:27017/words-learning?authSource=admin
#                                            ^^^^^^^^^^ 用实际 IP

# 4. 重启
docker-compose restart backend
```

---

### **方案 C: 使用 Docker 网络（最标准）**

```bash
# 1. 查看 MongoDB 容器名
docker ps --format "table {{.Names}}\t{{.Image}}" | grep mongo

# 2. 查看 MongoDB 所在网络
docker inspect <mongodb-container-name> --format '{{range $net, $config := .NetworkSettings.Networks}}{{$net}}{{"\n"}}{{end}}'

# 3. 编辑 docker-compose.yml，添加网络配置
# （本地已更新，重新部署即可）

# 4. 更新 .env 使用容器名
MONGODB_URI=mongodb://gordon_admin:gordenfl@<mongodb-container-name>:27017/words-learning?authSource=admin

# 5. 重启
docker-compose down
docker-compose up -d
```

---

## ✅ 推荐：方案 A（最简单）

在服务器上只需要两步：

```bash
# 1. 更新 .env
sed -i 's/@localhost:/@host.docker.internal:/g' ~/CI/words-learning/.env

# 2. 重启
cd ~/CI/words-learning && docker-compose restart backend
```

完成！✨

