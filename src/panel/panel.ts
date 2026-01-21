// src/panel/panel.ts

import { getDom } from "./app/dom";
import { createBus } from "./app/bus";
import { createTabs } from "./app/tabs";

import { createPanelCache } from "./app/cache";

import { createOverviewTab } from "./tabs/overview/tab";
import { createSettingsTab } from "./tabs/settings/tab";
import { createLogsTab } from "./tabs/logs/tab";

(function boot() {
  const dom = getDom();

  const bus = createBus();
  bus.start();

  // Generic panel cache (currently unused by the minimal template UI,
  // but created here so future tabs/features can rely on it consistently).
  const cache = createPanelCache();

  // Optional: expose for developer debugging (remove later if you dislike globals)
  (globalThis as any).__APP__ = {
    ...(globalThis as any).__APP__,
    cache,
  };

  // Tabs
  const overviewTab = createOverviewTab(dom, bus);
  const settingsTab = createSettingsTab(dom, bus);
  const logsTab = createLogsTab(dom, bus);

  overviewTab.bind();
  settingsTab.bind();
  logsTab.bind();

  const tabs = createTabs(dom, {
    overview: overviewTab,
    settings: settingsTab,
    logs: logsTab,
  });

  tabs.bind();
  tabs.boot();

  // Optional: future-friendly hook point (no-op for now)
  // cache.subscribe(() => {});
})();
