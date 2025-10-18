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
 * @param {Array} words - 要学习的中文单词数组
 * @param {String} difficulty - 难度级别 (beginner/intermediate/advanced)
 * @returns {Promise<String>} 生成的文章内容
 */
async function generateChineseStory(words, difficulty = 'intermediate') {
  // 优先使用AI生成
  if (USE_DEEPSEEK && DEEPSEEK_API_KEY) {
    return await generateWithDeepSeek(words, difficulty);
  } else if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here') {
    return await generateWithOpenAI(words, difficulty);
  }
  
  // 如果没有配置AI，返回提示信息引导配置
  console.log('⚠️  No AI API configured. To generate truly natural stories, please configure OpenAI or DeepSeek API key.');
  console.log('📖 Current: Using random story templates');
  
  return generateLocalStory(words, difficulty);
}

/**
 * 使用OpenAI生成故事
 */
async function generateWithOpenAI(words, difficulty) {
  try {
    const prompt = buildPrompt(words, difficulty);
    
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
    console.error('❌ OpenAI API failed:', error.message);
    return generateLocalStory(words, difficulty);
  }
}

/**
 * 使用DeepSeek生成故事（专门优化中文，更便宜）
 */
async function generateWithDeepSeek(words, difficulty) {
  try {
    const prompt = buildPrompt(words, difficulty);
    
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
    console.error('❌ DeepSeek API failed:', error.message);
    return generateLocalStory(words, difficulty);
  }
}

/**
 * 构建AI提示词 - 优化版，让AI真正理解每个词并创作自然的故事
 */
function buildPrompt(words, difficulty) {
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
  const wordsWithComma = words.join('、');

  return `作为一名专业的中文教师，请根据以下词汇创作一个自然流畅的中文学习故事。

【目标词汇】
${wordsWithComma}

【难度级别】
${guide.level}

【创作要求】
1. **理解词义**：请先理解每个词的真实含义、词性（动词/名词/形容词等）和常见用法
2. **创作故事**：根据这些词的实际含义，创作一个完整、连贯、有趣的故事
3. **自然融入**：让每个词在故事中的使用都符合中文语法和语境，读起来自然流畅
4. **不要机械**：不要简单地列举词汇或使用固定模板，要像真正写作一样
5. **句子结构**：${guide.structure}
6. **词汇要求**：除了目标词汇，其他词汇应该是${guide.vocabulary}
7. **故事长度**：${guide.length}左右

【格式要求】
- 第一行：英文标题（如 "A Trip to Beijing" 或 "Weekend Coffee Time"）
- 空一行
- 中文故事正文（分2-3个自然段）
- 空一行  
- 最后一行：英文鼓励语（如 "Great work! Keep practicing!"）

【重要提示】
- 每个目标词汇必须使用，但只使用一次
- 故事要有情节、有画面感
- 确保语法正确、语言通顺
- 让读者在享受故事的同时自然地学习这些词

请现在开始创作：`;
}

/**
 * 本地故事生成（当AI不可用时使用）
 * 使用多样化的模板，每次生成不同的故事
 */
