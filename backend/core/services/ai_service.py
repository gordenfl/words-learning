"""AI service - story generation and word details (OpenAI / DeepSeek). Same logic as Node."""
import json
import os
import re
import requests

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
USE_DEEPSEEK = os.environ.get("USE_DEEPSEEK", "").lower() == "true"


def _build_prompt(target_words, known_words, difficulty):
    guides = {
        "beginner": {
            "level": "初级（HSK 1-2级）",
            "structure": "使用简单句，主谓宾结构，每句5-10个字",
            "length": "100-150字",
        },
        "intermediate": {
            "level": "中级（HSK 3-4级）",
            "structure": "可以使用复句，适当的连接词，每句10-20个字",
            "length": "200-300字",
        },
        "advanced": {
            "level": "高级（HSK 5-6级）",
            "structure": "使用书面语、成语、复杂句式",
            "length": "300-400字",
        },
    }
    guide = guides.get(difficulty) or guides["intermediate"]
    target_str = "、".join(target_words)
    known_str = "、".join(known_words) if known_words else "无"
    return f"""作为一名专业的中文教师，请创作一个自然流畅的中文学习故事。

【目标词汇】（必须全部使用）
{target_str}

【难度级别】
{guide["level"]}

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
5. **句子结构**：{guide["structure"]}
6. **故事长度**：{guide["length"]}左右

【格式要求】⚠️ 必须严格遵守以下格式：
- 第一行：英文标题（如 "A Day at School" 或 "Weekend Adventure"）
- 空一行
- 中文故事正文（分2-3个自然段，有完整的情节）
- 🔴 **在每个中文段落后，必须立即添加对应的英文翻译**（格式：空一行，然后 "English: [英文翻译]"）
- 空一行  
- 最后一行：英文鼓励语（如 "Great work! Keep practicing!"）

⚠️ **重要：每个中文段落后面都必须有 "English: [英文翻译]" 这一行！这是必需的！**

请现在开始创作："""


def generate_chinese_story(target_words, known_words=None, difficulty="intermediate"):
    if known_words is None:
        known_words = []
    if USE_DEEPSEEK and DEEPSEEK_API_KEY:
        return _generate_with_deepseek(target_words, known_words, difficulty)
    if OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_api_key_here":
        return _generate_with_openai(target_words, known_words, difficulty)
    raise ValueError(
        "AI API is required for story generation. Please configure DEEPSEEK_API_KEY or OPENAI_API_KEY in .env file."
    )


def _generate_with_openai(target_words, known_words, difficulty):
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    prompt = _build_prompt(target_words, known_words, difficulty)
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "你是一位经验丰富的中文教师，擅长为外国学生创作生动、自然、有趣的中文学习故事。你深刻理解每个中文词的用法和文化背景，能够将词汇完美地融入到连贯的故事中。"},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.8,
        "max_tokens": 600,
    }
    r = requests.post(url, json=payload, headers=headers, timeout=30)
    r.raise_for_status()
    content = r.json()["choices"][0]["message"]["content"]
    return _ensure_english_translations(content, target_words, known_words, difficulty)


def _generate_with_deepseek(target_words, known_words, difficulty):
    url = "https://api.deepseek.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"}
    prompt = _build_prompt(target_words, known_words, difficulty)
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "你是一位经验丰富的中文教师，擅长为外国学生创作生动、自然、有趣的中文学习故事。"},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.8,
        "max_tokens": 600,
    }
    r = requests.post(url, json=payload, headers=headers, timeout=30)
    r.raise_for_status()
    content = r.json()["choices"][0]["message"]["content"]
    return _ensure_english_translations(content, target_words, known_words, difficulty)


