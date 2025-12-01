const express = require("express");
const router = express.Router();
const { synthesizeSpeech } = require("../services/ttsService");
const authMiddleware = require("../middleware/auth");

// All routes require authentication
router.use(authMiddleware);

/**
 * 文本转语音端点
 * 生成标准的汉语拼音发音
 */
router.post("/synthesize", async (req, res) => {
  try {
    const { text, languageCode = "zh-CN" } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Please provide text to synthesize",
      });
    }

    console.log(`🎤 Synthesizing speech for: "${text}"`);

    // 生成语音
    const audioBuffer = await synthesizeSpeech(text, languageCode);

    // 返回音频文件（base64编码）
    const audioBase64 = audioBuffer.toString("base64");

    res.json({
      success: true,
      audioBase64: audioBase64,
      format: "mp3",
      message: "Speech synthesized successfully",
    });
  } catch (error) {
    console.error("❌ TTS error:", error.message);
    res.status(500).json({
      success: false,
      message: "TTS synthesis failed",
      error: error.message,
    });
  }
});

module.exports = router;


