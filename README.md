# Words Learning App

A comprehensive vocabulary learning application with image recognition, article generation, and progress tracking.

## 项目介绍

这是一个智能单词学习应用，帮助用户通过拍照识别、文章阅读等方式学习新单词。

### 主要功能

- 📸 **拍照识别**: 从书籍照片中提取单词
- 📝 **智能文章**: 根据待学单词自动生成学习文章
- 📊 **进度跟踪**: 统计学习进度和成就
- 👥 **社交功能**: 关注好友，分享学习成果
- 🏆 **成就系统**: 激励持续学习

## 技术栈

### 后端
- Node.js + Express
- MongoDB (数据库)
- JWT (身份认证)
- BCrypt (密码加密)

### 移动端
- React Native + Expo
- React Navigation
- Axios (API调用)
- AsyncStorage (本地存储)

### 部署
- Docker + Docker Compose
- MongoDB容器化部署

## 项目结构

```
words-learning/
├── backend/                  # 后端服务
│   ├── models/              # 数据库模型
│   │   ├── User.js         # 用户模型
│   │   ├── Word.js         # 单词模型
│   │   └── Article.js      # 文章模型
│   ├── routes/              # API路由
│   │   ├── auth.js         # 认证路由
│   │   ├── words.js        # 单词管理
│   │   ├── users.js        # 用户管理
│   │   └── articles.js     # 文章管理
│   ├── middleware/          # 中间件
│   │   └── auth.js         # 认证中间件
│   ├── server.js           # 服务器入口
│   ├── package.json
│   └── Dockerfile
├── mobile/                   # React Native移动应用
│   ├── src/
│   │   ├── screens/        # 应用页面
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   ├── HomeScreen.js
│   │   │   ├── WordsListScreen.js
│   │   │   ├── AddWordScreen.js
│   │   │   ├── CameraScreen.js
│   │   │   ├── ArticleScreen.js
│   │   │   └── ProfileScreen.js
│   │   └── services/       # API服务
│   │       └── api.js
│   ├── App.js
│   ├── app.json
│   └── package.json
├── docker-compose.yml        # Docker编排配置
├── package.json             # 根package.json
└── README.md

```

## 快速开始

### 方法1: 使用Docker (推荐)

1. **安装依赖**
```bash
# 确保已安装 Docker 和 Docker Compose
docker --version
docker-compose --version
```

2. **启动服务**
```bash
# 启动后端和数据库
docker-compose up -d

# 查看日志
docker-compose logs -f backend
```

3. **访问API**
- 后端API: http://localhost:3000
- 健康检查: http://localhost:3000/api/health

### 方法2: 本地开发

#### 后端设置

1. **安装MongoDB**
```bash
# macOS
brew tap mongodb/brew
brew install mongodb-community

# 启动MongoDB
brew services start mongodb-community
```

2. **安装后端依赖**
```bash
cd backend
npm install
```

3. **配置环境变量**
创建 `backend/.env` 文件:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/words-learning
JWT_SECRET=your_secret_key_here
```

4. **启动后端服务**
```bash
npm start
# 或使用开发模式
npm run dev
```

#### 移动应用设置

1. **安装Expo CLI**
```bash
npm install -g expo-cli
```

2. **安装依赖**
```bash
cd mobile
npm install
```

3. **启动应用**
```bash
npm start
```

4. **运行应用**
- 扫描二维码在手机上使用Expo Go运行
- 按 `i` 在iOS模拟器运行
- 按 `a` 在Android模拟器运行

## API文档

### 认证接口

#### 注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### 单词接口

#### 获取单词列表
```http
GET /api/words?status=unknown
Authorization: Bearer <token>
```

#### 添加单词
```http
POST /api/words
Authorization: Bearer <token>
Content-Type: application/json

{
  "word": "challenge",
  "definition": "A task that tests someone's abilities",
  "examples": ["This is a real challenge"]
}
```

#### 批量添加单词
```http
POST /api/words/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "words": ["challenge", "opportunity", "innovation"]
}
```

#### 更新单词状态
```http
PATCH /api/words/:wordId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "known"
}
```

### 文章接口

#### 生成学习文章
```http
POST /api/articles/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "wordCount": 10
}
```

#### 标记文章已读
```http
PATCH /api/articles/:articleId/read
Authorization: Bearer <token>
```

## 功能实现状态

### ✅ 已完成
- [x] 用户注册和登录
- [x] JWT认证
- [x] 单词添加（手动和批量）
- [x] 单词状态管理（未知/学习中/已掌握）
- [x] 学习统计
- [x] 文章生成
- [x] 用户个人资料管理
- [x] Docker部署配置
- [x] React Native移动应用基础架构

### 🚧 待实现
- [ ] 集成Google Cloud Vision API进行图片文字识别
- [ ] 集成AI API生成更高质量的学习文章
- [ ] AWS S3图片存储
- [ ] 间隔重复学习提醒系统
- [ ] 成就和奖励系统完善
- [ ] 社交功能（关注、分享）
- [ ] 单词定义自动获取（字典API）
- [ ] 发音功能

## 开发计划

详见 [Requirements/BaseRequirement.md](Requirements/BaseRequirement.md)

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请创建Issue。
