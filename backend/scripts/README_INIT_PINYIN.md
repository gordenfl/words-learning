# 初始化拼音课程数据

## 使用方法

在服务器上运行以下命令来初始化23个声母课程：

```bash
cd /home/ec2-user/CI/words-learning/backend
node scripts/initPinyinLessons.js
```

或者使用 npm script（如果已添加）：

```bash
npm run init-pinyin
```

## 数据内容

脚本会创建23个声母课程，包括：

- **b, p, m, f** - 双唇音
- **d, t, n, l** - 舌尖音
- **g, k, h** - 舌根音
- **j, q, x** - 舌面音
- **zh, ch, sh, r** - 舌尖后音（卷舌音）
- **z, c, s** - 舌尖前音（平舌音）
- **y, w** - 半元音

每个声母包含：
- 拼音和显示名称
- 3个单字示例（汉字、拼音、英文释义）
- 常见错误提醒（如 z 和 zh 的区别）

## 注意事项

- 脚本会先删除所有现有的声母课程（type: 'initial'），然后重新插入
- 确保 MongoDB 连接正常
- 确保环境变量 `MONGODB_URI` 已正确设置


