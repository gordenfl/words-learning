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
    trim: true,
    lowercase: true
  },
  definition: {
    type: String
  },
  examples: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['unknown', 'learning', 'known'],
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

