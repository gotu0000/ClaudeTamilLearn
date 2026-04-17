/**
 * @file main.jsx
 * @module Entry
 * @description React bootstrap. Mounts <App/> inside StrictMode at #root.
 * @exports (none)
 * @depends src/App.jsx
 * @connects Entry point declared in index.html; loaded by Vite as the root module.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
