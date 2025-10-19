const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  word: {
    type: String,
    required: true,
    trim: true
  },
  // 拼音 (for Chinese words)
  pinyin: {
    type: String
  },
  // 英文翻译
  translation: {
    type: String
  },
  definition: {
    type: String
  },
  examples: [{
    type: String
  }],
  // 难度级别
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  status: {
    type: String,
    enum: ['unknown', 'known'],
    default: 'unknown'
  },
  sourceImage: {
    type: String // URL to the image in S3
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  learnedAt: {
    type: Date
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  lastReviewedAt: {
    type: Date
  },
  nextReviewAt: {
    type: Date
  }
}, { timestamps: true });

// Compound index for userId and word
wordSchema.index({ userId: 1, word: 1 }, { unique: true });

module.exports = mongoose.model('Word', wordSchema);