function generateLocalStory(words, difficulty) {
  const wordsList = words.join('、');
  
  // 为每个难度级别准备多个故事模板
  const storyTemplates = {
    beginner: [
      // 模板1: 第一天
      () => `My First Day (我的第一天)\n\n` +
        `大家好！我叫小明，今天是我第一天学中文。\n\n` +
        `老师教我们这些新词：${wordsList}。老师说这些词很有用！\n\n` +
        `我会努力学习。现在我已经会说一些简单的话了。我很开心！\n\n` +
        `明天我还要继续学习更多的中文词汇。\n\n` +
        `Great work! (做得好！) Keep practicing!`,
      
      // 模板2: 在公园
      () => `A Day at the Park (公园的一天)\n\n` +
        `今天天气很好。我去公园玩。\n\n` +
        `在公园里，我看到很多人。我学到了新词：${wordsList}。\n\n` +
        `我用这些新词和别人说话。大家都很友好。我很开心！\n\n` +
        `学中文真有趣！\n\n` +
        `Well done! (很好！) Practice makes perfect!`,
      
      // 模板3: 购物
      () => `Going Shopping (去购物)\n\n` +
        `今天我去商店买东西。\n\n` +
        `我用中文说话。我用到这些词：${wordsList}。\n\n` +
        `店员听懂了！我很高兴。我的中文进步了！\n\n` +
        `我会继续学习。\n\n` +
        `Excellent! (太棒了！) You're doing great!`
    ],
    
    intermediate: [
      // 模板1: 周末活动
      () => `周末的咖啡时光\n\n` +
        `这个周末，我和朋友在咖啡馆见面。我们聊了很多话题。\n\n` +
        `我们谈到了这些内容：${wordsList}。每个话题都很有趣。\n\n` +
        `朋友分享了他的经验，我也讲述了自己的故事。通过交流，我学到了这些词的实际用法。\n\n` +
        `咖啡馆里的气氛很温馨。我们约定下次继续用中文聊天，互相帮助提高。\n\n` +
        `这个下午过得很充实。用中文交流真的很有成就感！\n\n` +
        `Keep it up! (继续加油！) Your Chinese is improving!`,
      
      // 模板2: 旅行经历
      () => `难忘的旅行\n\n` +
        `上个月，我去了北京旅游。这次旅行让我有机会实践中文。\n\n` +
        `在旅途中，我遇到了很多场景需要用到这些词：${wordsList}。每次成功地用中文沟通，我都很兴奋。\n\n` +
        `我和当地人聊天，去市场买东西，在餐厅点菜。虽然有时候会说错，但大家都很耐心地帮助我。\n\n` +
        `这次经历让我明白，学习语言最好的方式就是实际使用。回来后，我更有动力继续学习中文了。\n\n` +
        `Fantastic! (太棒了！) Real-world practice is the best!`,
      
      // 模板3: 文化体验
      () => `中国文化体验\n\n` +
        `最近，我参加了一个中国文化活动。这个经历很特别。\n\n` +
        `活动中接触到很多新概念：${wordsList}。通过实际体验，我更深刻地理解了这些词的含义。\n\n` +
        `我发现，学习一门语言的同时也在学习一种文化。每个词背后都有丰富的故事和传统。\n\n` +
        `这种文化沉浸式的学习方法让我受益匪浅。我不仅记住了这些词，还理解了它们的文化背景。\n\n` +
        `Wonderful! (真棒！) Culture and language go hand in hand!`
    ],
    
    advanced: [
      // 模板1: 学术思考
      () => `语言与思维\n\n` +
        `在研究中文的过程中，我开始思考语言与思维方式之间的关系。\n\n` +
        `本周重点学习的词汇是：${wordsList}。这些词汇不仅是语言符号，更是思维模式的体现。\n\n` +
        `中文的特点在于它的意境和含蓄。同一个词在不同的语境中能产生截然不同的意义。这种语义的灵活性体现了中文思维的辩证性和整体性。\n\n` +
        `通过深入分析这些词汇的用法，我逐渐理解了中文表达的精妙之处。每一次对词义的新理解，都是对中国文化和哲学的进一步认识。\n\n` +
        `Outstanding! (杰出！) You're truly understanding Chinese at a deep level!`,
      
      // 模板2: 文化探索
      () => `跨文化的桥梁\n\n` +
        `学习中文的这段时间，我逐渐意识到语言是连接不同文化的桥梁。\n\n` +
        `深入研究这些词汇：${wordsList}，我发现每个词都蕴含着独特的文化密码。它们不仅传递信息，更承载着几千年的文明积淀。\n\n` +
        `比较中西方对这些概念的不同理解，我看到了思维方式的差异。这种差异不是障碍，而是让我以全新视角看世界的机会。\n\n` +
        `语言学习已经超越了简单的词汇记忆，成为了一场文化的探索之旅。每掌握一个词，就像打开了一扇通往新世界的门。\n\n` +
        `Impressive! (令人印象深刻！) You're bridging cultures through language!`,
      
      // 模板3: 哲学思考  
      () => `词汇的力量\n\n` +
        `语言哲学告诉我们，词汇不仅是表达工具，更塑造着我们的思维方式。\n\n` +
        `在学习这组词汇：${wordsList}的过程中，我深刻体会到了这一点。每个中文词都有其独特的语义场和文化内涵。\n\n` +
        `中文的象形文字起源使得每个字都承载着视觉和概念的双重意义。这种特性让中文的表达既具体又抽象，既直观又深邃。\n\n` +
        `通过系统学习和反复推敲，我开始能够体会到这些词汇在不同语境中的微妙差异。这个过程不仅提升了语言能力，更拓展了认知的边界。\n\n` +
        `Brilliant! (精彩！) Your philosophical approach to learning is remarkable!`
    ]
  };

  // 随机选择一个模板，确保每次生成不同的文章
  const templates = storyTemplates[difficulty] || storyTemplates.intermediate;
  const randomIndex = Math.floor(Math.random() * templates.length);
  const selectedTemplate = templates[randomIndex];
  
  return selectedTemplate();
}

module.exports = {
  generateChineseStory
};

