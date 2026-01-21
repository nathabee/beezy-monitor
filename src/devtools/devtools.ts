// src/devtools/devtools.ts
// Runs in the DevTools context. Responsible for creating DevTools panels.

const PANEL_TITLE = "Beezy Monitor";

// We reuse your existing panel UI (panel.html + panel.ts).
// This creates a DevTools panel that loads that page inside DevTools.
chrome.devtools.panels.create(
  PANEL_TITLE,
  "", // icon path optional; keep empty for now (or add a small PNG)
  "panel/panel.html",
  (panel) => {
    // Optional: dev console log only (DevTools context)
    // Keep it lightweight to avoid noise.
    void panel;
  }
);
