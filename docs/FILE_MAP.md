# Source File Map

_Auto-generated from JSDoc headers in `src/`. Run `python3 scripts/gen_file_map.py --write` after editing any source file._

## `src/App.jsx`

**Module:** App

**Description:** Root React component. Owns all UI, state (xp, streak, lessons, SR, learned words), and lesson orchestration. Five screens: home, cards, lesson, result, dict.

**Exports:**

- default App(): the root component rendered by main.jsx

**Depends on:** src/storage.js, src/audio.js, src/sm2.js, src/exercises.js, src/data/topics.js, src/data/vocab-data.json

**Connects:** Loads persisted state on mount via storage.js; drives the whole UX.

## `src/audio.js`

**Module:** Audio

**Description:** Tamil audio playback. Tries a pre-generated MP3 at `{BASE}/audio/{topicId}/{hash}.mp3` (SHA-256, first 16 hex chars, matches scripts/generate_audio.py), falls back to the Web Speech API if the file is missing.

**Exports:**

- speak(text, topicId, slow): async; plays audio file or falls back to TTS. `slow=true` uses `_slow.mp3` suffix or a 0.6 TTS rate.
- stopSpeaking(): cancels any active TTS utterance.

**Depends on:** (none)

**Connects:** Called from App.jsx (Spk button component, card intros, listen/fill exercises) and driven by data from src/data/vocab-data.json.

## `src/data/topics.js`

**Module:** Topics

**Description:** Static metadata for the 20 topic tiles (id, title, emoji, color). No vocabulary here — words/sentences live in vocab-data.json keyed by the same id.

**Exports:**

- TOPICS: array of {id, title, emoji, color}

**Depends on:** (none)

**Connects:** Rendered on the home grid in App.jsx; keys match vocab-data.json and determine the order of topics.

## `src/exercises.js`

**Module:** Exercises

**Description:** Pure exercise generators. Four types: word-match, listen, fill-blank, sentence-build. Difficulty-gated in generateExercise: 0=match+listen, 1=+fill, 2=+build.

**Exports:**

- shuffle(arr): Fisher-Yates copy
- pick(arr, n): shuffled slice of n
- genWordMatch(words): {type:"word-match", options:[{label,correct}], xp:10}
- genListen(words, sentences): {type:"listen", options, xp:15}
- genFillBlank(words, sentences): {type:"fill", options, xp:20}; falls back to word-match on tiny sentences or empty sentence pool
- genSentenceBuild(sentences): {type:"build", correctOrder, scrambled, xp:25}; returns null if insufficient tokens or empty pool
- generateExercise(words, sentences, difficulty): picks a suitable generator based on difficulty and sentence availability

**Depends on:** (none)

**Connects:** Called from App.jsx startTopic / startFromCards / nextStep to build each lesson step.

## `src/main.jsx`

**Module:** Entry

**Description:** React bootstrap. Mounts <App/> inside StrictMode at #root.

**Exports:** (none)

**Depends on:** src/App.jsx

**Connects:** Entry point declared in index.html; loaded by Vite as the root module.

## `src/sm2.js`

**Module:** SM2

**Description:** SM-2 spaced-repetition algorithm (Anki-style). Quality scale: 0 blackout … 5 perfect; App.jsx passes 4 on correct answers, 1 on incorrect.

**Exports:**

- sm2(item, quality): returns {ef, interval, reps, nextReview} given prior state + quality rating
- isDue(srState): true if the item has no review state or its nextReview has passed

**Depends on:** (none)

**Connects:** Called from App.jsx handlePick (update on answer) and startReview (gather due words).

## `src/storage.js`

**Module:** Storage

**Description:** localStorage abstraction. Namespaces all keys under `tamillearn:` and handles JSON (de)serialization with silent error swallowing.

**Exports:**

- KEYS: constant map of namespaced storage keys (XP, STREAK, LAST_DAY, TOPIC_LESSONS, SR_DATA, LEARNED_WORDS)
- storageGet(key, fallback): read + JSON.parse + fall back on miss/error
- storageSet(key, value): JSON.stringify + write (errors logged, not thrown)
- storageClear(): remove every `tamillearn:` key

**Depends on:** (none)

**Connects:** Loaded by App.jsx on mount; written after each lesson via saveAll().
