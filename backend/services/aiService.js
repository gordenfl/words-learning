const axios = require('axios');

/**
 * AI文章生成服务
 * 使用OpenAI API生成自然流畅的中文学习文章
 */

// 支持多个AI提供商
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY; // DeepSeek支持中文，更便宜
const USE_DEEPSEEK = process.env.USE_DEEPSEEK === 'true';

/**
 * 使用AI生成中文学习文章
 * @param {Array} targetWords - 要学习的新单词数组（必须出现）
 * @param {Array} knownWords - 用户已学过的单词数组（建议使用）
 * @param {String} difficulty - 难度级别 (beginner/intermediate/advanced)
 * @returns {Promise<String>} 生成的文章内容
 */
async function generateChineseStory(targetWords, knownWords = [], difficulty = 'intermediate') {
  // 优先使用AI生成
  if (USE_DEEPSEEK && DEEPSEEK_API_KEY) {
    return await generateWithDeepSeek(targetWords, knownWords, difficulty);
  } else if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here') {
    return await generateWithOpenAI(targetWords, knownWords, difficulty);
  }
  
  // 如果没有配置AI，抛出错误
  console.log('❌ No AI API configured.');
  throw new Error('AI API is required for story generation. Please configure DEEPSEEK_API_KEY or OPENAI_API_KEY in .env file.');
}

/**
 * 使用OpenAI生成故事
 */
async function generateWithOpenAI(targetWords, knownWords, difficulty) {
  try {
    const prompt = buildPrompt(targetWords, knownWords, difficulty);
    
    console.log('🤖 Calling OpenAI API to generate story...');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini', // 使用更好的模型
        messages: [
          {
            role: 'system',
            content: '你是一位经验丰富的中文教师，擅长为外国学生创作生动、自然、有趣的中文学习故事。你深刻理解每个中文词的用法和文化背景，能够将词汇完美地融入到连贯的故事中。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8, // 提高创造性
        max_tokens: 600
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ OpenAI story generated successfully');
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('❌ OpenAI API failed:', error.response?.data || error.message);
    throw new Error('OpenAI API failed: ' + (error.response?.data?.error?.message || error.message));
  }
}

/**
 * 使用DeepSeek生成故事（专门优化中文，更便宜）
 */
async function generateWithDeepSeek(targetWords, knownWords, difficulty) {
  try {
    const prompt = buildPrompt(targetWords, knownWords, difficulty);
    
    console.log('🤖 Calling DeepSeek API to generate story...');
    
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位经验丰富的中文教师，擅长为外国学生创作生动、自然、有趣的中文学习故事。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 600
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ DeepSeek story generated successfully');
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('❌ DeepSeek API failed:', error.response?.data || error.message);
    throw new Error('DeepSeek API failed: ' + (error.response?.data?.error?.message || error.message));
  }
}

/**
 * 构建AI提示词 - 优化版，让AI真正理解每个词并创作自然的故事
 */
function buildPrompt(targetWords, knownWords, difficulty) {
  const difficultyGuides = {
    beginner: {
      level: '初级（HSK 1-2级）',
      structure: '使用简单句，主谓宾结构，每句5-10个字',
      vocabulary: '只使用最基础的常用词汇',
      length: '100-150字'
    },
    intermediate: {
      level: '中级（HSK 3-4级）',
      structure: '可以使用复句，适当的连接词，每句10-20个字',
      vocabulary: '日常生活常用词汇',
      length: '200-300字'
    },
    advanced: {
      level: '高级（HSK 5-6级）',
      structure: '使用书面语、成语、复杂句式',
      vocabulary: '书面语、专业词汇',
      length: '300-400字'
    }
  };

  const guide = difficultyGuides[difficulty] || difficultyGuides.intermediate;
  const targetWordsStr = targetWords.join('、');
  const knownWordsStr = knownWords.length > 0 ? knownWords.join('、') : '无';

  return `作为一名专业的中文教师，请创作一个自然流畅的中文学习故事。

【目标词汇】（必须全部使用）
${targetWordsStr}

【难度级别】
${guide.level}

【创作要求】
1. **理解词义**：请先理解每个词的真实含义、词性和常见用法
2. **创作故事**：根据这些词创作一个完整、连贯、有趣的故事
3. **词汇要求**：
   - 🔴 **必须使用所有目标词汇**（每个词用一次）
   - ✅ 可以自由使用其他任何中文词汇
   - ✅ 优先考虑故事的流畅性和可读性
4. **自然流畅**：
   - 句子要通顺、语法要正确
   - 故事要有逻辑、有画面感、有趣味
   - 让读者享受阅读的同时学习新词
5. **句子结构**：${guide.structure}
6. **故事长度**：${guide.length}左右

【格式要求】
- 第一行：英文标题（如 "A Day at School" 或 "Weekend Adventure"）
- 空一行
- 中文故事正文（分2-3个自然段，有完整的情节）
- 空一行  
- 最后一行：英文鼓励语（如 "Great work! Keep practicing!"）

【质量检查】
- ✓ 所有目标词汇都使用了吗？
- ✓ 故事是否通顺、自然、有趣？
- ✓ 句子语法是否正确？
- ✓ 是否像真实的中文文章一样流畅？

请现在开始创作：`;
}

module.exports = {
  generateChineseStory
};

