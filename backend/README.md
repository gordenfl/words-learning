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

### TTS 朗读（可选）

朗读功能默认使用**浏览器内置语音**。若要使用 ChatTTS AI 语音：

```bash
pip install ChatTTS torch torchaudio numpy transformers==4.53.2
```

- **无需配置环境变量**
- 首次运行会从 HuggingFace 下载模型（约 500MB）
- 若 ChatTTS 不可用（未安装或报错），会自动回退到浏览器语音
- 已知兼容性：需 `transformers==4.53.2`（其他版本可能触发 narrow() 报错，见 [ChatTTS#955](https://github.com/2noise/ChatTTS/issues/955)）
- **PyTorch 版本**：若出现 `Cannot copy out of meta tensor` 错误，说明 PyTorch 2.2+ 与 ChatTTS 不兼容。建议使用 **Python 3.11 或 3.12** 和 **PyTorch 2.1.x**：`pip install torch==2.1.2 torchaudio==2.1.2`

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
- `GET /api/speech/tts/voices`、`POST /api/speech/tts/synthesize`：TTS 朗读（ChatTTS）
- `GET /api/health`：健康检查

逻辑与 Node 版保持一致，仅实现语言与框架不同。

## 部署到 gordenfl.com 外网服务器（Docker）

在**本机**项目根目录 `words-learning` 下执行一键部署（会把 `backend_new` 和 `docker-compose.yml` 同步到服务器并启动容器）：

```bash
chmod +x backend_new/scripts/deploy-to-gordenfl.sh
./backend_new/scripts/deploy-to-gordenfl.sh
```

**前提：**

1. 本机可 SSH 到 gordenfl.com（默认用 `ec2-user`、密钥 `~/.ssh/gordongmai.com.pem`）。  
   自定义时：`DEPLOY_USER=ec2-user DEPLOY_HOST=gordenfl.com DEPLOY_SSH_KEY=/path/to/key.pem DEPLOY_PATH=/home/ec2-user/CI/words-learning ./backend_new/scripts/deploy-to-gordenfl.sh`
2. 服务器上已有目录 `DEPLOY_PATH`（默认 `/home/ec2-user/CI/words-learning`）。`docker-compose` 使用固定网络 `words-learning-network`；部署脚本会尝试把名为 `mongodb` 的容器接入该网（与 backend 同网后 URI 里才能用主机名 `mongodb`）。
3. 服务器 `DEPLOY_PATH/.env` 中配置好 `MONGODB_URI`，**主机名必须用 `mongodb`**（容器名），例如：  
   `MONGODB_URI=mongodb://gordon_admin:gordenfl@mongodb:27017/words-learning?authSource=admin`  
   若服务器还没有 `.env`，可先在本地配置好项目根目录的 `.env`，脚本会同步到服务器。

**部署后：**

- 容器名：`words-learning-backend-new`
- 对外端口：**8089**
- API 地址：`http://gordenfl.com:8089`，健康检查：`curl http://gordenfl.com:8089/api/health`
- 查看日志：`ssh ec2-user@gordenfl.com "cd /home/ec2-user/CI/words-learning && docker-compose logs -f backend_new"`

---

## Docker 本地/其他服务器

在项目根目录（与 `docker-compose.yml` 同级）手动构建并启动：

```bash
docker-compose up -d --build backend_new
docker-compose logs -f backend_new
```

- 需在 `.env` 中配置 `MONGODB_URI`（连 Docker 时主机名用 `mongodb`，与 mongodb 容器同网）。
- 若希望 Django 独占 8088，把 `docker-compose.yml` 里 `backend_new` 的端口改为 `"8088:8088"` 即可。
