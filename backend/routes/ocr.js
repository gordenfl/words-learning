const express = require('express');
const router = express.Router();
const multer = require('multer');
const { extractTextFromImage } = require('../services/ocrService');
const Word = require('../models/Word');
const authMiddleware = require('../middleware/auth');

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// All routes require authentication
router.use(authMiddleware);

/**
 * OCR图片识别端点
 * 上传图片 → 识别中文 → 对比数据库 → 返回新单词
 */
router.post('/extract', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        message: 'Please upload an image',
        hasImage: false 
      });
    }

    console.log(`📸 Processing image: ${req.file.originalname}, Size: ${req.file.size} bytes`);
    
    // Step 1: 使用OCR识别图片中的文字
    const extractedWords = await extractTextFromImage(req.file.buffer);
    
    console.log(`🔍 OCR extracted ${extractedWords.length} words:`, extractedWords.join('、'));
    
    // Step 2: 查询用户已有的单词
    const existingWords = await Word.find({
      userId: req.userId,
      word: { $in: extractedWords }
    }).select('word');
    
    const existingWordSet = new Set(existingWords.map(w => w.word));
    
    console.log(`📚 User already has ${existingWordSet.size} of these words`);
    
    // Step 3: 过滤出新单词（用户还没学过的）
    const newWords = extractedWords.filter(word => !existingWordSet.has(word));
    
    console.log(`✨ Found ${newWords.length} new words for user to learn`);
    
    // Step 4: 统计信息
    const stats = {
      totalExtracted: extractedWords.length,
      alreadyKnown: existingWordSet.size,
      newWords: newWords.length
    };
    
    res.json({
      success: true,
      message: `Found ${newWords.length} new Chinese words!`,
      newWords: newWords,
      knownWords: Array.from(existingWordSet),
      stats: stats
    });
    
  } catch (error) {
    console.error('❌ OCR processing error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Could not process the image. Please try again.',
      error: error.message 
    });
  }
});

/**
 * 使用base64图片进行OCR（移动端友好）
 */
router.post('/extract-base64', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ 
        message: 'Please provide image data',
        hasImage: false 
      });
    }

    console.log('📸 Processing base64 image...');
    
    // Step 1: OCR识别
    const extractedWords = await extractTextFromImage(imageBase64);
    
    console.log(`🔍 OCR extracted ${extractedWords.length} words`);
    
    // Step 2: 查询用户已有的单词
    const existingWords = await Word.find({
      userId: req.userId,
      word: { $in: extractedWords }
    }).select('word');
    
    const existingWordSet = new Set(existingWords.map(w => w.word));
    
    // Step 3: 过滤新单词
    const newWords = extractedWords.filter(word => !existingWordSet.has(word));
    
    console.log(`✨ ${newWords.length} new words, ${existingWordSet.size} already known`);
    
    res.json({
      success: true,
      message: `Found ${newWords.length} new Chinese words!`,
      newWords: newWords,
      knownWords: Array.from(existingWordSet),
      stats: {
        totalExtracted: extractedWords.length,
        alreadyKnown: existingWordSet.size,
        newWords: newWords.length
      }
    });
    
  } catch (error) {
    console.error('❌ OCR processing error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Could not process the image. Please try again.',
      error: error.message 
    });
  }
});

module.exports = router;

