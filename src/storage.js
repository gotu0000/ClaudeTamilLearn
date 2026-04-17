const NS = "tamillearn";
const k = (key) => `${NS}:${key}`;

export function storageGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(k(key));
    return raw === null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}

export function storageSet(key, value) {
  try { localStorage.setItem(k(key), JSON.stringify(value)); }
  catch (e) { console.error("Storage write failed:", e); }
}

export function storageClear() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(NS + ":")) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
}

export const KEYS = {
  XP: "xp",
  STREAK: "streak",
  LAST_DAY: "lastDay",
  TOPIC_LESSONS: "topicLessons",
  SR_DATA: "srData",
  LEARNED_WORDS: "learnedWords",
};
