# தமிழ் கற்போம் — Tamil Learn

A Duolingo-style Tamil learning app for English speakers who want to understand Tamil movies.

## Status

Rebuilding from scratch, engine first. For now the app shows a single placeholder screen.

The v1 app (topic grid, vocabulary, grammar engine, spaced repetition) lives at commit
[`292d3be`](https://github.com/gotu0000/ClaudeTamilLearn/tree/292d3be). To run it:
`git checkout 292d3be && npm install && npm run dev` (then `git checkout main` to come back).

## Quick Start

```bash
npm install
./scripts/setup-hooks.sh   # one-time: installs pre-commit FILE_MAP check
npm run dev
# Open http://localhost:3000
```

See `docs/FILE_MAP.md` for an auto-generated per-file reference (exports, dependencies, connections).

## Deploy

Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.

Live at: https://gotu0000.github.io/ClaudeTamilLearn/
