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
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
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

