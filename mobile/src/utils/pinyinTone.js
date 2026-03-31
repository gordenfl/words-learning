export function applyToneMark(syllable, tone) {
  if (!tone || tone === 5) return syllable;

  const s = syllable;

  // Tone mark placement rules:
  // 1) If there is an 'a' or 'e', mark it
  // 2) Else if "ou", mark the 'o'
  // 3) Else mark the last vowel (including ü)
  const vowels = ["a", "e", "o", "i", "u", "ü"];
  let idx = -1;
  if (s.includes("a")) idx = s.indexOf("a");
  else if (s.includes("e")) idx = s.indexOf("e");
  else if (s.includes("ou")) idx = s.indexOf("o");
  else {
    for (let i = s.length - 1; i >= 0; i--) {
      if (vowels.includes(s[i])) {
        idx = i;
        break;
      }
    }
  }
  if (idx < 0) return s;

  const ch = s[idx];
  const MAP = {
    a: ["ā", "á", "ǎ", "à"],
    e: ["ē", "é", "ě", "è"],
    i: ["ī", "í", "ǐ", "ì"],
    o: ["ō", "ó", "ǒ", "ò"],
    u: ["ū", "ú", "ǔ", "ù"],
    ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
  };
  const repl = MAP[ch]?.[tone - 1];
  if (!repl) return s;

  return s.slice(0, idx) + repl + s.slice(idx + 1);
}

