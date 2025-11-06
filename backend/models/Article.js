const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  englishContent: {
    type: String,
    default: ''
  },
  targetWords: [{
    word: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Word'
    },
    wordText: String
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  readAt: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);

