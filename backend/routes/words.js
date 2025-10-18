const express = require('express');
const router = express.Router();
const Word = require('../models/Word');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get all words for current user
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const query = { userId: req.userId };
    
    if (status) {
      query.status = status;
    }

    const words = await Word.find(query).sort({ addedAt: -1 });
    res.json({ words, count: words.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch words', message: error.message });
  }
});

// Get word statistics
router.get('/stats', async (req, res) => {
  try {
    const totalWords = await Word.countDocuments({ userId: req.userId });
    const knownWords = await Word.countDocuments({ userId: req.userId, status: 'known' });
    const learningWords = await Word.countDocuments({ userId: req.userId, status: 'learning' });
    const unknownWords = await Word.countDocuments({ userId: req.userId, status: 'unknown' });

    // Get today's learned words
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLearned = await Word.countDocuments({
      userId: req.userId,
      status: 'known',
      learnedAt: { $gte: today }
    });

    res.json({
      total: totalWords,
      known: knownWords,
      learning: learningWords,
      unknown: unknownWords,
      todayLearned
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics', message: error.message });
  }
});

// Add a new word
router.post('/', async (req, res) => {
  try {
    const { word, pinyin, definition, translation, examples, sourceImage } = req.body;

    // Check if word already exists for this user
    const existingWord = await Word.findOne({ userId: req.userId, word: word.toLowerCase() });
    if (existingWord) {
      return res.status(400).json({ error: 'Word already exists in your list' });
    }

    const newWord = new Word({
      userId: req.userId,
      word: word.toLowerCase(),
      pinyin,
      translation,
      definition,
      examples,
      sourceImage,
      status: 'unknown'
    });

    await newWord.save();
    res.status(201).json({ message: 'Word added successfully', word: newWord });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add word', message: error.message });
  }
});

// Add multiple words at once
router.post('/batch', async (req, res) => {
  try {
    const { words, sourceImage } = req.body;
    
    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'Words array is required' });
    }

    const newWords = [];
    const skippedWords = [];

    for (const wordItem of words) {
      // 支持两种格式：字符串或对象{word, pinyin}
      const wordText = typeof wordItem === 'string' ? wordItem : wordItem.word;
      const wordPinyin = typeof wordItem === 'object' ? wordItem.pinyin : undefined;
      
      const existingWord = await Word.findOne({ 
        userId: req.userId, 
        word: wordText.toLowerCase() 
      });

      if (!existingWord) {
        const newWord = new Word({
          userId: req.userId,
          word: wordText.toLowerCase(),
          pinyin: wordPinyin,
          sourceImage,
          status: 'unknown'
        });
        await newWord.save();
        newWords.push(newWord);
      } else {
        skippedWords.push(wordText);
      }
    }

    res.status(201).json({
      message: `Added ${newWords.length} new words`,
      added: newWords,
      skipped: skippedWords
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add words', message: error.message });
  }
});

// Update word status
router.patch('/:wordId/status', async (req, res) => {
  try {
    const { wordId } = req.params;
    const { status } = req.body;

    if (!['unknown', 'learning', 'known'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const word = await Word.findOne({ _id: wordId, userId: req.userId });
    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }

    word.status = status;
    if (status === 'known' && !word.learnedAt) {
      word.learnedAt = new Date();
    }

    await word.save();
    res.json({ message: 'Word status updated', word });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update word', message: error.message });
  }
});

// Delete a word
router.delete('/:wordId', async (req, res) => {
  try {
    const { wordId } = req.params;
    const word = await Word.findOneAndDelete({ _id: wordId, userId: req.userId });
    
    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }

    res.json({ message: 'Word deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete word', message: error.message });
  }
});

module.exports = router;

