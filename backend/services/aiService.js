const axios = require("axios");

/**
 * AI文章生成服务
 * 使用OpenAI API生成自然流畅的中文学习文章
 */

// 支持多个AI提供商
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY; // DeepSeek支持中文，更便宜
const USE_DEEPSEEK = process.env.USE_DEEPSEEK === "true";

/**
 * 使用AI生成中文学习文章
 * @param {Array} targetWords - 要学习的新单词数组（必须出现）
 * @param {Array} knownWords - 用户已学过的单词数组（建议使用）
 * @param {String} difficulty - 难度级别 (beginner/intermediate/advanced)
 * @returns {Promise<String>} 生成的文章内容
 */
async function generateChineseStory(
  targetWords,
  knownWords = [],
  difficulty = "intermediate"
) {
  // 优先使用AI生成
  if (USE_DEEPSEEK && DEEPSEEK_API_KEY) {
    return await generateWithDeepSeek(targetWords, knownWords, difficulty);
  } else if (OPENAI_API_KEY && OPENAI_API_KEY !== "your_openai_api_key_here") {
    return await generateWithOpenAI(targetWords, knownWords, difficulty);
  }

  // 如果没有配置AI，抛出错误
  console.log("❌ No AI API configured.");
  throw new Error(
    "AI API is required for story generation. Please configure DEEPSEEK_API_KEY or OPENAI_API_KEY in .env file."
  );
}

/**
 * 使用OpenAI生成故事
 */
async function generateWithOpenAI(targetWords, knownWords, difficulty) {
  try {
    const prompt = buildPrompt(targetWords, knownWords, difficulty);

    console.log("🤖 Calling OpenAI API to generate story...");

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini", // 使用更好的模型
        messages: [
          {
            role: "system",
            content:
              "你是一位经验丰富的中文教师，擅长为外国学生创作生动、自然、有趣的中文学习故事。你深刻理解每个中文词的用法和文化背景，能够将词汇完美地融入到连贯的故事中。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8, // 提高创造性
        max_tokens: 600,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("✅ OpenAI story generated successfully");
    let content = response.data.choices[0].message.content;

    // 验证是否包含英文翻译，如果没有则补全
    content = await ensureEnglishTranslations(
      content,
      targetWords,
      knownWords,
      difficulty
    );

    return content;
  } catch (error) {
    console.error(
      "❌ OpenAI API failed:",
      error.response?.data || error.message
    );
    throw new Error(
      "OpenAI API failed: " +
        (error.response?.data?.error?.message || error.message)
    );
  }
}

/**
 * 使用DeepSeek生成故事（专门优化中文，更便宜）
 */
async function generateWithDeepSeek(targetWords, knownWords, difficulty) {
  try {
    const prompt = buildPrompt(targetWords, knownWords, difficulty);

    console.log("🤖 Calling DeepSeek API to generate story...");

    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "你是一位经验丰富的中文教师，擅长为外国学生创作生动、自然、有趣的中文学习故事。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 600,
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("✅ DeepSeek story generated successfully");
    let content = response.data.choices[0].message.content;

    // 验证是否包含英文翻译，如果没有则补全
    content = await ensureEnglishTranslations(
      content,
      targetWords,
      knownWords,
      difficulty
    );

    return content;
  } catch (error) {
    console.error(
      "❌ DeepSeek API failed:",
      error.response?.data || error.message
    );
    throw new Error(
      "DeepSeek API failed: " +
        (error.response?.data?.error?.message || error.message)
    );
  }
}

/**
 * 确保文章包含英文翻译，如果没有则补全
 */
async function ensureEnglishTranslations(
  content,
  targetWords,
  knownWords,
  difficulty
) {
  // 检查是否包含 "English:" 标记
  const hasEnglishMark = /English:\s*.+/i.test(content);

  if (hasEnglishMark) {
    console.log("✅ Article already contains English translations");
    return content;
  }

  console.log("⚠️ Article missing English translations, generating them...");

  // 提取中文段落（排除标题和鼓励语）
  const lines = content.split("\n");
  const chineseParagraphs = [];
  let currentParagraph = [];
  let foundFirstChinese = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentParagraph.length > 0 && foundFirstChinese) {
        chineseParagraphs.push(currentParagraph.join("\n"));
        currentParagraph = [];
      }
      continue;
    }

    // 跳过英文标题（第一行）
    if (!foundFirstChinese && !/[\u4e00-\u9fa5]/.test(trimmed)) {
      continue;
    }

    // 跳过鼓励语
    const isEncouragement = /Great|Keep|Well|Excellent|Congratulations/i.test(
      trimmed
    );
    if (isEncouragement) {
      continue;
    }

    if (/[\u4e00-\u9fa5]/.test(trimmed)) {
      foundFirstChinese = true;
      currentParagraph.push(trimmed);
    } else if (currentParagraph.length > 0) {
      // 英文行，如果是段落分隔，保存当前段落
      if (trimmed.length > 20) {
        chineseParagraphs.push(currentParagraph.join("\n"));
        currentParagraph = [];
      }
    }
  }

  if (currentParagraph.length > 0) {
    chineseParagraphs.push(currentParagraph.join("\n"));
  }

  if (chineseParagraphs.length === 0) {
    console.log("⚠️ No Chinese paragraphs found, returning original content");
    return content;
  }

  // 为每个中文段落生成英文翻译
  const translatedParagraphs = [];
  for (const para of chineseParagraphs) {
    try {
      const translation = await generateTranslation(para);
      translatedParagraphs.push({ chinese: para, english: translation });
    } catch (error) {
      console.error("❌ Failed to generate translation:", error);
      translatedParagraphs.push({ chinese: para, english: "" });
    }
  }

  // 重新构建内容，插入英文翻译
  const title =
    lines.find((line) => line.trim() && !/[\u4e00-\u9fa5]/.test(line.trim())) ||
    "";
  const encouragement =
    lines.find((line) => {
      const trimmed = line.trim();
      return /Great|Keep|Well|Excellent|Congratulations/i.test(trimmed);
    }) || "Great work! Keep practicing!";

  let newContent = title + "\n\n";

  for (const { chinese, english } of translatedParagraphs) {
    newContent += chinese + "\n\n";
    if (english) {
      newContent += "English: " + english + "\n\n";
    }
  }

  newContent += encouragement;

  console.log("✅ English translations added successfully");
  return newContent;
}

