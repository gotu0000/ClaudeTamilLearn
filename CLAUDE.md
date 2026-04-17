# தமிழ் கற்போம் — Tamil Learning App

## Project Overview
A Duolingo-style Tamil learning app for English speakers who want to understand spoken Tamil (especially Tamil movies). Offline-first, designed for eventual iOS App Store release via Capacitor.

## Tech Stack
- **Frontend**: React 18 + Vite (single-page app)
- **Styling**: Inline styles with design tokens (no CSS framework)
- **Storage**: localStorage via abstraction layer (`src/storage.js`)
- **Audio**: Pre-generated MP3 files via Sarvam AI TTS API (stored in `public/audio/`)
- **Spaced Repetition**: SM-2 algorithm (`src/sm2.js`)
- **Deployment**: GitHub Pages via GitHub Actions

## Project Structure
```
├── CLAUDE.md                    # This file
├── package.json
├── vite.config.js
├── index.html
├── .github/workflows/deploy.yml # Auto-deploy to GitHub Pages
├── public/
│   └── audio/                   # Pre-generated Tamil audio MP3s
├── src/
│   ├── main.jsx                 # Entry point
│   ├── App.jsx                  # Main app component
│   ├── storage.js               # localStorage abstraction
│   ├── audio.js                 # Audio playback engine
│   ├── sm2.js                   # Spaced repetition algorithm
│   ├── exercises.js             # Exercise generators (pure functions)
│   └── data/
│       ├── topics.js            # Topic definitions (20 topics)
│       └── vocab-data.json      # Vocabulary data (words + sentences)
├── scripts/
│   ├── generate_vocab.py        # Generate vocabulary via Anthropic API
│   └── generate_audio.py        # Generate audio via Sarvam TTS API
└── README.md
```

## Key Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build to dist/
npm run preview      # Preview production build
```

## Vocabulary Generation
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
python3 scripts/generate_vocab.py
# Outputs: src/data/vocab-data.json
# Crash-safe: saves after each topic, re-run to continue
```

## Audio Generation
```bash
export SARVAM_API_KEY="your-key"
python3 scripts/generate_audio.py
# Reads: src/data/vocab-data.json
# Outputs: public/audio/{topic_id}/{hash}.mp3
# Generates normal (1.0x) and slow (0.7x) speed per word
```

## Architecture Notes

### Exercise Types (progressive difficulty)
- **difficulty 0**: word-match (Tamil↔English), listen-and-pick
- **difficulty 1**: + fill-in-the-blank
- **difficulty 2**: + sentence reconstruction

### Data Flow
```
vocab-data.json (static) → exercises.js (generates quizzes) → App.jsx (UI)
                          → sm2.js (tracks mastery per word)
                          → storage.js (persists progress in localStorage)
```

### Audio File Naming
Files are named by MD5 hash of the Tamil text: `public/audio/{topic_id}/{md5}.mp3`
Slow versions: `public/audio/{topic_id}/{md5}_slow.mp3`

### Design Tokens
All colors, fonts, spacing defined in `V` object at top of `App.jsx`. Dark theme with:
- Background: `#0B0B1A`
- Accent: `#FF6B35` (orange)
- Fonts: 'Noto Sans Tamil' for Tamil text, 'DM Sans' for UI

## Coding Standards
- Pure functions for exercise generation (no side effects)
- Storage abstraction layer — never call localStorage directly
- All Tamil text must include: `tamil`, `transliteration`, `english` fields
- Use spoken/colloquial Tamil, not literary Tamil
- Test in browser after changes: `npm run dev`

## Documentation (zero-drift convention)

Every `src/**/*.{js,jsx}` file MUST start with a JSDoc header containing these tags:
`@file`, `@module`, `@description`, `@exports`, `@depends`, `@connects`.

`docs/FILE_MAP.md` is auto-generated from these headers. After editing any source file:

```bash
python3 scripts/gen_file_map.py --write
git add docs/FILE_MAP.md
```

A pre-commit hook (`./scripts/setup-hooks.sh` installs it) and the `FILE_MAP check`
GitHub Action both run `gen_file_map.py --check` and block commits / PRs where
the map is out of sync with the headers. Never hand-edit `docs/FILE_MAP.md` —
edit the JSDoc header in the relevant `src/` file and regenerate.
