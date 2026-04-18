/**
 * @file storage.js
 * @module Storage
 * @description localStorage abstraction. Namespaces all keys under `tamillearn:` and handles JSON (de)serialization with silent error swallowing.
 * @exports
 *   - KEYS: constant map of namespaced storage keys (XP, STREAK, LAST_DAY, TOPIC_LESSONS, SR_DATA, LEARNED_WORDS, LEARNED_SENTENCES)
 *   - storageGet(key, fallback): read + JSON.parse + fall back on miss/error
 *   - storageSet(key, value): JSON.stringify + write (errors logged, not thrown)
 *   - storageClear(): remove every `tamillearn:` key
 * @depends (none)
 * @connects Loaded by App.jsx on mount; written after each lesson via saveAll().
 */
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
  LEARNED_SENTENCES: "learnedSentences",
};
