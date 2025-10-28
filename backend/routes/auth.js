const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const { OAuth2Client } = require("google-auth-library");

// 初始化 Google Auth Client
// 请确保您的项目根目录有一个 .env 文件，其中包含 GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  "123044373895-bf1p23r83kdcabs4frpvtq9o38k2uo9m.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Registration failed", message: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Incorrect username or password" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect username or password" });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed", message: error.message });
  }
});

// Google Sign-In
router.post("/google", async (req, res) => {
  const { idToken, userInfo } = req.body; // 从前端获取 idToken 和 userInfo

  if (!idToken) {
    return res.status(400).json({ message: "ID Token not provided" });
  }

  try {
    // 1. 使用 Google 库验证 token
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // 2. 验证userInfo一致性（如果提供）
    if (userInfo) {
      console.log("🔍 UserInfo from frontend:", userInfo);
      console.log("🔍 Payload from Google:", {
        googleId,
        email,
        name,
        picture,
      });

      // 验证邮箱一致性
      if (userInfo.email && userInfo.email !== email) {
        console.warn("⚠️ Email mismatch:", userInfo.email, "vs", email);
      }
    }

    // 3. 在数据库中查找或创建用户
    let user = await User.findOne({ googleId: googleId });

    if (!user) {
      // 如果找不到，尝试用邮箱链接已有账户
      user = await User.findOne({ email: email });
      if (user) {
        // 找到了邮箱匹配的用户，但没有 googleId，说明是老用户
        // 更新他的 googleId 以便下次直接登录
        user.googleId = googleId;
        if (!user.profile.avatar) {
          user.profile.avatar = picture;
        }
        await user.save();
      } else {
        // 完全新的用户，创建新账户
        // 生成一个临时的、唯一的 username
        const tempUsername =
          email.split("@")[0] + Math.floor(100 + Math.random() * 900);
        user = new User({
          googleId,
          email,
          username: tempUsername, // 使用派生的唯一用户名
          // 注意：对于 Google 登录的用户，我们不设置密码
          profile: {
            displayName: name,
            avatar: picture,
          },
        });
        await user.save();
      }
    }

    // 4. 为该用户生成您自己的 JWT
    const appToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: "7d" }
    );

    // 5. 将您的 JWT 和用户信息返回给前端
    res.status(200).json({
      message: "Google Sign-In successful",
      token: appToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.profile.displayName,
        avatar: user.profile.avatar,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(401).json({
      error: "Google authentication failed",
      message: "Invalid token",
    });
  }
});

// Get current user profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json({ user });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to get user profile", message: error.message });
  }
});

// Change password
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    // Verify old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Password change failed", message: error.message });
  }
});

module.exports = router;
