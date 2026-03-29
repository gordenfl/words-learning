# 贡献指南 / Contributing Guide

感谢你对 Words Learning 项目的关注！我们欢迎各种形式的贡献。

## 如何贡献

### 报告Bug

如果你发现了bug，请创建一个Issue并包含以下信息：

- Bug的详细描述
- 复现步骤
- 期望的行为
- 实际的行为
- 截图（如果适用）
- 环境信息（操作系统、Node版本等）

### 提出新功能

如果你有新功能的想法：

1. 先在Issues中搜索，看是否已有类似建议
2. 创建新Issue，描述功能的需求和用例
3. 等待维护者的反馈

### 提交代码

1. **Fork 项目**
```bash
# 在GitHub上Fork项目，然后克隆到本地
git clone https://github.com/YOUR_USERNAME/words-learning.git
cd words-learning
```

2. **创建分支**
```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

3. **进行开发**
- 遵循现有的代码风格
- 添加必要的注释
- 确保代码可以正常运行

4. **测试你的更改**
```bash
# 后端测试
cd backend
npm start
# 在另一个终端运行测试脚本
./test-api.sh

# 移动应用测试
cd mobile__old
npm start
```

5. **提交更改**
```bash
git add .
git commit -m "feat: add new feature description"
# 或
git commit -m "fix: fix bug description"
```

提交信息规范：
- `feat:` 新功能
- `fix:` Bug修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 添加测试
- `chore:` 构建/工具链更新

6. **推送到你的Fork**
```bash
git push origin feature/your-feature-name
```

7. **创建Pull Request**
- 在GitHub上创建PR
- 详细描述你的更改
- 链接相关的Issue
- 等待代码审查

## 开发规范

### 代码风格

**JavaScript/React Native:**
- 使用2空格缩进
- 使用单引号
- 添加分号
- 使用ES6+语法
- 组件使用函数式写法

**文件命名:**
- 组件文件：`PascalCase.js` (例如：`LoginScreen.js`)
- 工具函数：`camelCase.js` (例如：`api.js`)
- 常量：`UPPER_SNAKE_CASE.js`

### 目录结构

新增文件时请遵循现有的目录结构：

```
backend/
├── models/      # 数据模型
├── routes/      # API路由
├── middleware/  # 中间件
└── services/    # 业务逻辑

mobile/
└── src/
    ├── screens/    # 页面组件
    ├── components/ # 可复用组件
    ├── services/   # API服务
    ├── utils/      # 工具函数
    └── constants/  # 常量定义
```

### API设计原则

- 使用RESTful风格
- 返回适当的HTTP状态码
- 错误信息要清晰明了
- 添加适当的验证
- 文档化所有端点

### 数据库

- 使用Mongoose Schema定义模型
- 添加适当的索引
- 使用虚拟字段处理计算属性
- 添加pre/post钩子处理业务逻辑

## 需要帮助的领域

我们特别欢迎以下方面的贡献：

### 高优先级
- [ ] Google Cloud Vision API集成
- [ ] AI文章生成集成（OpenAI/Claude）
- [ ] 单词发音功能
- [ ] 间隔重复学习算法
- [ ] 单元测试

### 中优先级
- [ ] AWS S3图片存储
- [ ] 推送通知
- [ ] 社交功能（关注、分享）
- [ ] 成就系统完善
- [ ] 数据导入/导出

### UI/UX改进
- [ ] 深色模式
- [ ] 动画效果
- [ ] 加载状态优化
- [ ] 错误提示优化
- [ ] 无障碍功能

### 文档
- [ ] API文档完善
- [ ] 用户指南
- [ ] 视频教程
- [ ] 多语言支持

## 测试

### 后端测试
```bash
# 使用测试脚本
./test-api.sh

# 或手动测试
curl http://localhost:3000/api/health
```

### 移动应用测试
- 在iOS模拟器上测试
- 在Android模拟器上测试
- 在物理设备上测试
- 测试不同屏幕尺寸
- 测试网络错误情况

## 代码审查

所有PR都需要经过代码审查。审查重点：

- 代码质量和可读性
- 是否遵循项目规范
- 功能是否完整
- 是否有潜在bug
- 性能影响
- 安全问题

## 版本发布

项目使用语义化版本：

- **主版本号(Major)**: 不兼容的API修改
- **次版本号(Minor)**: 向下兼容的功能性新增
- **修订号(Patch)**: 向下兼容的问题修正

## 社区

- 提问前先搜索Issues
- 保持友好和专业
- 尊重所有贡献者
- 遵守行为准则

## 许可证

提交代码即表示你同意将代码以MIT许可证开源。

## 联系方式

如有问题，可以通过以下方式联系：

- 创建Issue
- 在PR中讨论
- 发送邮件（如果有公开邮箱）

---

再次感谢你的贡献！🎉

