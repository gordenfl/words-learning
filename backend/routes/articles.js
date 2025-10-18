const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const Word = require('../models/Word');
const authMiddleware = require('../middleware/auth');
const { generateChineseStory } = require('../services/aiService');

// All routes require authentication
router.use(authMiddleware);

// Get all articles for user
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate('targetWords.word');
    
    res.json({ articles, count: articles.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch articles', message: error.message });
  }
});

// Generate a new article with unknown words
router.post('/generate', async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Get user's learning plan
    const user = await User.findById(req.userId);
    const difficulty = user?.learningPlan?.difficulty || 'intermediate';
    const dailyGoal = user?.learningPlan?.dailyWordGoal || 10;
    
    const { wordCount = dailyGoal } = req.body;

    // Get unknown words matching difficulty (or all unknown if not enough)
    let unknownWords = await Word.find({ 
      userId: req.userId, 
      status: 'unknown',
      difficulty: difficulty
    }).limit(wordCount);

    // If not enough words at this difficulty, get any unknown words
    if (unknownWords.length < 3) {
      unknownWords = await Word.find({ 
        userId: req.userId, 
        status: 'unknown' 
      }).limit(wordCount);
    }

    if (unknownWords.length === 0) {
      return res.status(200).json({ 
        message: 'Great job! You\'ve learned all your words! 🎉',
        suggestion: 'Add some new Chinese words to continue your learning journey.',
        needMoreWords: true
      });
    }

    // Generate article based on difficulty using AI service
    const wordTexts = unknownWords.map(w => w.word);
    const content = await generateChineseStory(wordTexts, difficulty);

    const article = new Article({
      userId: req.userId,
      title: `Chinese Learning - ${new Date().toLocaleDateString()}`,
      content,
      targetWords: unknownWords.map(w => ({
        word: w._id,
        wordText: w.word
      })),
      difficulty: difficulty
    });

    await article.save();
    await article.populate('targetWords.word');

    res.status(201).json({ 
      message: 'Article generated successfully', 
      article,
      difficulty: difficulty
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate article', message: error.message });
  }
});

// Mark article as read
router.patch('/:articleId/read', async (req, res) => {
  try {
    const { articleId } = req.params;
    
    const article = await Article.findOne({ 
      _id: articleId, 
      userId: req.userId 
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    article.readAt = new Date();
    article.completed = true;
    await article.save();

    res.json({ message: 'Article marked as read', article });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update article', message: error.message });
  }
});

module.exports = router;
