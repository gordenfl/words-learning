const express = require("express");
const router = express.Router();
const multer = require("multer");
const { recognizeSpeech } = require("../services/speechService");
const authMiddleware = require("../middleware/auth");

// 配置multer用于音频文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // 接受音频文件
    if (file.mimetype.startsWith("audio/") || file.mimetype === "application/octet-stream") {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"), false);
    }
  },
});

// All routes require authentication
router.use(authMiddleware);

/**
 * 语音识别端点
 * 上传音频文件 → 识别为中文文本 → 返回文本
 */
router.post("/recognize", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an audio file",
      });
    }

    console.log(`🎤 Processing audio: ${req.file.originalname}, Size: ${req.file.size} bytes, MIME: ${req.file.mimetype}`);

    // 获取语言代码（默认为中文）
    const languageCode = req.body.languageCode || "zh-CN";

    // 识别语音
    const transcript = await recognizeSpeech(req.file.buffer, languageCode);

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "No speech detected in the audio",
      });
    }

    res.json({
      success: true,
      transcript: transcript.trim(),
      message: "Speech recognized successfully",
    });
  } catch (error) {
    console.error("❌ Speech recognition error:", error.message);
    res.status(500).json({
      success: false,
      message: "Speech recognition failed",
      error: error.message,
    });
  }
});

/**
 * 使用base64音频进行语音识别（移动端友好）
 */
router.post("/recognize-base64", async (req, res) => {
  try {
    const { audioBase64, languageCode = "zh-CN" } = req.body;

    if (!audioBase64) {
      return res.status(400).json({
        success: false,
        message: "Please provide audio data",
      });
    }

    console.log("🎤 Processing base64 audio...");

    // 将 base64 转换为 Buffer
    const audioBuffer = Buffer.from(audioBase64, "base64");

    if (audioBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid audio data",
      });
    }

    console.log(`📊 Audio buffer size: ${audioBuffer.length} bytes`);

    // 识别语音
    const transcript = await recognizeSpeech(audioBuffer, languageCode);

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "No speech detected in the audio",
      });
    }

    res.json({
      success: true,
      transcript: transcript.trim(),
      message: "Speech recognized successfully",
    });
  } catch (error) {
    console.error("❌ Speech recognition error:", error.message);
    res.status(500).json({
      success: false,
      message: "Speech recognition failed",
      error: error.message,
    });
  }
});

module.exports = router;