def _ensure_english_translations(content, target_words, known_words, difficulty):
    if re.search(r"English:\s*.+", content, re.I):
        return content
    lines = content.split("\n")
    chinese_paragraphs = []
    current = []
    found_first = False
    for line in lines:
        trimmed = line.strip()
        if not trimmed:
            if current and found_first:
                chinese_paragraphs.append("\n".join(current))
                current = []
            continue
        if not found_first and not re.search(r"[\u4e00-\u9fa5]", trimmed):
            continue
        if re.search(r"Great|Keep|Well|Excellent|Congratulations", trimmed, re.I):
            continue
        if re.search(r"[\u4e00-\u9fa5]", trimmed):
            found_first = True
            current.append(trimmed)
        elif current and len(trimmed) > 20:
            chinese_paragraphs.append("\n".join(current))
            current = []
    if current:
        chinese_paragraphs.append("\n".join(current))
    if not chinese_paragraphs:
        return content
    api_key = DEEPSEEK_API_KEY if USE_DEEPSEEK else OPENAI_API_KEY
    api_url = "https://api.deepseek.com/v1/chat/completions" if USE_DEEPSEEK else "https://api.openai.com/v1/chat/completions"
    model = "deepseek-chat" if USE_DEEPSEEK else "gpt-4o-mini"
    translated = []
    for para in chinese_paragraphs:
        try:
            t = _generate_translation(para, api_url, api_key, model)
            translated.append((para, t))
        except Exception:
            translated.append((para, ""))
    title = next((ln for ln in lines if ln.strip() and not re.search(r"[\u4e00-\u9fa5]", ln.strip())), "")
    encouragement = "Great work! Keep practicing!"
    new_content = title + "\n\n"
    for chinese, english in translated:
        new_content += chinese + "\n\n"
        if english:
            new_content += "English: " + english + "\n\n"
    new_content += encouragement
    return new_content


def _generate_translation(chinese_text, api_url, api_key, model):
    prompt = f"""请将以下中文段落翻译成英文。要求：
1. 翻译要准确、自然、流畅
2. 保持原文的语气和风格
3. 只返回翻译结果，不要添加任何其他内容

中文段落：
{chinese_text}

英文翻译："""
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a professional translator specializing in Chinese-English translation for language learners."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 200,
    }
    r = requests.post(api_url, json=payload, headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}, timeout=15)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()


def generate_word_details(word_text, pinyin="", translation=""):
    word_text = word_text or ""
    pinyin = pinyin or ""
    translation = translation or ""
    if not word_text:
        raise ValueError("Word text is required")
    prompt = f'请为中文字"{word_text}"'
    if pinyin:
        prompt += f"（拼音：{pinyin}）"
    if translation:
        prompt += f"（英文：{translation}）"
    prompt += """生成学习材料。

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

请生成："""
    if USE_DEEPSEEK and DEEPSEEK_API_KEY:
        url = "https://api.deepseek.com/v1/chat/completions"
        key = DEEPSEEK_API_KEY
        model = "deepseek-chat"
    elif OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_api_key_here":
        url = "https://api.openai.com/v1/chat/completions"
        key = OPENAI_API_KEY
        model = "gpt-4o-mini"
    else:
        raise ValueError("No AI API configured. Please set DEEPSEEK_API_KEY or OPENAI_API_KEY in environment variables.")
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "你是一位专业的中文教师。请严格按照JSON格式返回数据，不要添加任何其他文字说明。"},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 800,
    }
    r = requests.post(url, json=payload, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}, timeout=30)
    r.raise_for_status()
    raw = r.json()["choices"][0]["message"]["content"].strip()
    if not raw:
        raise ValueError("AI API returned empty content")
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()
    data = json.loads(raw)
    if not isinstance(data.get("compounds"), list):
        data["compounds"] = []
    if not isinstance(data.get("examples"), list):
        data["examples"] = []
    return data


def generate_congrats_phrase():
    """Generate a short, warm congratulatory phrase for completing writing practice."""
    prompt = """Generate ONE short, warm, encouraging English sentence to congratulate someone who just finished a Chinese character writing practice (10 rounds of stroke tracing). 
The tone should be celebratory, supportive, and genuine. Keep it under 15 words. 
Return ONLY the sentence, no quotes or extra text."""
    if USE_DEEPSEEK and DEEPSEEK_API_KEY:
        url = "https://api.deepseek.com/v1/chat/completions"
        key = DEEPSEEK_API_KEY
        model = "deepseek-chat"
    elif OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_api_key_here":
        url = "https://api.openai.com/v1/chat/completions"
        key = OPENAI_API_KEY
        model = "gpt-4o-mini"
    else:
        raise ValueError("No AI API configured.")
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You write brief, warm congratulatory messages for language learners."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.9,
        "max_tokens": 60,
    }
    r = requests.post(url, json=payload, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}, timeout=15)
    r.raise_for_status()
    content = r.json()["choices"][0]["message"]["content"].strip()
    return content.strip('"\'')
