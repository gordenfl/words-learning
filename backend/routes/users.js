const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// ==================== 具体路由必须在参数路由之前 ====================

// Search users (must be before /:userId)
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

// Get learning plan (must be before /:userId)
router.get('/learning-plan', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 确保learningPlan存在，如果不存在则初始化
    if (!user.learningPlan) {
      user.learningPlan = {
        dailyWordGoal: 10,
        weeklyWordGoal: 50,
        monthlyWordGoal: 200,
        difficulty: 'intermediate',
        preferredStudyTime: [],
        startDate: new Date()
      };
      await user.save();
    }

    res.json({ 
      learningPlan: user.learningPlan
    });
  } catch (error) {
    console.error('❌ Error in GET /learning-plan:', error);
    res.status(500).json({ error: 'Failed to get learning plan', message: error.message });
  }
});

// Update learning plan (must be before /:userId)
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

    // 确保learningPlan存在
    if (!user.learningPlan) {
      user.learningPlan = {
        dailyWordGoal: 10,
        weeklyWordGoal: 50,
        monthlyWordGoal: 200,
        difficulty: 'intermediate',
        preferredStudyTime: [],
        startDate: new Date()
      };
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
    console.error('Error in PATCH /learning-plan:', error);
    res.status(500).json({ error: 'Failed to update learning plan', message: error.message });
  }
});

// Delete account (must be before /:userId)
router.delete('/account', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account', message: error.message });
  }
});

// ==================== 参数路由放在最后 ====================

// Get user profile (with :userId parameter)
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

module.exports = router;

