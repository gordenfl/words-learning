const mongoose = require('mongoose');

const pinyinProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PinyinLesson',
    required: true
  },
  // 学习状态：not_started, learning, completed
  status: {
    type: String,
    enum: ['not_started', 'learning', 'completed'],
    default: 'not_started'
  },
  // 练习完成情况
  practices: {
    toneSlider: {
      completed: { type: Boolean, default: false },
      bestScore: { type: Number, default: 0 }, // 0-100
      attempts: { type: Number, default: 0 }
    },
    pronunciation: {
      completed: { type: Boolean, default: false },
      bestScore: { type: Number, default: 0 }, // 0-100
      attempts: { type: Number, default: 0 }
    },
    spelling: {
      completed: { type: Boolean, default: false },
      bestScore: { type: Number, default: 0 }, // 0-100
      attempts: { type: Number, default: 0 }
    }
  },
  // 首次学习时间
  startedAt: {
    type: Date
  },
  // 完成时间
  completedAt: {
    type: Date
  },
  // 最后练习时间
  lastPracticedAt: {
    type: Date
  },
  // 复习次数
  reviewCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// 复合索引
pinyinProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
pinyinProgressSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('PinyinProgress', pinyinProgressSchema);

