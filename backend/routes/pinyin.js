const express = require("express");
const router = express.Router();
const PinyinLesson = require("../models/PinyinLesson");
const PinyinProgress = require("../models/PinyinProgress");
const authMiddleware = require("../middleware/auth");

// All routes require authentication
router.use(authMiddleware);

// Get all pinyin lessons (filtered by type if provided)
router.get("/lessons", async (req, res) => {
  try {
    const { type, difficulty } = req.query;
    const query = { enabled: true };
    
    if (type) {
      query.type = type;
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }

    const lessons = await PinyinLesson.find(query).sort({ order: 1, pinyin: 1 });
    res.json({ lessons, count: lessons.length });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch pinyin lessons",
      message: error.message,
    });
  }
});

// Get a single pinyin lesson
router.get("/lessons/:lessonId", async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await PinyinLesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({ error: "Pinyin lesson not found" });
    }

    res.json({ lesson });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch pinyin lesson",
      message: error.message,
    });
  }
});

// Get user's progress for all lessons
router.get("/progress", async (req, res) => {
  try {
    const progress = await PinyinProgress.find({ userId: req.userId })
      .populate('lessonId')
      .sort({ createdAt: -1 });
    
    res.json({ progress, count: progress.length });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch pinyin progress",
      message: error.message,
    });
  }
});

// Get user's progress for a specific lesson
router.get("/progress/:lessonId", async (req, res) => {
  try {
    const { lessonId } = req.params;
    const progress = await PinyinProgress.findOne({
      userId: req.userId,
      lessonId: lessonId,
    }).populate('lessonId');

    if (!progress) {
      // Return default progress if not found
      return res.json({
        progress: {
          userId: req.userId,
          lessonId: lessonId,
          status: 'not_started',
          practices: {
            toneSlider: { completed: false, bestScore: 0, attempts: 0 },
            pronunciation: { completed: false, bestScore: 0, attempts: 0 },
            spelling: { completed: false, bestScore: 0, attempts: 0 },
          },
        },
      });
    }

    res.json({ progress });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch pinyin progress",
      message: error.message,
    });
  }
});

// Update user's progress for a lesson
router.post("/progress/:lessonId", async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { practiceType, score, completed } = req.body;

    if (!practiceType || !['toneSlider', 'pronunciation', 'spelling'].includes(practiceType)) {
      return res.status(400).json({ error: "Invalid practice type" });
    }

    let progress = await PinyinProgress.findOne({
      userId: req.userId,
      lessonId: lessonId,
    });

    if (!progress) {
      // Create new progress
      progress = new PinyinProgress({
        userId: req.userId,
        lessonId: lessonId,
        startedAt: new Date(),
      });
    }

    // Update practice data
    const practice = progress.practices[practiceType];
    practice.attempts += 1;
    if (score !== undefined && score > practice.bestScore) {
      practice.bestScore = score;
    }
    if (completed) {
      practice.completed = true;
    }

    // Update status
    if (progress.status === 'not_started') {
      progress.status = 'learning';
    }

    // Check if all practices are completed
    const allCompleted = 
      progress.practices.toneSlider.completed &&
      progress.practices.pronunciation.completed &&
      progress.practices.spelling.completed;

    if (allCompleted && progress.status !== 'completed') {
      progress.status = 'completed';
      progress.completedAt = new Date();
    }

    progress.lastPracticedAt = new Date();
    await progress.save();

    res.json({
      message: "Progress updated successfully",
      progress,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to update progress",
      message: error.message,
    });
  }
});

// Get words that match a pinyin
router.get("/words/:pinyin", async (req, res) => {
  try {
    const { pinyin } = req.params;
    const Word = require("../models/Word");
    
    // Find words that match the pinyin (case-insensitive, partial match)
    const words = await Word.find({
      userId: req.userId,
      pinyin: { $regex: new RegExp(pinyin, 'i') },
    }).limit(20);

    res.json({ words, count: words.length });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch words",
      message: error.message,
    });
  }
});

module.exports = router;

