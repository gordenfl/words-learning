# 🚀 快速开始指南

## 🎯 项目已创建完成！

恭喜！你的单词学习应用初始版本已经创建完成。以下是如何启动和使用这个应用。

## 📋 创建的文件清单

### 后端文件 (Backend)
```
backend/
├── models/
│   ├── User.js          ✅ 用户数据模型
│   ├── Word.js          ✅ 单词数据模型
│   └── Article.js       ✅ 文章数据模型
├── routes/
│   ├── auth.js          ✅ 认证API路由
│   ├── words.js         ✅ 单词管理API
│   ├── users.js         ✅ 用户管理API
│   └── articles.js      ✅ 文章管理API
├── middleware/
│   └── auth.js          ✅ JWT认证中间件
├── server.js            ✅ 服务器入口文件
├── package.json         ✅ 依赖配置
└── Dockerfile           ✅ Docker镜像配置
```

### 移动应用文件 (Mobile)
```
mobile/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js       ✅ 登录页面
│   │   ├── RegisterScreen.js    ✅ 注册页面
│   │   ├── HomeScreen.js        ✅ 主页
│   │   ├── WordsListScreen.js   ✅ 单词列表
│   │   ├── AddWordScreen.js     ✅ 添加单词
│   │   ├── CameraScreen.js      ✅ 拍照识别
│   │   ├── ArticleScreen.js     ✅ 文章阅读
│   │   └── ProfileScreen.js     ✅ 个人中心
│   └── services/
│       └── api.js               ✅ API服务封装
├── App.js                       ✅ 应用入口
├── app.json                     ✅ Expo配置
└── package.json                 ✅ 依赖配置
```

### 配置和文档
```
根目录/
├── docker-compose.yml       ✅ Docker编排配置
├── package.json            ✅ 项目根配置
├── .gitignore              ✅ Git忽略文件
├── start.sh                ✅ 快速启动脚本
├── test-api.sh             ✅ API测试脚本
├── postman_collection.json ✅ Postman测试集合
├── README.md               ✅ 项目说明文档
├── SETUP_GUIDE.md          ✅ 详细设置指南
├── CONTRIBUTING.md         ✅ 贡献指南
├── PROJECT_SUMMARY.md      ✅ 项目总览
├── QUICK_START.md          ✅ 本文件
└── LICENSE                 ✅ MIT许可证
```

## ⚡ 三步启动应用

### 方式1: 使用Docker (最简单) 🐳

```bash
# 1. 启动所有服务（后端 + 数据库）
docker-compose up -d

# 2. 查看日志确认启动成功
docker-compose logs -f backend

# 3. 测试API
./test-api.sh
```

就这么简单！后端已经运行在 http://localhost:3000

### 方式2: 本地开发 💻

**前提条件:**
- Node.js 16+ 已安装
- MongoDB 已安装并运行

```bash
# 1. 安装后端依赖并启动
cd backend
npm install
npm start

# 2. 在新终端中，安装并启动移动应用
cd mobile
npm install
npm start
```

## 📱 运行移动应用

### 准备工作
```bash
# 1. 安装Expo CLI（如果还没安装）
npm install -g expo-cli

# 2. 进入mobile目录
cd mobile

# 3. 安装依赖
npm install

# 4. 启动开发服务器
npm start
```

### 在设备上运行

**选项A: iOS模拟器 (仅macOS)**
```bash
# 按 'i' 键，或
npm run ios
```

**选项B: Android模拟器**
```bash
# 按 'a' 键，或
npm run android
```

**选项C: 物理设备**
1. 下载 Expo Go App (iOS/Android)
2. 扫描终端中显示的二维码

## 🧪 测试应用

### 1. 测试后端API

```bash
# 运行自动化测试脚本
./test-api.sh
```

这个脚本会：
- ✅ 检查健康状态
- ✅ 注册测试用户
- ✅ 登录测试
- ✅ 添加单词
- ✅ 获取统计数据
- ✅ 生成文章

### 2. 手动测试

```bash
# 检查健康状态
curl http://localhost:3000/api/health

# 注册用户
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"123456"}'
```

### 3. 使用Postman测试

1. 导入 `postman_collection.json` 到Postman
2. 运行整个集合或单个请求
3. Token会自动保存和使用

## 📊 验证安装

