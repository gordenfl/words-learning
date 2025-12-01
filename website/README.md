# 中文词汇学习应用 - 产品介绍网站

这是中文词汇学习应用的产品介绍网站，展示应用的核心功能、特色亮点和技术架构。

## 文件结构

```
website/
├── index.html      # 主页面
├── styles.css      # 样式文件
├── script.js       # 交互脚本
└── README.md       # 说明文档
```

## 功能说明

### 核心功能

1. **智能词汇管理**
   - 添加和管理中文词汇
   - 三种学习状态：未知、学习中、已掌握
   - AI自动生成组词和例句

2. **AI智能生成**
   - 基于OpenAI和DeepSeek AI
   - 自动生成相关组词和实用例句
   - 实时生成，确保内容准确性

3. **拍照识别**
   - OCR技术识别中文文字
   - 自动过滤已学词汇
   - 快速添加新词

4. **智能文章生成**
   - 根据学习进度生成阅读文章
   - 在真实语境中学习
   - 提高理解和记忆效果

5. **拼音学习系统**
   - 系统化拼音课程
   - 声母、韵母、声调学习
   - 多种练习方式

6. **写字练习**
   - 手写练习功能
   - 组词和造句练习
   - 巩固词汇运用能力

7. **学习进度跟踪**
   - 实时统计学习数据
   - 可视化学习计划
   - 科学安排复习时间

8. **个性化主题**
   - 多种主题切换
   - 儿童友好主题
   - 流畅动画效果

## 部署方式

### 方式一：静态文件服务器

1. 将 `website` 目录上传到服务器
2. 配置 Web 服务器（如 Nginx、Apache）指向该目录
3. 访问网站

### 方式二：GitHub Pages

1. 在 GitHub 仓库中创建 `gh-pages` 分支
2. 将网站文件推送到该分支
3. 在仓库设置中启用 GitHub Pages
4. 选择 `gh-pages` 分支作为源

### 方式三：Netlify / Vercel

1. 将网站文件推送到 Git 仓库
2. 在 Netlify 或 Vercel 中导入项目
3. 配置构建命令（通常不需要）
4. 部署完成

### 方式四：本地预览

使用 Python 内置服务器：

```bash
cd website
python3 -m http.server 8000
```

然后访问 `http://localhost:8000`

## 自定义配置

### 修改颜色主题

在 `styles.css` 中修改 CSS 变量：

```css
:root {
    --primary-color: #2196F3;
    --primary-dark: #1976D2;
    --secondary-color: #FF9800;
    /* ... */
}
```

### 添加下载链接

在 `index.html` 的下载部分，更新按钮链接：

```html
<a href="https://apps.apple.com/..." class="btn btn-app-store">
    <span>App Store</span>
</a>
```

### 修改内容

直接编辑 `index.html` 文件中的文本内容即可。

## 浏览器支持

- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)
- 移动端浏览器

## 技术特点

- 响应式设计，支持各种屏幕尺寸
- 平滑滚动和动画效果
- 现代 CSS（Flexbox、Grid）
- 无依赖的纯 JavaScript
- 优化的性能和加载速度

## 许可证

与主项目保持一致。
