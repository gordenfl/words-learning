# Words Learning API (Python / Django MongoDB Backend)

与 Node 版 `backend` 行为一致，使用 Python + Django + [Django MongoDB Backend](https://www.mongodb.com/docs/languages/python/django-mongodb/current/) 实现，数据仍使用同一 MongoDB（`words-learning`），可与现有前端/移动端共用。

## 环境要求

- Python 3.10+
- MongoDB（与 Node 版相同连接串即可）

## 安装与运行

```bash
cd backend_new
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

环境变量与 Node 版一致，可从项目根目录或 `backend_new` 下使用 `.env`，例如：

- `MONGODB_URI`：MongoDB 连接串
- `JWT_SECRET`：JWT 密钥
- `OPENAI_API_KEY` / `DEEPSEEK_API_KEY`、`USE_DEEPSEEK`：AI 文章与组词例句
- `GOOGLE_VISION_API_KEY` / `BAIDU_OCR_*`、`USE_GOOGLE_VISION`：OCR
- `GOOGLE_SPEECH_API_KEY` / `BAIDU_SPEECH_*`、`USE_BAIDU_SPEECH`：语音识别

### 连服务器上的 MongoDB（gordenfl.com mongodb）

服务器上 27017 已映射，但从本机直连 `gordenfl.com:27017` 通常会被防火墙拦截，建议用 **SSH 隧道**：

1. 在项目里执行（保持终端不关）：
   ```bash
   cd backend_new && chmod +x scripts/ssh-tunnel-mongo.sh && ./scripts/ssh-tunnel-mongo.sh
   ```
   若密钥不在默认路径，可：`SSH_KEY=/path/to/your.pem ./scripts/ssh-tunnel-mongo.sh`

2. 在 `backend_new` 的 `.env` 中设置：
   ```bash
   MONGODB_URI=mongodb://localhost:27017/words-learning
   ```
   若 MongoDB 开启了认证，改为：
   ```bash
   MONGODB_URI=mongodb://admin:你的密码@localhost:27017/words-learning?authSource=admin
   ```

3. 另开终端运行：`python manage.py runserver 8088`，即可用本机 backend_new 连服务器上的 MongoDB。

启动：

```bash
python manage.py runserver 8088
```

默认端口 8088，与 Node 版一致；如需改端口：`python manage.py runserver 0.0.0.0:8088`。

## API 路径（与 Node 版相同）

- `GET/POST /api/auth/*`：注册、登录、OAuth、改密等
- `GET/POST /api/words/*`：单词列表、统计、新增、批量、状态、生成组词例句
- `GET/PATCH/DELETE /api/users/*`：用户信息、学习计划、主题、关注等
- `GET/POST /api/articles/*`：文章列表、生成、标记已读
- `POST /api/ocr/extract`、`/api/ocr/extract-base64`：OCR
- `POST /api/speech/recognize`、`/api/speech/recognize-base64`：语音识别
- `GET /api/health`：健康检查

逻辑与 Node 版保持一致，仅实现语言与框架不同。

## Docker 部署（服务器）

在项目根目录（与 `docker-compose.yml` 同级）：

```bash
# 构建并启动 Django 服务（与 Node backend 共用同一网络，可连 mongodb）
docker-compose up -d backend_new

# 查看日志
docker-compose logs -f backend_new
```

- 容器名：`words-learning-backend-new`
- 端口：**8089**（映射到容器内 8088，与 Node 版 8088 错开）
- 需在 `.env` 中配置 `MONGODB_URI`（例如 `mongodb://user:pass@mongodb:27017/words-learning?authSource=admin`），确保与 `mongodb` 在同一 Docker 网络（如 `photoshare-network`）。

若希望 Django 独占 8088，可把 `docker-compose.yml` 里 `backend_new` 的端口改为 `"8088:8088"`，并停掉 Node 的 `backend` 服务。
