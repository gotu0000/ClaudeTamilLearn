/**
 * @file App.jsx
 * @module App
 * @description Placeholder root component for the v2 rebuild. Renders one static screen while the learning engine is designed; holds no state and touches no storage.
 * @exports
 *   - default App(): the root component rendered by main.jsx
 * @depends (none)
 * @connects Mounted by src/main.jsx. Replaced once the v2 engine lands.
 */
export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#0B0B1A", color: "#E8E8F4", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <div>
        <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Noto Sans Tamil','DM Sans',sans-serif" }}>
          <span style={{ color: "#FF6B35" }}>தமிழ்</span> கற்போம்
        </div>
        <div style={{ color: "#6B6B8D", fontSize: 14, marginTop: 8 }}>Rebuilding from scratch — engine first.</div>
      </div>
    </div>
  );
}
