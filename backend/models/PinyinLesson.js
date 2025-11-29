const mongoose = require('mongoose');

const pinyinLessonSchema = new mongoose.Schema({
  // 拼音类型：initial（声母）、final（韵母）、tone（声调）
  type: {
    type: String,
    enum: ['initial', 'final', 'tone'],
    required: true
  },
  // 拼音内容（如 "b", "a", "mā"）
  pinyin: {
    type: String,
    required: true,
    trim: true
  },
  // 拼音显示名称（如 "b", "a", "第一声"）
  displayName: {
    type: String,
    required: true
  },
  // 声调（1-4，0表示轻声）
  tone: {
    type: Number,
    enum: [0, 1, 2, 3, 4],
    default: 0
  },
  // 动画口型资源（URL或资源路径）
  mouthAnimation: {
    type: String
  },
  // 发音音频（URL）
  audioUrl: {
    type: String
  },
  // 单字示例（如 ["爸", "妈"]）
  examples: [{
    word: String,        // 汉字
    pinyin: String,     // 完整拼音
    meaning: String     // 英文释义
  }],
  // 常见错误提醒
  commonMistakes: [{
    mistake: String,    // 容易混淆的拼音
    explanation: String // 解释
  }],
  // 难度级别
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  // 排序顺序
  order: {
    type: Number,
    default: 0
  },
  // 是否启用
  enabled: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// 索引
pinyinLessonSchema.index({ type: 1, order: 1 });
pinyinLessonSchema.index({ pinyin: 1, type: 1 });

module.exports = mongoose.model('PinyinLesson', pinyinLessonSchema);

