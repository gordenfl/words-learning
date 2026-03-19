/**
 * 祝贺语服务 - 支持 AI 生成与本地回退，可在多处复用
 */
import { wordsAPI } from "./api";

/** 本地回退短语（AI 不可用时使用） */
export const FALLBACK_PHRASES = [
  "Congratulations on your achievement!",
  "You did it! I'm so proud of you.",
  "All your hard work has finally paid off!",
  "I knew you could do it. Your dedication is inspiring.",
  "Kudos on a job well done!",
  "This is a significant milestone. Well deserved!",
  "Way to go!",
  "You crushed it!",
  "Bravo! That was an incredible feat.",
  "Hats off to you for finishing this!",
  "Congratulations on your well-deserved success!",
  "You've worked so hard for this, and it shows.",
  "Huge congrats on crossing the finish line!",
  "You absolutely nailed it!",
  "I'm thrilled to see you achieve this goal.",
  "What a fantastic accomplishment!",
  "You make it look easy, but I know how much effort you put in.",
  "So happy to share in the excitement of your big news!",
  "You've really outdone yourself this time.",
  "This is just the beginning of many more successes to come.",
  "Cheers to your brilliant achievement!",
  "I never doubted you for a second.",
  "You should be incredibly proud of what you've done.",
  "Sensational job on completing this!",
  "Your perseverance has truly paid off.",
  "Simply amazing work!",
  "You've set the bar so high with this one.",
  "High five on a job well done!",
  "It's inspiring to see you reach this milestone.",
  "Keep up the incredible work!",
  "Hard work looks good on you, congrats!",
  "I'm over the moon for your success!",
  "You made it happen through sheer determination.",
  "That's a massive win, well done!",
  "You've got every reason to celebrate today.",
  "Your commitment to this project was top-notch.",
  "This is a huge feather in your cap!",
  "You've proved that anything is possible with focus.",
  "I'm so impressed by what you've achieved.",
  "You deserve a standing ovation for this!",
  "Your success is so well-earned.",
  "It's been a joy watching you reach this goal.",
  "You've really made your mark with this one.",
  "Cheers to your incredible dedication!",
  "You came, you saw, you conquered!",
  "I'm bursting with pride for you.",
  "This is just one of many greatnesses in your future.",
  "You handled that like a total pro.",
  "Simply brilliant – you did a stellar job!",
];

let _cachedPhrase = null;
let _fetchPromise = null;

function _getRandomFallback() {
  return FALLBACK_PHRASES[Math.floor(Math.random() * FALLBACK_PHRASES.length)];
}

/**
 * 每次调用都从句子库随机选一条（不缓存）
 * 适用于书写练习等需要多次、每次不同祝贺语的场景
 * @returns {string}
 */
export function getRandomCongratsPhrase() {
  return _getRandomFallback();
}

/**
 * 预取祝贺语（后台发起 AI 请求，不阻塞）
 * 建议在用户进入相关页面时尽早调用，以便完成时已有结果
 */
export function prefetchCongrats() {
  if (_cachedPhrase || _fetchPromise) return;
  _fetchPromise = wordsAPI
    .generateCongrats()
    .then(({ data }) => {
      if (data?.phrase?.trim()) {
        _cachedPhrase = data.phrase.trim();
      }
    })
    .catch(() => {})
    .finally(() => {
      _fetchPromise = null;
    });
}

/**
 * 获取祝贺语（优先 AI 生成，失败则随机回退）
 * @returns {Promise<string>}
 */
export async function getCongratsPhrase() {
  if (_cachedPhrase) return _cachedPhrase;
  if (_fetchPromise) {
    await _fetchPromise;
    if (_cachedPhrase) return _cachedPhrase;
  }
  prefetchCongrats();
  if (_fetchPromise) {
    await _fetchPromise;
    if (_cachedPhrase) return _cachedPhrase;
  }
  return _getRandomFallback();
}

/**
 * 同步获取已缓存的祝贺语或随机回退（不发起请求）
 * 适用于已调用 prefetchCongrats 且需要立即取值的场景
 * @returns {string}
 */
export function getCongratsPhraseSync() {
  return _cachedPhrase || _getRandomFallback();
}