### 后端检查清单
- [ ] MongoDB正在运行
- [ ] 后端服务启动成功 (端口3000)
- [ ] 健康检查返回 OK
- [ ] 可以注册新用户
- [ ] 可以登录并获取Token

### 移动应用检查清单
- [ ] Expo开发服务器启动
- [ ] 可以在模拟器/设备上看到登录页面
- [ ] 可以注册新用户
- [ ] 可以登录并看到主页
- [ ] 统计数据正常显示

## 🎮 试用核心功能

### 1. 用户注册和登录
```
1. 打开移动应用
2. 点击 "Sign up"
3. 填写用户名、邮箱、密码
4. 注册成功后自动登录
```

### 2. 添加单词
```
方式A: 手动添加
1. 点击主页的 "➕ Add Word"
2. 输入单词和定义
3. 保存

方式B: 模拟拍照
1. 点击主页的 "📸 Scan Book"
2. 选择 "Take Photo" 或 "Choose from Gallery"
3. 应用会模拟提取单词（演示功能）
4. 批量添加到列表
```

### 3. 查看和管理单词
```
1. 点击 "📚 My Words"
2. 使用顶部过滤器筛选状态
3. 点击单词卡片上的按钮更改状态
   - "✓ Known" - 标记为已掌握
   - "📖 Learning" - 标记为学习中
```

### 4. 生成学习文章
```
1. 先添加至少5个单词
2. 返回主页
3. 点击 "📝 Generate Article"
4. 系统会生成包含你的单词的文章
5. 阅读文章并标记单词为已知
```

### 5. 查看学习统计
```
主页顶部显示:
- 总单词数
- 已掌握数量
- 待学习数量
- 今日学习数
```

## 🔍 故障排除

### 问题1: 后端启动失败

**错误**: MongoDB connection error

**解决**:
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# 或使用Docker
docker-compose up -d
```

### 问题2: 移动应用无法连接API

**错误**: Network request failed

**解决**:
```javascript
// 编辑 mobile/src/services/api.js
// Android模拟器使用:
const API_BASE_URL = 'http://10.0.2.2:3000/api';

// iOS模拟器或物理设备使用你的电脑IP:
const API_BASE_URL = 'http://192.168.1.xxx:3000/api';
```

### 问题3: Docker启动失败

**错误**: Port 3000 already in use

**解决**:
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀掉进程或更改端口
# 修改 docker-compose.yml 中的端口映射
```

### 更多问题？

查看详细的故障排除指南:
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - 环境设置和常见问题
- [README.md](README.md) - 完整的项目文档

## 📚 下一步学习

### 了解项目
1. 阅读 [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - 项目总览
2. 阅读 [README.md](README.md) - 详细文档
3. 查看 [Requirements/BaseRequirement.md](Requirements/BaseRequirement.md) - 完整需求

### 开始开发
1. 阅读 [CONTRIBUTING.md](CONTRIBUTING.md) - 贡献指南
2. 选择一个待实现功能开始开发
3. 提交你的第一个Pull Request

### 推荐的第一个任务

以下任务适合作为第一个开发任务:

1. **简单**: 添加更多单词例句到文章生成器
2. **中等**: 实现深色模式
3. **困难**: 集成真实的字典API获取单词定义

## 🎯 核心功能演示流程

想要完整体验应用？按以下顺序操作:

```
1. 注册账户 → 
2. 添加10-20个单词 →
3. 查看统计数据 →
4. 生成学习文章 →
5. 阅读文章并标记单词 →
6. 查看进度变化 →
7. 编辑个人资料
```

## 📞 获取帮助

遇到问题？

1. **文档**: 查看相关.md文档
2. **Issues**: 搜索或创建GitHub Issue
3. **测试**: 运行 `./test-api.sh` 诊断问题

## 🎉 恭喜！

你现在已经有了一个完整可运行的单词学习应用原型！

**接下来可以:**
- 🚀 部署到服务器
- 🎨 改进UI/UX
- 🔧 添加新功能
- 📱 发布到应用商店
- 👥 邀请朋友测试

祝你开发愉快！💪

---

**需要更多帮助？**
- 阅读 [SETUP_GUIDE.md](SETUP_GUIDE.md)
- 阅读 [README.md](README.md)
- 创建 GitHub Issue

