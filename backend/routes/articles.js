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
    // 使用 MongoDB 的 $sample 聚合管道随机选择单词
    let unknownWords = await Word.aggregate([
      { 
        $match: { 
          userId: req.userId, 
          status: 'unknown',
          difficulty: difficulty 
        } 
      },
      { $sample: { size: wordCount } }
    ]);

    // If not enough words at this difficulty, get any unknown words (randomly)
    if (unknownWords.length < 3) {
      unknownWords = await Word.aggregate([
        { 
          $match: { 
            userId: req.userId, 
            status: 'unknown' 
          } 
        },
        { $sample: { size: wordCount } }
      ]);
    }

    if (unknownWords.length === 0) {
      return res.status(200).json({ 
        message: 'Great job! You\'ve learned all your words! 🎉',
        suggestion: 'Add some new Chinese words to continue your learning journey.',
        needMoreWords: true
      });
    }

    // 获取用户已学的单词（known）
    // 限制数量避免单词太多，取最近学习的30个
    const knownWords = await Word.find({ 
      userId: req.userId, 
      status: 'known'
    })
    .sort({ updatedAt: -1 })
    .limit(30);

    console.log(`📚 Generating article with ${unknownWords.length} unknown words and ${knownWords.length} known words`);
    
    // Generate article based on difficulty using AI service
    const targetWords = unknownWords.map(w => w.word);
    const knownWordTexts = knownWords.map(w => w.word);
    
    console.log(`🎯 Target words for this article: ${targetWords.join('、')}`);
    console.log(`📖 Known words to use: ${knownWordTexts.join('、')}`);
    const content = await generateChineseStory(targetWords, knownWordTexts, difficulty);

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
