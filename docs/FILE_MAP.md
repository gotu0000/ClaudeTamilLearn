# Source File Map

_Auto-generated from JSDoc headers in `src/`. Run `python3 scripts/gen_file_map.py --write` after editing any source file._

## `src/App.jsx`

**Module:** App

**Description:** Placeholder root component for the v2 rebuild. Renders one static screen while the learning engine is designed; holds no state and touches no storage.

**Exports:**

- default App(): the root component rendered by main.jsx

**Depends on:** (none)

**Connects:** Mounted by src/main.jsx. Replaced once the v2 engine lands.

## `src/main.jsx`

**Module:** Entry

**Description:** React bootstrap. Mounts <App/> inside StrictMode at #root.

**Exports:** (none)

**Depends on:** src/App.jsx

**Connects:** Entry point declared in index.html; loaded by Vite as the root module.
