export function safeLocalStorageGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (_) {
    return null;
  }
}

export function safeLocalStorageSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (_) {}
}

export function safeLocalStorageRemoveItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (_) {}
}

