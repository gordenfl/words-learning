## 线上部署 Django Admin（gordenfl.com）

本仓库的 Django 后端在 `backend/`，已包含 `admin/` 路由：

- Admin：`/admin/`
- API：`/api/*`

### 最终访问链接

- `http://gordenfl.com:8088/admin/`

> 如果你未来要做 HTTPS + 不带端口的链接（`https://gordenfl.com/admin/`），需要再加一层 Nginx/反代与证书配置。

---

## 部署步骤（服务器）

1. SSH 到服务器：

```bash
ssh ec2-user@gordenfl.com
```

2. 进入部署目录（按你的实际路径；示例）：

```bash
cd /home/ec2-user/CI/words-learning
```

3. 确保 `.env` 已配置 Mongo/JWT（至少）：

```bash
cat .env | sed -n '1,80p'
```

4. 启动（或重启）Django 容器：

```bash
docker compose up -d --build backend
docker compose logs -f backend
```

5. 访问：

- `http://gordenfl.com:8088/admin/`

---

## 常见问题

### 访问 `/admin/` 显示 `Cannot GET /admin`

说明你访问的不是 Django 服务（通常是另一个 Node/API 容器），或者端口映射不对。

请用下面命令确认端口：

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}'
```

### 端口 8088 访问不到

确认服务器安全组/防火墙放行 TCP 8088，或改为只允许你自己的 IP。

