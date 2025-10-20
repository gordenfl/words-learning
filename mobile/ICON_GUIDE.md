# 应用图标设置指南

## 📱 需要的图标文件

### **必需的图标（放在 `assets/` 目录）：**

| 文件名 | 尺寸 | 用途 |
|--------|------|------|
| `icon.png` | 1024x1024px | 应用图标（Android & iOS）|
| `adaptive-icon.png` | 1024x1024px | Android 自适应图标 |
| `splash.png` | 1284x2778px | 启动屏幕（可选）|

---

## 🎨 快速创建图标

### **方式 1: 使用在线工具（最简单）**

1. **访问 AppIcon.co**
   - <https://www.appicon.co/>
   - 上传一张图片（最好是 1024x1024px）
   - 自动生成所有尺寸

2. **访问 Icon Kitchen**
   - <https://icon.kitchen/>
   - 专门为 Android 设计
   - 可以添加背景色、形状等

3. **访问 Canva**
   - <https://www.canva.com/>
   - 搜索 "App Icon"
   - 使用模板设计

---

## 🖼️ 使用你现有的图片

### **如果你有一张图片想用作图标：**

```bash
# 方法 1: 使用在线工具调整大小
# 访问 https://www.iloveimg.com/resize-image
# 上传图片，调整为 1024x1024px
# 下载并重命名为 icon.png

# 方法 2: 使用命令行（需要 ImageMagick）
# brew install imagemagick
convert your-image.png -resize 1024x1024 mobile/assets/icon.png
convert your-image.png -resize 1024x1024 mobile/assets/adaptive-icon.png
```

---

## 🎯 快速开始（使用占位图标）

### **临时方案：创建简单的纯色图标**

我可以帮你创建一个简单的蓝色图标（和你的 App 主题色匹配）：

```bash
cd mobile/assets

# 下载 Expo 默认图标（或使用任何图片）
# 将你的图片复制到这里并重命名为：
# - icon.png
# - adaptive-icon.png
```

---

## 📋 完整步骤

### **步骤 1: 准备图标文件**

```bash
cd /Users/yiliu/Documents/GitHub/words-learning/mobile/assets

# 将你的图标文件放到这里：
# icon.png (1024x1024px)
# adaptive-icon.png (1024x1024px) 
```

### **步骤 2: 验证图标**

```bash
# 检查文件是否存在
ls -lh assets/

# 应该看到：
# icon.png
# adaptive-icon.png
```

### **步骤 3: 更新 app.json**

文件已经配置好了！

---

## 🚀 如果暂时没有图标

**可以先不设置图标，EAS 会使用默认图标！**

直接构建 APK：

```bash
cd /Users/yiliu/Documents/GitHub/words-learning/mobile

# 直接构建（会使用 Expo 默认图标）
npx eas-cli build -p android --profile preview
```

---

## 🎨 推荐的图标设计

### **为 Words Learning App 设计：**

**主题建议**：

- 📖 一本打开的书
- 🔤 字母或汉字
- 🧠 大脑 + 文字
- 🎓 学习相关图标
- 🌐 语言/翻译图标

**颜色**：

- 主色：`#4A90E2`（蓝色，和 App 主题一致）
- 辅色：白色或深蓝色

---

## 💡 临时解决方案

### **使用文字图标：**

1. 访问 <https://www.favicon.cc/> 或类似网站
2. 创建一个简单的文字图标（比如 "W" 或 "学"）
3. 下载为 PNG
4. 调整大小为 1024x1024px
5. 保存到 `mobile/assets/icon.png`

---

## ✅ 现在你可以

### **选项 1: 先不管图标，直接打包**

```bash
cd /Users/yiliu/Documents/GitHub/words-learning/mobile
npx eas-cli build -p android --profile preview
```

会使用 Expo 默认图标（白底蓝字）

### **选项 2: 准备好图标后打包**

1. 准备 `icon.png` (1024x1024px)
2. 准备 `adaptive-icon.png` (1024x1024px)
3. 放到 `mobile/assets/` 目录
4. 运行 `npx eas-cli build -p android --profile preview`

---

你想：

1. **先用默认图标打包** - 我帮你执行
2. **等你准备好图标** - 告诉我图标准备好了

选哪个？🎨
