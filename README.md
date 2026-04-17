# தமிழ் கற்போம் — Tamil Learn

A Duolingo-style Tamil learning app for English speakers who want to understand Tamil movies.

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Features

- **608 words** across 20 topics (expandable to 1000+ via generator)
- **4 exercise types**: word matching, listen & identify, fill-in-blank, sentence build
- **Spaced repetition** (SM-2 algorithm) tracks what you know
- **Audio** with pre-generated Tamil TTS (Sarvam AI) + Web Speech API fallback
- **Offline-first** — all data is static, no API calls at runtime
- **Progress persistence** via localStorage

## Generate More Vocabulary

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
python3 scripts/generate_vocab.py
```

## Generate Audio Files

```bash
export SARVAM_API_KEY="your-key"
python3 scripts/generate_audio.py
```

## Deploy to GitHub Pages

1. Push to GitHub
2. Go to **Settings → Pages → Source → GitHub Actions**
3. Every push to `main` auto-deploys

Live at: `https://yourusername.github.io/tamil-learn/`

## Project Structure

```
src/
├── App.jsx           # Main app (screens, state, UI)
├── storage.js        # localStorage abstraction
├── audio.js          # Audio playback (MP3 files + Web Speech API fallback)
├── sm2.js            # Spaced repetition algorithm
├── exercises.js      # Exercise generators (pure functions)
└── data/
    ├── topics.js     # 20 topic definitions
    └── vocab-data.json  # All vocabulary (static)
scripts/
├── generate_vocab.py    # Expand vocabulary via Anthropic API
└── generate_audio.py    # Generate MP3s via Sarvam TTS API
public/
└── audio/               # Pre-generated Tamil audio files
```
