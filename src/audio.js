/**
 * @file audio.js
 * @module Audio
 * @description Tamil audio playback. Tries a pre-generated MP3 at `{BASE}/audio/{topicId}/{hash}.mp3` (SHA-256, first 16 hex chars, matches scripts/generate_audio.py), falls back to the Web Speech API if the file is missing.
 * @exports
 *   - speak(text, topicId, slow): async; plays audio file or falls back to TTS. `slow=true` uses `_slow.mp3` suffix or a 0.6 TTS rate.
 *   - stopSpeaking(): cancels any active TTS utterance.
 * @depends (none)
 * @connects Called from App.jsx (Spk button component, card intros, listen/fill exercises) and driven by data from src/data/vocab-data.json.
 */

let tamilVoice = null;

function loadVoices() {
  if (!window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  tamilVoice = voices.find((v) => v.lang.startsWith("ta")) || null;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

// Simple hash for filenames (same as Python script uses)
async function md5(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

/**
 * Play Tamil audio for a word/sentence.
 * @param {string} text - Tamil text
 * @param {string} topicId - Topic ID for file path lookup
 * @param {boolean} slow - Play at slow speed
 */
export async function speak(text, topicId = null, slow = false) {
  // Try pre-generated audio first
  if (topicId) {
    try {
      const hash = await md5(text);
      const suffix = slow ? "_slow" : "";
      const base = import.meta.env.BASE_URL || "/";
      const path = `${base}audio/${topicId}/${hash}${suffix}.mp3`;
      const audio = new Audio(path);

      await new Promise((resolve, reject) => {
        audio.oncanplaythrough = resolve;
        audio.onerror = reject;
        audio.load();
      });

      audio.play();
      return;
    } catch {
      // File not found, fall through to Web Speech API
    }
  }

  // Fallback: Web Speech API
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ta-IN";
  utterance.rate = slow ? 0.6 : 0.82;
  utterance.pitch = 1;
  if (tamilVoice) utterance.voice = tamilVoice;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}
