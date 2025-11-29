const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(__dirname, '../../.env') });
}

const PinyinLesson = require('../models/PinyinLesson');

// 声母数据
const initials = [
  {
    pinyin: 'b',
    displayName: 'b',
    examples: [
      { word: '爸', pinyin: 'bà', meaning: 'father' },
      { word: '不', pinyin: 'bù', meaning: 'not' },
      { word: '白', pinyin: 'bái', meaning: 'white' }
    ],
    commonMistakes: [
      { mistake: 'p', explanation: '注意区分 b（不送气）和 p（送气）' }
    ],
    order: 1
  },
  {
    pinyin: 'p',
    displayName: 'p',
    examples: [
      { word: '怕', pinyin: 'pà', meaning: 'afraid' },
      { word: '跑', pinyin: 'pǎo', meaning: 'run' },
      { word: '平', pinyin: 'píng', meaning: 'flat' }
    ],
    commonMistakes: [
      { mistake: 'b', explanation: '注意区分 p（送气）和 b（不送气）' }
    ],
    order: 2
  },
  {
    pinyin: 'm',
    displayName: 'm',
    examples: [
      { word: '妈', pinyin: 'mā', meaning: 'mother' },
      { word: '门', pinyin: 'mén', meaning: 'door' },
      { word: '美', pinyin: 'měi', meaning: 'beautiful' }
    ],
    commonMistakes: [],
    order: 3
  },
  {
    pinyin: 'f',
    displayName: 'f',
    examples: [
      { word: '发', pinyin: 'fā', meaning: 'send' },
      { word: '飞', pinyin: 'fēi', meaning: 'fly' },
      { word: '风', pinyin: 'fēng', meaning: 'wind' }
    ],
    commonMistakes: [],
    order: 4
  },
  {
    pinyin: 'd',
    displayName: 'd',
    examples: [
      { word: '大', pinyin: 'dà', meaning: 'big' },
      { word: '的', pinyin: 'de', meaning: 'of' },
      { word: '多', pinyin: 'duō', meaning: 'many' }
    ],
    commonMistakes: [
      { mistake: 't', explanation: '注意区分 d（不送气）和 t（送气）' }
    ],
    order: 5
  },
  {
    pinyin: 't',
    displayName: 't',
    examples: [
      { word: '他', pinyin: 'tā', meaning: 'he' },
      { word: '天', pinyin: 'tiān', meaning: 'sky' },
      { word: '听', pinyin: 'tīng', meaning: 'listen' }
    ],
    commonMistakes: [
      { mistake: 'd', explanation: '注意区分 t（送气）和 d（不送气）' }
    ],
    order: 6
  },
  {
    pinyin: 'n',
    displayName: 'n',
    examples: [
      { word: '你', pinyin: 'nǐ', meaning: 'you' },
      { word: '年', pinyin: 'nián', meaning: 'year' },
      { word: '女', pinyin: 'nǚ', meaning: 'female' }
    ],
    commonMistakes: [
      { mistake: 'l', explanation: '注意区分 n（鼻音）和 l（边音）' }
    ],
    order: 7
  },
  {
    pinyin: 'l',
    displayName: 'l',
    examples: [
      { word: '来', pinyin: 'lái', meaning: 'come' },
      { word: '老', pinyin: 'lǎo', meaning: 'old' },
      { word: '绿', pinyin: 'lǜ', meaning: 'green' }
    ],
    commonMistakes: [
      { mistake: 'n', explanation: '注意区分 l（边音）和 n（鼻音）' }
    ],
    order: 8
  },
  {
    pinyin: 'g',
    displayName: 'g',
    examples: [
      { word: '个', pinyin: 'gè', meaning: 'a' },
      { word: '高', pinyin: 'gāo', meaning: 'tall' },
      { word: '国', pinyin: 'guó', meaning: 'country' }
    ],
    commonMistakes: [
      { mistake: 'k', explanation: '注意区分 g（不送气）和 k（送气）' }
    ],
    order: 9
  },
  {
    pinyin: 'k',
    displayName: 'k',
    examples: [
      { word: '看', pinyin: 'kàn', meaning: 'look' },
      { word: '开', pinyin: 'kāi', meaning: 'open' },
      { word: '口', pinyin: 'kǒu', meaning: 'mouth' }
    ],
    commonMistakes: [
      { mistake: 'g', explanation: '注意区分 k（送气）和 g（不送气）' }
    ],
    order: 10
  },
  {
    pinyin: 'h',
    displayName: 'h',
    examples: [
      { word: '好', pinyin: 'hǎo', meaning: 'good' },
      { word: '和', pinyin: 'hé', meaning: 'and' },
      { word: '红', pinyin: 'hóng', meaning: 'red' }
    ],
    commonMistakes: [],
    order: 11
  },
  {
    pinyin: 'j',
    displayName: 'j',
    examples: [
      { word: '家', pinyin: 'jiā', meaning: 'home' },
      { word: '见', pinyin: 'jiàn', meaning: 'see' },
      { word: '今', pinyin: 'jīn', meaning: 'today' }
    ],
    commonMistakes: [
      { mistake: 'q', explanation: '注意区分 j（不送气）和 q（送气）' },
      { mistake: 'zh', explanation: '注意区分 j（舌面音）和 zh（舌尖后音）' }
    ],
    order: 12
  },
  {
    pinyin: 'q',
    displayName: 'q',
    examples: [
      { word: '去', pinyin: 'qù', meaning: 'go' },
      { word: '前', pinyin: 'qián', meaning: 'front' },
      { word: '请', pinyin: 'qǐng', meaning: 'please' }
    ],
    commonMistakes: [
      { mistake: 'j', explanation: '注意区分 q（送气）和 j（不送气）' },
      { mistake: 'ch', explanation: '注意区分 q（舌面音）和 ch（舌尖后音）' }
    ],
    order: 13
  },
  {
    pinyin: 'x',
    displayName: 'x',
    examples: [
      { word: '小', pinyin: 'xiǎo', meaning: 'small' },
      { word: '学', pinyin: 'xué', meaning: 'learn' },
      { word: '新', pinyin: 'xīn', meaning: 'new' }
    ],
    commonMistakes: [
      { mistake: 'sh', explanation: '注意区分 x（舌面音）和 sh（舌尖后音）' }
    ],
    order: 14
  },
  {
    pinyin: 'zh',
    displayName: 'zh',
    examples: [
      { word: '这', pinyin: 'zhè', meaning: 'this' },
      { word: '中', pinyin: 'zhōng', meaning: 'middle' },
      { word: '知', pinyin: 'zhī', meaning: 'know' }
    ],
    commonMistakes: [
      { mistake: 'z', explanation: '注意区分 zh（卷舌音）和 z（平舌音）' },
      { mistake: 'j', explanation: '注意区分 zh（舌尖后音）和 j（舌面音）' }
    ],
    order: 15
  },
  {
    pinyin: 'ch',
    displayName: 'ch',
    examples: [
      { word: '吃', pinyin: 'chī', meaning: 'eat' },
      { word: '车', pinyin: 'chē', meaning: 'car' },
      { word: '出', pinyin: 'chū', meaning: 'out' }
    ],
    commonMistakes: [
      { mistake: 'c', explanation: '注意区分 ch（卷舌音）和 c（平舌音）' },
      { mistake: 'q', explanation: '注意区分 ch（舌尖后音）和 q（舌面音）' }
    ],
    order: 16
  },
  {
    pinyin: 'sh',
    displayName: 'sh',
    examples: [
      { word: '是', pinyin: 'shì', meaning: 'be' },
      { word: '上', pinyin: 'shàng', meaning: 'up' },
      { word: '说', pinyin: 'shuō', meaning: 'speak' }
    ],
    commonMistakes: [
      { mistake: 's', explanation: '注意区分 sh（卷舌音）和 s（平舌音）' },
      { mistake: 'x', explanation: '注意区分 sh（舌尖后音）和 x（舌面音）' }
    ],
    order: 17
  },
  {
    pinyin: 'r',
    displayName: 'r',
    examples: [
      { word: '人', pinyin: 'rén', meaning: 'person' },
      { word: '日', pinyin: 'rì', meaning: 'day' },
      { word: '热', pinyin: 'rè', meaning: 'hot' }
    ],
    commonMistakes: [],
    order: 18
  },
  {
    pinyin: 'z',
    displayName: 'z',
    examples: [
      { word: '在', pinyin: 'zài', meaning: 'at' },
      { word: '字', pinyin: 'zì', meaning: 'character' },
      { word: '走', pinyin: 'zǒu', meaning: 'walk' }
    ],
    commonMistakes: [
      { mistake: 'zh', explanation: '注意区分 z（平舌音）和 zh（卷舌音）' }
    ],
    order: 19
  },
  {
    pinyin: 'c',
    displayName: 'c',
    examples: [
      { word: '从', pinyin: 'cóng', meaning: 'from' },
      { word: '次', pinyin: 'cì', meaning: 'time' },
      { word: '草', pinyin: 'cǎo', meaning: 'grass' }
    ],
    commonMistakes: [
      { mistake: 'ch', explanation: '注意区分 c（平舌音）和 ch（卷舌音）' }
    ],
    order: 20
  },
  {
    pinyin: 's',
    displayName: 's',
    examples: [
      { word: '三', pinyin: 'sān', meaning: 'three' },
      { word: '四', pinyin: 'sì', meaning: 'four' },
      { word: '色', pinyin: 'sè', meaning: 'color' }
    ],
    commonMistakes: [
      { mistake: 'sh', explanation: '注意区分 s（平舌音）和 sh（卷舌音）' }
    ],
    order: 21
  },
  {
    pinyin: 'y',
    displayName: 'y (半元音)',
    examples: [
      { word: '一', pinyin: 'yī', meaning: 'one' },
      { word: '有', pinyin: 'yǒu', meaning: 'have' },
      { word: '也', pinyin: 'yě', meaning: 'also' }
    ],
    commonMistakes: [],
    order: 22
  },
  {
    pinyin: 'w',
    displayName: 'w (半元音)',
    examples: [
      { word: '我', pinyin: 'wǒ', meaning: 'I' },
      { word: '为', pinyin: 'wèi', meaning: 'for' },
      { word: '问', pinyin: 'wèn', meaning: 'ask' }
    ],
    commonMistakes: [],
    order: 23
  }
];

async function initPinyinLessons() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/words-learning';
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing initial lessons
    await PinyinLesson.deleteMany({ type: 'initial' });
    console.log('🗑️  Cleared existing initial lessons');

    // Insert new initial lessons
    const lessonsToInsert = initials.map(initial => ({
      type: 'initial',
      pinyin: initial.pinyin,
      displayName: initial.displayName,
      examples: initial.examples,
      commonMistakes: initial.commonMistakes,
      difficulty: 'beginner',
      order: initial.order,
      enabled: true,
    }));

    const result = await PinyinLesson.insertMany(lessonsToInsert);
    console.log(`✅ Inserted ${result.length} initial lessons`);

    // Print summary
    console.log('\n📊 Summary:');
    console.log(`   Total initials: ${result.length}`);
    result.forEach((lesson, index) => {
      console.log(`   ${index + 1}. ${lesson.pinyin} - ${lesson.displayName}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing pinyin lessons:', error);
    process.exit(1);
  }
}

// Run the script
initPinyinLessons();

