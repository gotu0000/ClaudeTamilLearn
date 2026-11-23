# தமிழ் கற்போம் — Tamil Learning App

## Project Overview
A Duolingo-style Tamil learning app for English speakers who want to understand spoken Tamil (especially Tamil movies). Offline-first, designed for eventual iOS App Store release via Capacitor.

## Status
**v2 rebuild in progress, engine first.** The codebase was reset to an empty canvas: `src/` holds only the entry point and a placeholder screen.

The v1 app (topic grid, `vocab-data.json`, primitive grammar engine, SM-2, Sarvam TTS audio pipeline) lives at commit `292d3be`. Bring a piece back deliberately when the new engine needs it, e.g. `git checkout 292d3be -- src/sm2.js`.

### Lessons from v1 (inputs to the engine design)
- Build every exercise only from what the learner has been taught. v1's hand-written sentences leaked untaught words ("home" showed up in the Verbs topic).
- One content model, not two. v1 ran hand-written vocabulary and a grammar engine side by side, and they drifted apart.
- English glosses collide (நீ and நீங்க are both "you"), so the content model needs a disambiguator from day one.
- v1 progress is still on devices under `tamillearn:*` localStorage keys. v2 storage needs a new namespace or a schema-version key so stale v1 data is never misread.

## Tech Stack
- **Frontend**: React 18 + Vite (single-page app)
- **Styling**: Inline styles (no CSS framework)
- **Deployment**: GitHub Pages via GitHub Actions
- **Storage, audio, spaced repetition**: to be decided in the v2 engine design (v1 used localStorage, pre-generated Sarvam TTS MP3s and SM-2)

## Project Structure
```
├── CLAUDE.md                    # This file
├── package.json
├── vite.config.js               # GitHub Pages base path
├── index.html                   # Fonts (Noto Sans Tamil, DM Sans), SPA path restore
├── .github/workflows/
│   ├── deploy.yml               # Build + deploy to GitHub Pages on push to main
│   └── file-map-check.yml       # Fails if docs/FILE_MAP.md is out of sync
├── public/                      # 404.html (SPA redirect), .nojekyll
├── src/
│   ├── main.jsx                 # Entry point
│   └── App.jsx                  # Placeholder screen
├── docs/
│   └── FILE_MAP.md              # Auto-generated per-file reference
└── scripts/
    ├── gen_file_map.py          # Builds docs/FILE_MAP.md from JSDoc headers
    ├── setup-hooks.sh           # Installs git hooks
    └── git-hooks/pre-commit     # FILE_MAP check
```

## Key Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build to dist/
npm run preview      # Preview production build
```

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
