const axios = require('axios');

/**
 * AI文章生成服务
 * 使用OpenAI API生成自然流畅的中文学习文章
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * 使用AI生成中文学习文章
 * @param {Array} words - 要学习的中文单词数组
 * @param {String} difficulty - 难度级别 (beginner/intermediate/advanced)
 * @returns {Promise<String>} 生成的文章内容
 */
async function generateChineseStory(words, difficulty = 'intermediate') {
  // 如果没有配置OpenAI API Key，使用本地模板
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    return generateLocalStory(words, difficulty);
  }

  try {
    const prompt = buildPrompt(words, difficulty);
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的中文老师，擅长创作适合外国学生学习的中文故事。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('AI generation failed, using local template:', error.message);
    // 如果AI调用失败，回退到本地模板
    return generateLocalStory(words, difficulty);
  }
}

/**
 * 构建AI提示词
 */
function buildPrompt(words, difficulty) {
  const difficultyDescriptions = {
    beginner: '初级水平，使用简单的句子结构，每个句子不超过10个字',
    intermediate: '中级水平，使用日常对话的句子结构，适当使用复句',
    advanced: '高级水平，使用复杂的句子结构和书面语'
  };

  const wordsList = words.join('、');
  const diffDesc = difficultyDescriptions[difficulty] || difficultyDescriptions.intermediate;

  return `请创作一篇${diffDesc}的中文短文，要求：

1. 必须自然地使用以下所有中文词汇：${wordsList}
2. 写成一个完整、连贯、有趣的小故事
3. 故事要通顺、符合中文语法习惯
4. 每个词只使用一次即可，不要重复
5. 故事长度：${difficulty === 'beginner' ? '5-8句话' : difficulty === 'intermediate' ? '8-12句话' : '12-15句话'}
6. 在故事开头用英文写一个标题，然后是中文故事内容
7. 故事结尾用英文加一句鼓励的话

请确保故事情节自然，读起来流畅，让学习者能够在有趣的故事中学习这些新词汇。`;
}

/**
 * 本地故事生成（当AI不可用时使用）
 */
function generateLocalStory(words, difficulty) {
  const wordsList = words.join('、');
  
  const stories = {
    beginner: () => {
      return `My First Day (我的第一天)\n\n` +
        `大家好！我叫小明，今天是我第一天学中文。\n\n` +
        `早上，老师教我们几个新词：${wordsList}。这些词很有用！\n\n` +
        `老师说，学习新语言要慢慢来。我会努力的。现在我已经会说一些简单的话了。\n\n` +
        `我很开心，因为我又学到了新的知识。明天我还要继续学习更多的中文词汇。\n\n` +
        `Great work! (做得好！) Keep practicing these basic words every day!`;
    },
    
    intermediate: () => {
      return `学习中文的故事\n\n` +
        `今天，我想和大家分享我学习中文的经历。\n\n` +
        `刚开始的时候，我觉得中文很难。但是慢慢地，我发现只要坚持每天学习，就会有进步。这次我学习的新词包括：${wordsList}。\n\n` +
        `这些词在日常生活中经常用到。比如，当我和中国朋友交流的时候，这些词能帮助我更好地表达自己的想法。我发现，理解每个词的真正含义和用法很重要。\n\n` +
        `现在，我每天都会用这些新学的词造句，写日记。虽然有时候还会犯错，但我的中文水平确实在提高。\n\n` +
        `我相信，只要继续努力，总有一天我能说一口流利的中文。学习语言是一个漫长的过程，但也是一段有趣的旅程。\n\n` +
        `Keep practicing! (继续加油！) You're making real progress!`;
    },
    
    advanced: () => {
      return `语言学习的思考\n\n` +
        `在探索中文学习的道路上，我逐渐认识到语言不仅仅是交流的工具，更是理解一种文化的窗口。\n\n` +
        `最近，我重点学习了以下词汇：${wordsList}。这些词汇看似简单，但每一个都承载着丰富的文化内涵。通过深入研究它们的用法和背景，我开始理解中文思维方式的独特之处。\n\n` +
        `中文的美妙在于它的简洁与深刻。同样的字在不同的语境中可以表达完全不同的含义。这种灵活性既是挑战，也是魅力所在。我发现，要真正掌握这些词汇，不能仅仅记住它们的字面意思，还要理解它们在不同场合的应用。\n\n` +
        `通过阅读、写作和实际交流，我逐步将这些词汇内化。每一次使用都是一次新的理解，每一次错误都是进步的机会。语言学习不是一蹴而就的，而是需要持续的投入和思考。\n\n` +
        `我相信，随着词汇量的积累和对语言理解的深化，我终将能够用中文自如地表达复杂的思想，真正融入这个语言所代表的文化世界。\n\n` +
        `Excellent! (非常好！) Your dedication to mastering Chinese is admirable!`;
    },
  };

  const generator = stories[difficulty] || stories.intermediate;
  return generator();
}

module.exports = {
  generateChineseStory
};

