const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.authProvider || this.authProvider === 'email';
    },
    minlength: 6
  },
  authProvider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  profile: {
    displayName: String,
    avatar: String,
    bio: String
  },
  // 学习计划和目标
  learningPlan: {
    dailyWordGoal: {
      type: Number,
      default: 10
    },
    weeklyWordGoal: {
      type: Number,
      default: 50
    },
    monthlyWordGoal: {
      type: Number,
      default: 200
    },
    preferredStudyTime: [String], // e.g., ['morning', 'evening']
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    startDate: {
      type: Date,
      default: Date.now
    }
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blocked: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  achievements: [{
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    count: Number,
    earnedAt: Date,
    title: String,
    description: String
  }],
  rewards: [{
    type: String,
    earnedAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.authProvider === 'google') return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

