const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const Word = require('../models/Word');
const authMiddleware = require('../middleware/auth');

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
    const { wordCount = 10 } = req.body;

    // Get unknown words
    const unknownWords = await Word.find({ 
      userId: req.userId, 
      status: 'unknown' 
    }).limit(wordCount);

    if (unknownWords.length === 0) {
      return res.status(400).json({ error: 'No unknown words available. Add more words first!' });
    }

    // Generate a simple article (in production, use AI API)
    const wordTexts = unknownWords.map(w => w.word);
    const content = generateArticleContent(wordTexts);

    const article = new Article({
      userId: req.userId,
      title: `Learning Article - ${new Date().toLocaleDateString()}`,
      content,
      targetWords: unknownWords.map(w => ({
        word: w._id,
        wordText: w.word
      })),
      difficulty: 'intermediate'
    });

    await article.save();
    await article.populate('targetWords.word');

    res.status(201).json({ 
      message: 'Article generated successfully', 
      article 
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

// Helper function to generate article content
function generateArticleContent(words) {
  const intro = "Welcome to today's reading practice! This article contains words you're learning. Read carefully and try to understand the context.\n\n";
  
  const sentences = words.map((word, index) => {
    const examples = [
      `The ${word} was incredibly fascinating to observe in its natural habitat.`,
      `Understanding the concept of ${word} requires careful study and practice.`,
      `Many people find ${word} to be an important part of their daily routine.`,
      `The ${word} played a crucial role in the development of modern society.`,
      `Scientists have been studying ${word} for many years to better understand its implications.`
    ];
    return examples[index % examples.length];
  });

  return intro + sentences.join(' ') + '\n\nKeep practicing and you\'ll master these words in no time!';
}

module.exports = router;

