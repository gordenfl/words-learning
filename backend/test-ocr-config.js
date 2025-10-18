/**
 * OCR配置测试脚本
 * 测试百度OCR和Google Vision API是否配置正确
 */

require('dotenv').config();
const axios = require('axios');

const BAIDU_OCR_API_KEY = process.env.BAIDU_OCR_API_KEY;
const BAIDU_OCR_SECRET_KEY = process.env.BAIDU_OCR_SECRET_KEY;
const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
const USE_GOOGLE_VISION = process.env.USE_GOOGLE_VISION === 'true';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 OCR配置检查');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 检查环境变量
console.log('📋 环境变量配置:');
console.log(`   USE_GOOGLE_VISION: ${USE_GOOGLE_VISION}`);
console.log(`   BAIDU_OCR_API_KEY: ${BAIDU_OCR_API_KEY ? '✅ 已配置' : '❌ 未配置'}`);
console.log(`   BAIDU_OCR_SECRET_KEY: ${BAIDU_OCR_SECRET_KEY ? '✅ 已配置' : '❌ 未配置'}`);
console.log(`   GOOGLE_VISION_API_KEY: ${GOOGLE_VISION_API_KEY ? '✅ 已配置' : '❌ 未配置'}`);
console.log('');

// 测试百度OCR
async function testBaiduOCR() {
  if (!BAIDU_OCR_API_KEY || !BAIDU_OCR_SECRET_KEY) {
    console.log('⚠️  百度OCR: 未配置，跳过测试\n');
    return false;
  }

  console.log('🔍 测试百度OCR配置...');
  
  try {
    // 获取access token
    const tokenResponse = await axios.post(
      'https://aip.baidubce.com/oauth/2.0/token',
      null,
      {
        params: {
          grant_type: 'client_credentials',
          client_id: BAIDU_OCR_API_KEY,
          client_secret: BAIDU_OCR_SECRET_KEY
        },
        timeout: 10000
      }
    );
    
    if (tokenResponse.data.access_token) {
      console.log('✅ 百度OCR: 配置正确！');
      console.log(`   Access Token: ${tokenResponse.data.access_token.substring(0, 20)}...`);
      console.log(`   有效期: ${tokenResponse.data.expires_in}秒\n`);
      return true;
    } else {
      console.log('❌ 百度OCR: 无法获取access token');
      console.log(`   响应: ${JSON.stringify(tokenResponse.data)}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ 百度OCR: 配置错误！');
    if (error.response) {
      console.log(`   状态码: ${error.response.status}`);
      console.log(`   错误信息: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   错误: ${error.message}`);
    }
    console.log('');
    return false;
  }
}

// 测试Google Vision
async function testGoogleVision() {
  if (!GOOGLE_VISION_API_KEY) {
    console.log('⚠️  Google Vision: 未配置，跳过测试\n');
    return false;
  }

  console.log('🔍 测试Google Vision配置...');
  
  try {
    // 使用一个简单的base64图片测试（1x1透明PNG）
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        requests: [{
          image: { content: testImage },
          features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
        }]
      },
      {
        timeout: 10000
      }
    );
    
    // 检查响应
    if (response.data.responses && response.data.responses[0]) {
      if (response.data.responses[0].error) {
        const error = response.data.responses[0].error;
        console.log('❌ Google Vision: API错误！');
        console.log(`   错误码: ${error.code}`);
        console.log(`   错误信息: ${error.message}`);
        console.log(`   状态: ${error.status}\n`);
        return false;
      } else {
        console.log('✅ Google Vision: 配置正确！');
        console.log('   API可以正常调用\n');
        return true;
      }
    } else {
      console.log('❌ Google Vision: 响应格式异常');
      console.log(`   响应: ${JSON.stringify(response.data)}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ Google Vision: 配置错误！');
    if (error.response) {
      console.log(`   状态码: ${error.response.status}`);
      console.log(`   错误信息: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   错误: ${error.message}`);
    }
    console.log('');
    return false;
  }
}

// 运行测试
async function runTests() {
  const baiduResult = await testBaiduOCR();
  const googleResult = await testGoogleVision();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 测试结果总结');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`百度OCR:       ${baiduResult ? '✅ 可用' : '❌ 不可用'}`);
  console.log(`Google Vision: ${googleResult ? '✅ 可用' : '❌ 不可用'}`);
  console.log('');
  
  console.log('💡 建议:');
  if (USE_GOOGLE_VISION && googleResult) {
    console.log('   当前使用: Google Vision ✅');
  } else if (!USE_GOOGLE_VISION && baiduResult) {
    console.log('   当前使用: 百度OCR ✅');
  } else if (baiduResult && !USE_GOOGLE_VISION) {
    console.log('   建议使用百度OCR（已配置且可用）');
  } else if (googleResult && USE_GOOGLE_VISION) {
    console.log('   建议使用Google Vision（已配置且可用）');
  } else {
    console.log('   ⚠️  请至少配置一个OCR服务！');
  }
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// 执行测试
runTests().catch(console.error);

