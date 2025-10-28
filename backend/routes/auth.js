const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Incorrect username or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect username or password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user profile', message: error.message });
  }
});

// Google Sign-In (原生SDK版本)
router.post('/google', async (req, res) => {
  const { userInfo } = req.body; // 原生SDK直接提供用户信息

  if (!userInfo || !userInfo.id || !userInfo.email) {
    return res.status(400).json({ message: 'User information not provided' });
  }

  try {
    console.log('🔍 UserInfo from native SDK:', userInfo);
    
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
        user.authProvider = 'google';
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
        const tempUsername = email.split('@')[0] + Math.floor(100 + Math.random() * 900);
        user = new User({
          googleId,
          email,
          username: tempUsername,
          authProvider: 'google',
          profile: {
            displayName: name || email.split('@')[0],
            avatar: photo,
          },
        });
        await user.save();
      }
    }

    // 为该用户生成 JWT
    const appToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '7d' }
    );

    // 返回 JWT 和用户信息
    res.status(200).json({
      message: 'Google Sign-In successful',
      token: appToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.profile.displayName,
        avatar: user.profile.avatar,
        authProvider: 'google',
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res
      .status(500)
      .json({
        error: 'Google authentication failed',
        message: error.message,
      });
  }
});

// Change password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    // Verify old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Password change failed', message: error.message });
  }
});

module.exports = router;

