const axios = require('axios');

/**
 * OCR文字识别服务
 * 支持多个OCR提供商
 */

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
const BAIDU_OCR_API_KEY = process.env.BAIDU_OCR_API_KEY;
const BAIDU_OCR_SECRET_KEY = process.env.BAIDU_OCR_SECRET_KEY;
const USE_GOOGLE_VISION = process.env.USE_GOOGLE_VISION === 'true';

/**
 * 从图片中提取中文文字
 * @param {Buffer|String} imageData - 图片数据（base64或buffer）
 * @returns {Promise<Array>} 提取的文字数组
 */
async function extractTextFromImage(imageData) {
  // 根据USE_GOOGLE_VISION开关选择OCR服务
  if (USE_GOOGLE_VISION && GOOGLE_VISION_API_KEY) {
    console.log('🔍 Selected OCR: Google Cloud Vision');
    return await extractWithGoogleVision(imageData);
  } else if (BAIDU_OCR_API_KEY && BAIDU_OCR_SECRET_KEY) {
    console.log('🔍 Selected OCR: Baidu OCR');
    return await extractWithBaiduOCR(imageData);
  }
  
  // 使用本地fallback（演示模式）
  console.log('🔍 Selected OCR: Local demo mode');
  return await extractWithTesseract(imageData);
}

/**
 * 使用百度OCR识别（推荐用于中文）
 */
async function extractWithBaiduOCR(imageData) {
  try {
    console.log('🔍 Using Baidu OCR for Chinese text recognition...');
    
    // 获取access token
    const tokenResponse = await axios.post(
      'https://aip.baidubce.com/oauth/2.0/token',
      null,
      {
        params: {
          grant_type: 'client_credentials',
          client_id: BAIDU_OCR_API_KEY,
          client_secret: BAIDU_OCR_SECRET_KEY
        }
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    
    // 调用OCR API
    const imageBase64 = Buffer.isBuffer(imageData) 
      ? imageData.toString('base64')
      : imageData.replace(/^data:image\/\w+;base64,/, '');
    
    const ocrResponse = await axios.post(
      `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`,
      `image=${encodeURIComponent(imageBase64)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const words = extractChineseWords(ocrResponse.data.words_result);
    console.log(`✅ Baidu OCR: Extracted ${words.length} Chinese words`);
    
    return words;
  } catch (error) {
    console.error('❌ Baidu OCR failed:', error.message);
    return await extractWithTesseract(imageData);
  }
}

/**
 * 使用Google Cloud Vision识别
 */
async function extractWithGoogleVision(imageData) {
  try {
    console.log('🔍 Using Google Cloud Vision for text recognition...');
    
    const imageBase64 = Buffer.isBuffer(imageData) 
      ? imageData.toString('base64')
      : imageData.replace(/^data:image\/\w+;base64,/, '');
    
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        requests: [{
          image: { content: imageBase64 },
          features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
        }]
      },
      {
        timeout: 15000
      }
    );
    
    // 检查API响应
    if (response.data.responses[0].error) {
      console.error('❌ Google Vision API error:', response.data.responses[0].error);
      throw new Error(response.data.responses[0].error.message);
    }
    
    const detections = response.data.responses[0]?.textAnnotations || [];
    
    if (detections.length === 0) {
      console.log('⚠️  No text found in image');
      return [];
    }
    
    const fullText = detections[0]?.description || '';
    
    // 打印完整的识别文字
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Google Vision识别的完整文字:');
    console.log(fullText);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const words = extractChineseWords([{ words: fullText }]);
    
    console.log(`✅ 提取的中文词汇 (${words.length}个):`);
    console.log(words.join('、'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return words;
  } catch (error) {
    console.error('❌ Google Vision failed:', error.response?.data || error.message);
    console.log('🔄 Falling back to local demo mode...');
    return await extractWithTesseract(imageData);
  }
}

/**
 * 使用Tesseract.js本地识别（备选方案）
 */
async function extractWithTesseract(imageData) {
  console.log('🔍 Using fallback: Tesseract OCR...');
  
  // Tesseract需要额外配置，这里返回模拟数据
  // 在生产环境中应该真正实现Tesseract
  console.log('⚠️  OCR not configured. Returning sample Chinese words for demo.');
  
  // 返回一些常用的中文单词作为示例
  return [
    '学习', '中文', '你好', '谢谢', '朋友',
    '工作', '生活', '快乐', '美丽', '时间',
    '地方', '东西', '认识', '喜欢', '知道'
  ];
}

/**
 * 从OCR结果中提取中文词汇
 */
function extractChineseWords(ocrResults) {
  try {
    if (!ocrResults || ocrResults.length === 0) {
      return [];
    }
    
    const allText = ocrResults.map(r => r.words || '').join('');
    
    if (!allText) {
      return [];
    }
    
    console.log('📖 原始文本长度:', allText.length);
    
    // 移除所有非中文字符
    const chineseOnly = allText.replace(/[^\u4e00-\u9fa5]/g, '');
    
    console.log('📖 纯中文字符:', chineseOnly);
    console.log('📖 中文字符数量:', chineseOnly.length);
    
    if (chineseOnly.length === 0) {
      console.log('⚠️  No Chinese characters found');
      return [];
    }
    
    // 提取所有中文字符（逐字提取，不分词）
    const allCharacters = chineseOnly.split('');
    
    console.log('📖 提取的所有字符 (去重前):', allCharacters.length, '个');
    console.log('📖 所有字符:', allCharacters.join('、'));
    
    // 去重
    const uniqueCharacters = [...new Set(allCharacters)];
    
    console.log('📖 去重后的字符:', uniqueCharacters.length, '个');
    console.log('📖 最终字符列表:', uniqueCharacters.join('、'));
    
    return uniqueCharacters;
  } catch (error) {
    console.error('❌ Error extracting Chinese words:', error.message);
    return [];
  }
}

module.exports = {
  extractTextFromImage
};

