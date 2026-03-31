/**
 * Map each final to four Chinese characters whose standard reading
 * demonstrates tones 1–4 on that final. Used for zh-CN SpeechSynthesis
 * (Latin pinyin like "ā" is often read as letters or digits).
 * Characters chosen from common textbook examples; TTS reads them as Mandarin words.
 */
const FINAL_TONE_CHARS = {
  // Zero-initial syllable a only (no m- 妈麻马骂): 阿(ā) 与 啊(á/ǎ/à 等) 均为韵母 a
  a: ["阿", "啊", "啊", "啊"],
  o: ["摸", "模", "抹", "墨"],
  e: ["唉", "鹅", "恶", "饿"],
  i: ["咪", "迷", "米", "密"],
  u: ["乌", "吴", "五", "雾"],
  ü: ["居", "菊", "举", "巨"],
  er: ["轭", "儿", "耳", "二"],
  ai: ["埃", "挨", "矮", "爱"],
  ei: ["诶", "欸", "馁", "内"],
  ao: ["凹", "遨", "袄", "傲"],
  ou: ["欧", "耦", "偶", "怄"],
  an: ["安", "鞍", "俺", "岸"],
  en: ["恩", "蒽", "摁", "摁"],
  ang: ["肮", "昂", "盎", "盎"],
  eng: ["哼", "恒", "冷", "梦"],
  ong: ["翁", "嗡", "蓊", "瓮"],
  ia: ["呀", "牙", "雅", "亚"],
  ie: ["椰", "爷", "也", "业"],
  iao: ["腰", "摇", "咬", "药"],
  iu: ["丢", "留", "柳", "六"],
  ian: ["烟", "盐", "演", "咽"],
  in: ["因", "银", "引", "印"],
  iang: ["央", "羊", "养", "样"],
  ing: ["鹰", "迎", "影", "硬"],
  iong: ["雍", "喁", "永", "用"],
  ua: ["挖", "娃", "瓦", "袜"],
  uo: ["窝", "禾", "我", "卧"],
  uai: ["歪", "徊", "崴", "外"],
  ui: ["堆", "对", "腿", "对"],
  uan: ["弯", "完", "晚", "万"],
  un: ["温", "文", "稳", "问"],
  uang: ["汪", "王", "往", "望"],
  ueng: ["翁", "嗡", "蓊", "瓮"],
  "üe": ["靴", "学", "雪", "血"],
  "üan": ["渊", "原", "远", "愿"],
  "ün": ["晕", "云", "允", "运"],
};

function normalizeFinal(raw) {
  if (raw == null) return "";
  let s = String(raw).trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    /* ignore */
  }
  return s.toLowerCase();
}

/**
 * Single character (or short word) to speak for this final + tone (1–4).
 */
export function speechHanziForFinalTone(rawFinal, tone) {
  const f = normalizeFinal(rawFinal);
  const t = Number(tone);
  if (!f || t < 1 || t > 4) return "";
  const row = FINAL_TONE_CHARS[f];
  if (!row || !row[t - 1]) return "";
  return row[t - 1];
}
