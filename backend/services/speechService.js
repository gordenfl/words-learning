const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * 语音识别服务
 * 支持多个语音识别提供商
 */

// 支持多个语音识别提供商
const GOOGLE_SPEECH_API_KEY = process.env.GOOGLE_SPEECH_API_KEY;
const BAIDU_SPEECH_API_KEY = process.env.BAIDU_SPEECH_API_KEY;
const BAIDU_SPEECH_SECRET_KEY = process.env.BAIDU_SPEECH_SECRET_KEY;
const USE_BAIDU = process.env.USE_BAIDU_SPEECH === "true";

/**
 * 使用 Google Cloud Speech-to-Text 识别语音
 * @param {Buffer} audioBuffer - 音频文件缓冲区
 * @param {String} languageCode - 语言代码，默认 'zh-CN'
 * @returns {Promise<String>} 识别的文本
 */
async function recognizeWithGoogle(audioBuffer, languageCode = "zh-CN") {
  if (!GOOGLE_SPEECH_API_KEY) {
    throw new Error("Google Speech API key is not configured");
  }

  try {
    console.log("🔍 Using Google Cloud Speech-to-Text for speech recognition...");

    // 将音频转换为 base64
    const audioBase64 = audioBuffer.toString("base64");

    // 对于 M4A/AAC 格式，使用 MP3 编码类型
    // Google Speech API 支持自动检测，但明确指定可以提高成功率
    const response = await axios.post(
      `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_SPEECH_API_KEY}`,
      {
        config: {
          encoding: "MP3", // M4A/AAC 格式使用 MP3 编码类型
          sampleRateHertz: 44100, // 匹配录音的采样率
          languageCode: languageCode,
          alternativeLanguageCodes: ["zh-TW", "en-US"],
          enableAutomaticPunctuation: true,
        },
        audio: {
          content: audioBase64,
        },
      },
      {
        timeout: 30000, // 增加超时时间
      }
    );

    console.log("📋 Google Speech API response:", JSON.stringify(response.data, null, 2));
    
    if (response.data.results && response.data.results.length > 0) {
      const transcript = response.data.results[0].alternatives[0].transcript;
      console.log("✅ Google Speech recognized:", transcript);
      return transcript;
    } else {
      console.log("⚠️ No speech detected in response");
      console.log("📋 Full response:", response.data);
      // 如果 API 返回错误，抛出更详细的错误信息
      if (response.data.error) {
        throw new Error(`Google Speech API error: ${JSON.stringify(response.data.error)}`);
      }
      return "";
    }
  } catch (error) {
    console.error("❌ Google Speech API error:", error.message);
    if (error.response) {
      console.error("❌ Error response:", error.response.data);
    }
    throw new Error(`Google Speech recognition failed: ${error.message}`);
  }
}

/**
 * 使用百度语音识别 API
 * @param {Buffer} audioBuffer - 音频文件缓冲区
 * @param {String} languageCode - 语言代码，默认 'zh'
 * @returns {Promise<String>} 识别的文本
 */
async function recognizeWithBaidu(audioBuffer, languageCode = "zh") {
  if (!BAIDU_SPEECH_API_KEY || !BAIDU_SPEECH_SECRET_KEY) {
    throw new Error("Baidu Speech API credentials are not configured");
  }

  try {
    console.log("🔍 Using Baidu Speech API for speech recognition...");

    // 百度语音识别需要先获取 access_token
    const tokenResponse = await axios.post(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_SPEECH_API_KEY}&client_secret=${BAIDU_SPEECH_SECRET_KEY}`,
      {},
      {
        timeout: 10000,
      }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new Error("Failed to get Baidu access token");
    }

    // 将音频转换为 base64
    const audioBase64 = audioBuffer.toString("base64");

    // 调用百度语音识别 API
    const response = await axios.post(
      `https://vop.baidu.com/server_api?access_token=${accessToken}`,
      {
        format: "pcm", // 或根据实际格式调整
        rate: 16000,
        channel: 1,
        cuid: "words-learning-app",
        len: audioBuffer.length,
        speech: audioBase64,
        dev_pid: 1537, // 中文普通话
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    if (response.data.err_no === 0 && response.data.result) {
      const transcript = response.data.result[0];
      console.log("✅ Baidu Speech recognized:", transcript);
      return transcript;
    } else {
      console.error("❌ Baidu Speech API error:", response.data.err_msg);
      throw new Error(`Baidu Speech recognition failed: ${response.data.err_msg}`);
    }
  } catch (error) {
    console.error("❌ Baidu Speech API error:", error.message);
    if (error.response) {
      console.error("❌ Error response:", error.response.data);
    }
    throw new Error(`Baidu Speech recognition failed: ${error.message}`);
  }
}

/**
 * 识别语音文件
 * @param {Buffer} audioBuffer - 音频文件缓冲区
 * @param {String} languageCode - 语言代码
 * @returns {Promise<String>} 识别的文本
 */
async function recognizeSpeech(audioBuffer, languageCode = "zh-CN") {
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error("Audio buffer is required");
  }

  console.log(`📊 Audio buffer size: ${audioBuffer.length} bytes`);

  // 优先使用百度（如果配置了）
  if (USE_BAIDU && BAIDU_SPEECH_API_KEY && BAIDU_SPEECH_SECRET_KEY) {
    try {
      return await recognizeWithBaidu(audioBuffer, languageCode);
    } catch (error) {
      console.warn("⚠️ Baidu Speech failed, trying Google...");
      // 如果百度失败，尝试 Google
      if (GOOGLE_SPEECH_API_KEY) {
        return await recognizeWithGoogle(audioBuffer, languageCode);
      }
      throw error;
    }
  } else if (GOOGLE_SPEECH_API_KEY) {
    // 使用 Google
    return await recognizeWithGoogle(audioBuffer, languageCode);
  } else {
    throw new Error(
      "No speech recognition API configured. Please set GOOGLE_SPEECH_API_KEY or BAIDU_SPEECH_API_KEY in .env file."
    );
  }
}

module.exports = { recognizeSpeech };

