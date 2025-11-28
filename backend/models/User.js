const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.authProvider || this.authProvider === "email";
      },
      minlength: 6,
    },
    authProvider: {
      type: String,
      enum: ["email", "google", "facebook", "apple"],
      default: "email",
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    facebookId: {
      type: String,
      sparse: true,
      unique: true,
    },
    appleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    profile: {
      displayName: String,
      avatar: String,
      bio: String,
    },
    // 用户主题偏好
    theme: {
      type: String,
      enum: ['pink', 'green', 'blue'],
      default: 'blue', // 默认天蓝色
    },
    // 学习计划和目标
    learningPlan: {
      dailyWordGoal: {
        type: Number,
        default: 10,
      },
      weeklyWordGoal: {
        type: Number,
        default: 50,
      },
      monthlyWordGoal: {
        type: Number,
        default: 200,
      },
      preferredStudyTime: [String], // e.g., ['morning', 'evening']
      difficulty: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "intermediate",
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    blocked: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    achievements: [
      {
        type: {
          type: String,
          enum: ["daily", "weekly", "monthly", "yearly"],
        },
        count: Number,
        earnedAt: Date,
        title: String,
        description: String,
      },
    ],
    rewards: [
      {
        type: String,
        earnedAt: Date,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  // 只有在密码被修改时才进行哈希
  // 注意：OAuth 用户设置密码时也需要哈希，所以不能跳过
  if (!this.isModified("password")) {
    return next();
  }

  // 如果密码为空或未定义，跳过哈希（允许 OAuth 用户没有密码）
  if (!this.password || this.password.trim().length === 0) {
    return next();
  }

  // 如果密码已经是哈希格式（以 $2a$, $2b$, $2y$ 开头），说明已经被哈希过，跳过
  // 这可以防止重复哈希
  if (this.password.startsWith("$2a$") || 
      this.password.startsWith("$2b$") || 
      this.password.startsWith("$2y$")) {
    return next();
  }

  try {
    // 对所有新设置的密码进行哈希（包括 OAuth 用户首次设置密码）
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  // 如果用户没有设置密码（OAuth 用户可能没有密码），返回 false
  if (!this.password || this.password.trim().length === 0) {
    return false;
  }
  
  // 如果候选密码为空，返回 false
  if (!candidatePassword || candidatePassword.trim().length === 0) {
    return false;
  }
  
  // 使用 bcrypt 比较密码
  // bcrypt.compare() 会自动处理哈希格式的密码
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