/**
 * 生成中文段落的英文翻译
 */
async function generateTranslation(chineseText) {
  const apiKey = USE_DEEPSEEK ? DEEPSEEK_API_KEY : OPENAI_API_KEY;
  const apiUrl = USE_DEEPSEEK
    ? "https://api.deepseek.com/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const model = USE_DEEPSEEK ? "deepseek-chat" : "gpt-4o-mini";

  const prompt = `请将以下中文段落翻译成英文。要求：
1. 翻译要准确、自然、流畅
2. 保持原文的语气和风格
3. 只返回翻译结果，不要添加任何其他内容

中文段落：
${chineseText}

英文翻译：`;

  try {
    const response = await axios.post(
      apiUrl,
      {
        model: model,
        messages: [
          {
            role: "system",
            content:
              "You are a professional translator specializing in Chinese-English translation for language learners.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Translation API error:", error.message);
    throw error;
  }
}

/**
 * 构建AI提示词 - 优化版，让AI真正理解每个词并创作自然的故事
 */
function buildPrompt(targetWords, knownWords, difficulty) {
  const difficultyGuides = {
    beginner: {
      level: "初级（HSK 1-2级）",
      structure: "使用简单句，主谓宾结构，每句5-10个字",
      vocabulary: "只使用最基础的常用词汇",
      length: "100-150字",
    },
    intermediate: {
      level: "中级（HSK 3-4级）",
      structure: "可以使用复句，适当的连接词，每句10-20个字",
      vocabulary: "日常生活常用词汇",
      length: "200-300字",
    },
    advanced: {
      level: "高级（HSK 5-6级）",
      structure: "使用书面语、成语、复杂句式",
      vocabulary: "书面语、专业词汇",
      length: "300-400字",
    },
  };

  const guide = difficultyGuides[difficulty] || difficultyGuides.intermediate;
  const targetWordsStr = targetWords.join("、");
  const knownWordsStr = knownWords.length > 0 ? knownWords.join("、") : "无";

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

【格式要求】⚠️ 必须严格遵守以下格式：
- 第一行：英文标题（如 "A Day at School" 或 "Weekend Adventure"）
- 空一行
- 中文故事正文（分2-3个自然段，有完整的情节）
- 🔴 **在每个中文段落后，必须立即添加对应的英文翻译**（格式：空一行，然后 "English: [英文翻译]"）
- 空一行  
- 最后一行：英文鼓励语（如 "Great work! Keep practicing!"）

⚠️ **重要：每个中文段落后面都必须有 "English: [英文翻译]" 这一行！这是必需的！**

示例格式：
A Day at School

今天我去学校。我学习中文。老师很好。

English: Today I went to school. I studied Chinese. The teacher was very nice.

我很开心。我学到了新词。

English: I was very happy. I learned new words.

Great work! Keep practicing!

【质量检查】
- ✓ 所有目标词汇都使用了吗？
- ✓ 故事是否通顺、自然、有趣？
- ✓ 句子语法是否正确？
- ✓ 是否像真实的中文文章一样流畅？

请现在开始创作：`;
}

/**
 * 生成单词的组词和例句
 * @param {String} word - 中文单字
 * @param {String} pinyin - 拼音
 * @param {String} translation - 英文翻译
 * @returns {Promise<Object>} { compounds: Array, examples: Array }
 */
async function generateWordDetails(word, pinyin, translation) {
  try {
    const prompt = `请为中文字"${word}"（拼音：${pinyin}，英文：${translation}）生成学习材料。

【要求】
1. **组词（3-5个）**：用这个字组成常用词汇
   - 每个词组包含2-3个字
   - 提供拼音（用空格分隔音节，带声调符号）
   - 提供英文释义
   
2. **例句（2个）**：简单实用的句子
   - 每个句子10-15个字
   - 句子要简单、实用、生活化
   - 提供拼音（用空格分隔每个字的音节）
   - 提供英文翻译

【输出格式】（严格JSON格式，不要其他内容）
{
  "compounds": [
    {"word": "学生", "pinyin": "xué shēng", "meaning": "student"},
    {"word": "学习", "pinyin": "xué xí", "meaning": "to study"}
  ],
  "examples": [
    {
      "chinese": "我在学校学习中文。",
      "pinyin": "wǒ zài xué xiào xué xí zhōng wén",
      "english": "I study Chinese at school."
    }
  ]
}

请生成：`;

    let response;
    if (USE_DEEPSEEK && DEEPSEEK_API_KEY) {
      console.log(`🤖 Calling DeepSeek to generate details for "${word}"...`);
      response = await axios.post(
        "https://api.deepseek.com/v1/chat/completions",
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "你是一位专业的中文教师。请严格按照JSON格式返回数据，不要添加任何其他文字说明。",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        },
        {
          headers: {
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );
    } else if (
      OPENAI_API_KEY &&
      OPENAI_API_KEY !== "your_openai_api_key_here"
    ) {
      console.log(`🤖 Calling OpenAI to generate details for "${word}"...`);
      response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "你是一位专业的中文教师。请严格按照JSON格式返回数据，不要添加任何其他文字说明。",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );
    } else {
      throw new Error("No AI API configured");
    }

    const content = response.data.choices[0].message.content.trim();

    // 尝试提取JSON（去除可能的markdown代码块标记）
    let jsonContent = content;
    if (content.includes("```json")) {
      jsonContent = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      jsonContent = content.split("```")[1].split("```")[0].trim();
    }

    const result = JSON.parse(jsonContent);
    console.log(
      `✅ Generated ${result.compounds?.length || 0} compounds and ${
        result.examples?.length || 0
      } examples for "${word}"`
    );

    return result;
  } catch (error) {
    console.error(
      "❌ Failed to generate word details:",
      error.response?.data || error.message
    );
    // 返回空结果而不是抛出错误
    return {
      compounds: [],
      examples: [],
    };
  }
}

module.exports = {
  generateChineseStory,
  generateWordDetails,
};
