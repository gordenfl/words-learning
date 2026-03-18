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

    // Use learned/known words for article (学过的字组成的文章)
    let learnedWords = await Word.find({ 
      userId: req.userId, 
      status: { $in: ['known', 'learned'] },
      difficulty: difficulty 
    })
    .sort({ updatedAt: -1 })
    .limit(wordCount + 50);

    if (learnedWords.length < 3) {
      learnedWords = await Word.find({ 
        userId: req.userId, 
        status: { $in: ['known', 'learned'] }
      })
      .sort({ updatedAt: -1 })
      .limit(wordCount + 50);
    }

    if (learnedWords.length < 3) {
      return res.status(200).json({ 
        message: 'No words to read yet',
        suggestion: 'Learn some words first (complete Writing practice and mark them as Learned), then generate an article.',
        needMoreWords: true
      });
    }

    // Random sample if we have more than needed
    const targetWordsList = learnedWords.length > wordCount
      ? learnedWords.sort(() => Math.random() - 0.5).slice(0, wordCount)
      : learnedWords;

    if (targetWordsList.length === 0) {
      return res.status(200).json({ 
        message: 'No words to read yet',
        suggestion: 'Learn some words first (complete Writing practice and mark them as Learned), then generate an article.',
        needMoreWords: true
      });
    }

    // All learned words as context for AI
    const allKnown = await Word.find({ 
      userId: req.userId, 
      status: { $in: ['known', 'learned'] }
    })
    .sort({ updatedAt: -1 })
    .limit(50);

    const targetWords = targetWordsList.map(w => w.word);
    const knownWordTexts = allKnown.map(w => w.word);

    console.log(`📚 Generating article with ${targetWordsList.length} learned words`);
    console.log(`🎯 Target words for this article: ${targetWords.join('、')}`);
    const content = await generateChineseStory(targetWords, knownWordTexts, difficulty);

    const article = new Article({
      userId: req.userId,
      title: `Chinese Learning - ${new Date().toLocaleDateString()}`,
      content,
      targetWords: targetWordsList.map(w => ({
        word: w._id,
        wordText: w.word
      })),
      difficulty: difficulty
    });

    await article.save();
    
    // 更新标题为 Reading
    article.title = 'Reading';
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
