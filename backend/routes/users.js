const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user', message: error.message });
  }
});

// Update user profile
router.patch('/profile', async (req, res) => {
  try {
    const { displayName, avatar, bio } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (displayName) user.profile.displayName = displayName;
    if (avatar) user.profile.avatar = avatar;
    if (bio !== undefined) user.profile.bio = bio;

    await user.save();
    
    const updatedUser = await User.findById(req.userId).select('-password');
    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile', message: error.message });
  }
});

// Follow a user
router.post('/:userId/follow', async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    
    if (targetUserId === req.userId.toString()) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const user = await User.findById(req.userId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    if (user.following.includes(targetUserId)) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    user.following.push(targetUserId);
    targetUser.followers.push(req.userId);

    await user.save();
    await targetUser.save();

    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to follow user', message: error.message });
  }
});

// Unfollow a user
router.delete('/:userId/follow', async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    const user = await User.findById(req.userId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.following = user.following.filter(id => id.toString() !== targetUserId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== req.userId.toString());

    await user.save();
    await targetUser.save();

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unfollow user', message: error.message });
  }
});

// Search users
router.get('/search/query', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { 'profile.displayName': { $regex: q, $options: 'i' } }
      ]
    })
    .select('-password')
    .limit(20);

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

// Delete account
router.delete('/account', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account', message: error.message });
  }
});

// Get learning plan
router.get('/learning-plan', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('learningPlan');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      learningPlan: user.learningPlan || {
        dailyWordGoal: 10,
        weeklyWordGoal: 50,
        monthlyWordGoal: 200,
        difficulty: 'intermediate',
        preferredStudyTime: []
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get learning plan', message: error.message });
  }
});

// Update learning plan
router.patch('/learning-plan', async (req, res) => {
  try {
    const { 
      dailyWordGoal, 
      weeklyWordGoal, 
      monthlyWordGoal,
      difficulty,
      preferredStudyTime 
    } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (dailyWordGoal !== undefined) user.learningPlan.dailyWordGoal = dailyWordGoal;
    if (weeklyWordGoal !== undefined) user.learningPlan.weeklyWordGoal = weeklyWordGoal;
    if (monthlyWordGoal !== undefined) user.learningPlan.monthlyWordGoal = monthlyWordGoal;
    if (difficulty !== undefined) user.learningPlan.difficulty = difficulty;
    if (preferredStudyTime !== undefined) user.learningPlan.preferredStudyTime = preferredStudyTime;

    await user.save();

    res.json({ 
      message: 'Learning plan updated successfully',
      learningPlan: user.learningPlan
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update learning plan', message: error.message });
  }
});

module.exports = router;

