# presentation

### The core idea

Beezy Monitor should answer, at a glance:

* Is the page healthy?
* If not, what category is hurting: **Network, Console errors, DOM bloat, Performance**
* What changed in the last 30–60 seconds?

So your first functional slice should be **Live Snapshot + Trends**, not a giant “DevTools clone”.

## MVP feature set (v0.0.1) that feels real

Add 3 tabs (or keep Settings/Logs and add one new tab):

### 1) Overview tab (the main value)

A single dashboard with:

* **Requests/min** + **Error rate** (4xx/5xx, failed)
* **JS errors/min** (console errors)
* **DOM nodes count** (and delta)
* **Long tasks/min** (main thread stalls proxy)

And a simple “Status”:

* Green / Yellow / Red based on thresholds (user-adjustable later).

### 2) Network tab (manager-friendly, not DevTools)

* Top 10 endpoints by:

  * count
  * total bytes
  * slowest average (if available)
* A tiny sparkline/trend over last N minutes (even just last 60 samples).
* “What changed since last minute”: new endpoints, spikes.

### 3) Console tab (painkiller)

* Error groups (same message + source) with counts
* “New since last 5 min”
* Click = show the raw messages (but default is summary)

Keep **Settings** as “sampling rate, history length, thresholds”.

---

## How to implement with minimal complexity (no `debugger` yet)

Don’t jump to CDP attach. Start with **page-eval + lightweight hooks**.

### A) DOM count + document “shape”

From the inspected page, on an interval:

* `document.getElementsByTagName("*").length`
* count of `script`, `style`, `link[rel=stylesheet]`, `img`, `iframe`
* total text length of body (rough)
  This gives a “DOM bloat” indicator fast.

### B) Network-ish metrics without DevTools protocol

You can get useful *approximations* by instrumenting:

* `performance.getEntriesByType("resource")` (count, transferSize where available)
* `performance.getEntriesByType("navigation")` (baseline)
  This won’t capture everything like the Network panel, but it’s enough for an MVP dashboard.

### C) Console errors

You can’t directly read another page’s console from DevTools without CDP, but you *can* inject a tiny hook in the page context (via `devtools.inspectedWindow.eval`) that wraps `console.error/warn` and stores counts in `window.__beezyMonitor`.
Then your panel polls and renders counts and groups.

### D) Long tasks

In the page context, use `PerformanceObserver` for `"longtask"` where supported, store counts and durations.

This approach stays in the “low-permission” world:

* no `debugger` permission
* no scary review story
* still delivers visible graphs

Later you add an “Advanced (Attach)” button that uses `chrome.debugger` to become truly accurate.

---

## What we can build next in your existing codebase (concrete)

Given you already have:

* `panel/app/state.ts`, `tabs`, `bus`, `cache`, `logs`

I’d do this next:

1. Add a new tab: `tabs/overview`
2. Add a shared “metrics sample” model:

   * `timestamp`
   * `domNodes`
   * `resourceCountLastInterval`
   * `resourceBytesLastInterval`
   * `consoleErrorCountLastInterval`
   * `longTaskCountLastInterval`
3. Add an interval runner in the panel that calls into the inspected page and appends samples to an in-memory ring buffer (and optionally `storage`).
4. Render simple graphs (even primitive ASCII bars at first) and summary cards.

---

## One decision you should lock now

Beezy Monitor should be **explicitly started** (button “Start monitoring”) vs always running.

For DevTools UX + privacy + performance, I’d do:

* default: stopped
* user clicks “Start”
* show indicator “Monitoring: ON”
* “Stop” stops polling and injection

That also makes later “Attach debugger” clean and explicit.

---
 