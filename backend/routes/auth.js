const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const { verifyIdentityToken } = require("../services/appleAuthService");

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

// Google Sign-In (原生SDK版本)
router.post("/google", async (req, res) => {
  const { userInfo } = req.body; // 原生SDK直接提供用户信息

  if (!userInfo || !userInfo.id || !userInfo.email) {
    return res.status(400).json({ message: "User information not provided" });
  }

  try {
    console.log("🔍 UserInfo from native SDK:", userInfo);

    const { id: googleId, email, name, photo } = userInfo;

    // 在数据库中查找或创建用户
    let user = await User.findOne({ googleId: googleId });

    if (!user) {
      // 如果找不到，尝试用邮箱链接已有账户
      user = await User.findOne({ email: email });
      if (user) {
        // 找到了邮箱匹配的用户，但没有 googleId，说明是老用户
        // 更新他的 googleId 以便下次直接登录
        user.googleId = googleId;
        user.authProvider = "google";
        if (!user.profile.avatar) {
          user.profile.avatar = photo;
        }
        if (name) {
          user.profile.displayName = name;
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
          username: tempUsername,
          authProvider: "google",
          profile: {
            displayName: name || email.split("@")[0],
            avatar: photo,
          },
        });
        await user.save();
      }
    }

    // 为该用户生成 JWT
    const appToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: "7d" }
    );

    // 返回 JWT 和用户信息
    res.status(200).json({
      message: "Google Sign-In successful",
      token: appToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.profile.displayName,
        avatar: user.profile.avatar,
        authProvider: "google",
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({
      error: "Google authentication failed",
      message: error.message,
    });
  }
});

// Facebook Sign-In (原生SDK版本)
router.post("/facebook", async (req, res) => {
  const { userInfo } = req.body; // 原生SDK直接提供用户信息

  if (!userInfo || !userInfo.id || !userInfo.name) {
    return res.status(400).json({ message: "User information not provided" });
  }

  try {
    console.log("🔍 UserInfo from Facebook SDK:", userInfo);

    const { id: facebookId, email, name, photo } = userInfo;

    // 在数据库中查找或创建用户
    let user = await User.findOne({ facebookId: facebookId });

    if (!user) {
      // 如果找不到，尝试用邮箱链接已有账户
      if (email) {
        user = await User.findOne({ email: email });
        if (user) {
          // 找到了邮箱匹配的用户，但没有 facebookId，说明是老用户
          // 更新他的 facebookId 以便下次直接登录
          user.facebookId = facebookId;
          user.authProvider = "facebook";
          if (!user.profile.avatar) {
            user.profile.avatar = photo;
          }
          if (name) {
            user.profile.displayName = name;
          }
          await user.save();
        }
      }

      if (!user) {
        // 完全新的用户，创建新账户
        // 生成一个临时的、唯一的 username
        const tempUsername =
          (name || "user") + Math.floor(100 + Math.random() * 900);

        user = new User({
          facebookId,
          email: email || `${facebookId}@facebook.com`, // Facebook可能不提供邮箱
          username: tempUsername,
          authProvider: "facebook",
          profile: {
            displayName: name || "Facebook User",
            avatar: photo,
          },
        });
        await user.save();
      }
    }

    // 为该用户生成 JWT
    const appToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: "7d" }
    );

    // 返回 JWT 和用户信息
    res.status(200).json({
      message: "Facebook Sign-In successful",
      token: appToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.profile.displayName,
        avatar: user.profile.avatar,
        authProvider: "facebook",
      },
    });
  } catch (error) {
    console.error("Facebook auth error:", error);
    res.status(500).json({
      error: "Facebook authentication failed",
      message: error.message,
    });
  }
});

