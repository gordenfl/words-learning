/** localStorage keys for practice completion (same as mobile AsyncStorage) */
const PREFIX = {
  writing: "writingCompleted_",
  writingProgress: "writingProgress_",
  compound: "compoundPractice_",
};

export function getWritingCompleted(wordId) {
  try {
    return localStorage.getItem(PREFIX.writing + wordId) === "true";
  } catch {
    return false;
  }
}

export function setWritingCompleted(wordId) {
  try {
    localStorage.setItem(PREFIX.writing + wordId, "true");
  } catch (_) {}
}

export function getWritingProgress(wordId) {
  try {
    const s = localStorage.getItem(PREFIX.writingProgress + wordId);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function setWritingProgress(wordId, indices) {
  try {
    localStorage.setItem(PREFIX.writingProgress + wordId, JSON.stringify(indices));
  } catch (_) {}
}

export function getCompoundPractice(wordId) {
  try {
    const s = localStorage.getItem(PREFIX.compound + wordId);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function setCompoundPractice(wordId, words) {
  try {
    localStorage.setItem(PREFIX.compound + wordId, JSON.stringify(words));
  } catch (_) {}
}

export function isWritingCompleted(wordId) {
  if (getWritingCompleted(wordId)) return true;
  const progress = getWritingProgress(wordId);
  return progress.length >= 10;
}

export function isCompoundPracticeCompleted(wordId) {
  return getCompoundPractice(wordId).length >= 3;
}

/** Sentence Practice 已移除，始终返回 true */
export function isSentencePracticeCompleted() {
  return true;
}

export function isAllPracticesCompleted(wordId, word) {
  if (!isWritingCompleted(wordId)) return false;
  if (!word?.examples?.length) return false;
  return true;
}
