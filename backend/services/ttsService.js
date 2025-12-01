const axios = require("axios");

/**
 * 文本转语音（TTS）服务
 * 用于生成标准的汉语拼音发音
 * 支持多个TTS提供商
 */

// 支持多个TTS提供商
const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_SPEECH_API_KEY;
const BAIDU_TTS_API_KEY = process.env.BAIDU_TTS_API_KEY || process.env.BAIDU_SPEECH_API_KEY;
const BAIDU_TTS_SECRET_KEY = process.env.BAIDU_TTS_SECRET_KEY || process.env.BAIDU_SPEECH_SECRET_KEY;
const USE_BAIDU_TTS = process.env.USE_BAIDU_TTS === "true";

/**
 * 使用 Google Cloud Text-to-Speech 生成语音
 * @param {String} text - 要转换的文本（拼音或汉字）
 * @param {String} languageCode - 语言代码，默认 'zh-CN'
 * @returns {Promise<Buffer>} 音频文件缓冲区
 */
async function synthesizeWithGoogle(text, languageCode = "zh-CN") {
  if (!GOOGLE_TTS_API_KEY) {
    throw new Error("Google TTS API key is not configured");
  }

  try {
    console.log(`🔊 Using Google Cloud TTS for: "${text}"`);

    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        input: { text: text },
        voice: {
          languageCode: languageCode,
          name: "zh-CN-Standard-A", // 标准女声，适合拼音发音
          ssmlGender: "FEMALE",
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 0.9, // 稍微慢一点，适合学习
          pitch: 0,
        },
      },
      {
        timeout: 15000,
      }
    );

    if (response.data.audioContent) {
      const audioBuffer = Buffer.from(response.data.audioContent, "base64");
      console.log(`✅ Google TTS generated audio: ${audioBuffer.length} bytes`);
      return audioBuffer;
    } else {
      throw new Error("No audio content in Google TTS response");
    }
  } catch (error) {
    console.error("❌ Google TTS API error:", error.message);
    if (error.response) {
      console.error("❌ Error response:", error.response.data);
    }
    throw new Error(`Google TTS failed: ${error.message}`);
  }
}

/**
 * 使用百度语音合成 API
 * @param {String} text - 要转换的文本（拼音或汉字）
 * @param {String} languageCode - 语言代码，默认 'zh'
 * @returns {Promise<Buffer>} 音频文件缓冲区
 */
async function synthesizeWithBaidu(text, languageCode = "zh") {
  if (!BAIDU_TTS_API_KEY || !BAIDU_TTS_SECRET_KEY) {
    throw new Error("Baidu TTS API credentials are not configured");
  }

  try {
    console.log(`🔊 Using Baidu TTS for: "${text}"`);

    // 百度语音合成需要先获取 access_token
    const tokenResponse = await axios.post(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_TTS_API_KEY}&client_secret=${BAIDU_TTS_SECRET_KEY}`,
      {},
      {
        timeout: 10000,
      }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new Error("Failed to get Baidu access token");
    }

    // 调用百度语音合成 API
    const response = await axios.post(
      `https://tsn.baidu.com/text2audio?tok=${accessToken}&ctp=1&lan=zh&cuid=words-learning-app&per=0&spd=5&pit=5&vol=5&aue=3`,
      `tex=${encodeURIComponent(text)}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        responseType: "arraybuffer", // 接收二进制数据
        timeout: 15000,
      }
    );

    // 检查响应类型
    const contentType = response.headers["content-type"];
    if (contentType && contentType.includes("application/json")) {
      // 如果返回JSON，说明出错了
      const errorData = JSON.parse(Buffer.from(response.data).toString());
      throw new Error(`Baidu TTS error: ${errorData.err_msg || "Unknown error"}`);
    }

    const audioBuffer = Buffer.from(response.data);
    console.log(`✅ Baidu TTS generated audio: ${audioBuffer.length} bytes`);
    return audioBuffer;
  } catch (error) {
    console.error("❌ Baidu TTS API error:", error.message);
    if (error.response && error.response.data) {
      try {
        const errorData = JSON.parse(Buffer.from(error.response.data).toString());
        console.error("❌ Error response:", errorData);
      } catch (e) {
        console.error("❌ Error response (raw):", error.response.data);
      }
    }
    throw new Error(`Baidu TTS failed: ${error.message}`);
  }
}

/**
 * 生成语音音频
 * @param {String} text - 要转换的文本（拼音或汉字）
 * @param {String} languageCode - 语言代码
 * @returns {Promise<Buffer>} 音频文件缓冲区
 */
async function synthesizeSpeech(text, languageCode = "zh-CN") {
  if (!text || text.trim().length === 0) {
    throw new Error("Text is required for TTS");
  }

  console.log(`📝 Synthesizing speech for: "${text}"`);

  // 优先使用百度（如果配置了）
  if (USE_BAIDU_TTS && BAIDU_TTS_API_KEY && BAIDU_TTS_SECRET_KEY) {
    try {
      return await synthesizeWithBaidu(text, languageCode);
    } catch (error) {
      console.warn("⚠️ Baidu TTS failed, trying Google...");
      // 如果百度失败，尝试 Google
      if (GOOGLE_TTS_API_KEY) {
        return await synthesizeWithGoogle(text, languageCode);
      }
      throw error;
    }
  } else if (GOOGLE_TTS_API_KEY) {
    // 使用 Google
    return await synthesizeWithGoogle(text, languageCode);
  } else {
    throw new Error(
      "No TTS API configured. Please set GOOGLE_TTS_API_KEY or BAIDU_TTS_API_KEY in .env file."
    );
  }
}

module.exports = { synthesizeSpeech };