// Apple Sign-In
router.post("/apple", async (req, res) => {
  const { userInfo } = req.body; // Apple Sign-In 提供用户信息

  if (!userInfo || !userInfo.identityToken) {
    return res.status(400).json({ 
      message: "Identity token is required for Apple Sign-In" 
    });
  }

  try {
    console.log("🔍 UserInfo from Apple Sign-In:", {
      userId: userInfo.userId,
      hasIdentityToken: !!userInfo.identityToken,
      hasEmail: !!userInfo.email,
    });

    // 1. 验证 identityToken（必须步骤）
    let verifiedToken;
    try {
      verifiedToken = await verifyIdentityToken(userInfo.identityToken);
      console.log("✅ Identity token verified:", {
        userId: verifiedToken.userId,
        email: verifiedToken.email,
        emailVerified: verifiedToken.emailVerified,
      });
    } catch (verifyError) {
      console.error("❌ Identity token verification failed:", verifyError.message);
      console.error("❌ Full verify error:", JSON.stringify(verifyError, null, 2));
      console.error("❌ Identity token preview:", userInfo.identityToken?.substring(0, 50) + "...");
      return res.status(401).json({
        error: "Invalid identity token",
        message: verifyError.message,
        details: "请确保使用最新版本的应用，并确保设备已登录 Apple ID",
      });
    }

    // 2. 使用验证后的 token 数据
    const appleId = verifiedToken.userId; // 使用验证后的 sub (user ID)
    const email = verifiedToken.email || userInfo.email || null; // 优先使用 token 中的 email
    const fullName = userInfo.fullName || null; // fullName 不在 token 中，使用客户端提供的

    // 3. 在数据库中查找或创建用户（使用验证后的 appleId）
    let user = await User.findOne({ appleId: appleId });

    if (!user) {
      // 如果找不到，尝试用邮箱链接已有账户
      if (email) {
        user = await User.findOne({ email: email });
        if (user) {
          // 找到了邮箱匹配的用户，但没有 appleId，说明是老用户
          // 更新他的 appleId 以便下次直接登录
          user.appleId = appleId;
          user.authProvider = "apple";
          if (fullName) {
            const displayName =
              fullName.givenName && fullName.familyName
                ? `${fullName.givenName} ${fullName.familyName}`
                : fullName.givenName ||
                  fullName.familyName ||
                  email.split("@")[0];
            if (!user.profile.displayName) {
              user.profile.displayName = displayName;
            }
          }
          await user.save();
        }
      }

      if (!user) {
        // 完全新的用户，创建新账户
        // 生成一个临时的、唯一的 username
        const displayName =
          fullName && fullName.givenName && fullName.familyName
            ? `${fullName.givenName} ${fullName.familyName}`
            : fullName?.givenName || fullName?.familyName || "Apple User";
        const tempUsername =
          (email || appleId).split("@")[0] +
          Math.floor(100 + Math.random() * 900);

        user = new User({
          appleId,
          email: email || `${appleId}@privaterelay.appleid.com`, // Apple 可能使用私有中继邮箱
          username: tempUsername,
          authProvider: "apple",
          profile: {
            displayName: displayName,
          },
        });
        await user.save();
      }
    }

    // 为该用户生成 JWT
    const appToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: "7d" }
    );

    // 返回 JWT 和用户信息
    res.status(200).json({
      message: "Apple Sign-In successful",
      token: appToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.profile.displayName,
        avatar: user.profile.avatar,
        authProvider: "apple",
      },
    });
  } catch (error) {
    console.error("Apple auth error:", error);
    res.status(500).json({
      error: "Apple authentication failed",
      message: error.message,
    });
  }
});

// Change password
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 检查用户是否通过 OAuth 登录（Google/Facebook/Apple）
    const isOAuthUser =
      user.authProvider === "google" ||
      user.authProvider === "facebook" ||
      user.authProvider === "apple";

    // 检查用户是否已经设置过密码
    const hasExistingPassword =
      user.password && user.password.trim().length > 0;

    // 如果是 OAuth 用户且没有设置过密码，允许跳过旧密码验证
    if (isOAuthUser && !hasExistingPassword) {
      // OAuth 用户首次设置密码，不需要验证旧密码
      if (!oldPassword) {
        // 直接设置新密码
        user.password = newPassword;
        await user.save();
        return res.json({
          message: "Password set successfully",
          isFirstTime: true,
        });
      }
      // 如果提供了 oldPassword，但用户没有密码，返回错误
      return res.status(400).json({
        error:
          "No existing password found. You can set a password without providing the old password.",
      });
    }

    // 对于邮箱登录用户或已有密码的 OAuth 用户，必须验证旧密码
    if (!oldPassword) {
      return res.status(400).json({ error: "Current password is required" });
    }

    // Verify old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: "Password changed successfully",
      isFirstTime: false,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Password change failed", message: error.message });
  }
});

module.exports = router;
