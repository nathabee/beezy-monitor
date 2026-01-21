export type Dom = ReturnType<typeof getDom>;

export function getDom() {
  function must<T extends Element>(el: T | null, id: string): T {
    if (!el) throw new Error(`[dom] Missing #${id}`);
    return el;
  }

  // Root
  const rootEl = must(document.getElementById("appRoot") as HTMLDivElement | null, "appRoot");

  // -----------------------------
  // Tabs + views
  // -----------------------------
  const tabOverview = must(document.getElementById("tabOverview") as HTMLButtonElement | null, "tabOverview");
  const tabSettings = must(document.getElementById("tabSettings") as HTMLButtonElement | null, "tabSettings");
  const tabLogs = must(document.getElementById("tabLogs") as HTMLButtonElement | null, "tabLogs");

  const viewOverview = must(document.getElementById("viewOverview") as HTMLElement | null, "viewOverview");
  const viewSettings = must(document.getElementById("viewSettings") as HTMLElement | null, "viewSettings");
  const viewLogs = must(document.getElementById("viewLogs") as HTMLElement | null, "viewLogs");

  // -----------------------------
  // Overview
  // -----------------------------
  const btnOvStart = must(document.getElementById("btnOvStart") as HTMLButtonElement | null, "btnOvStart");
  const btnOvStop = must(document.getElementById("btnOvStop") as HTMLButtonElement | null, "btnOvStop");
  const ovStatusEl = must(document.getElementById("ovStatus") as HTMLSpanElement | null, "ovStatus");

  const ovDomCountEl = must(document.getElementById("ovDomCount") as HTMLElement | null, "ovDomCount");
  const ovDomDeltaEl = must(document.getElementById("ovDomDelta") as HTMLElement | null, "ovDomDelta");

  const ovResCountEl = must(document.getElementById("ovResCount") as HTMLElement | null, "ovResCount");
  const ovErrorCountEl = must(document.getElementById("ovErrorCount") as HTMLElement | null, "ovErrorCount");
  const ovLongTaskCountEl = must(
    document.getElementById("ovLongTaskCount") as HTMLElement | null,
    "ovLongTaskCount"
  );

  const ovStressChartEl = must(document.getElementById("ovStressChart") as HTMLCanvasElement | null, "ovStressChart");
  const ovDomChartEl = must(document.getElementById("ovDomChart") as HTMLCanvasElement | null, "ovDomChart");
  const ovNetChartEl = must(document.getElementById("ovNetChart") as HTMLCanvasElement | null, "ovNetChart");
  const ovErrChartEl = must(document.getElementById("ovErrChart") as HTMLCanvasElement | null, "ovErrChart");
  const ovLongChartEl = must(document.getElementById("ovLongChart") as HTMLCanvasElement | null, "ovLongChart");



  // -----------------------------
  // Settings
  // -----------------------------
  const cfgShowDevToolsEl = must(
    document.getElementById("cfgShowDevTools") as HTMLInputElement | null,
    "cfgShowDevTools"
  );
  const settingsGeneralStatusEl = must(
    document.getElementById("settingsGeneralStatus") as HTMLElement | null,
    "settingsGeneralStatus"
  );

  // Developer config section
  const devConfigDetailsEl = must(
    document.getElementById("devConfigDetails") as HTMLDetailsElement | null,
    "devConfigDetails"
  );

  const cfgTraceConsoleEl = must(
    document.getElementById("cfgTraceConsole") as HTMLInputElement | null,
    "cfgTraceConsole"
  );

  const cfgActionLogMaxEl = must(
    document.getElementById("cfgActionLogMax") as HTMLInputElement | null,
    "cfgActionLogMax"
  );
  const cfgDebugTraceMaxEl = must(
    document.getElementById("cfgDebugTraceMax") as HTMLInputElement | null,
    "cfgDebugTraceMax"
  );
  const cfgFailureLogsPerRunEl = must(
    document.getElementById("cfgFailureLogsPerRun") as HTMLInputElement | null,
    "cfgFailureLogsPerRun"
  );

  const logsCbDebugEl = must(document.getElementById("logsCbDebug") as HTMLInputElement | null, "logsCbDebug");

  const btnCfgResetDefaults = must(
    document.getElementById("btnCfgResetDefaults") as HTMLButtonElement | null,
    "btnCfgResetDefaults"
  );
  const cfgStatusEl = must(document.getElementById("cfgStatus") as HTMLElement | null, "cfgStatus");

  // About
  const settingsVersionEl = must(document.getElementById("settingsVersion") as HTMLElement | null, "settingsVersion");
  const settingsGitHubLinkEl = must(
    document.getElementById("settingsGitHubLink") as HTMLAnchorElement | null,
    "settingsGitHubLink"
  );

  // -----------------------------
  // Logs (audit)
  // -----------------------------
  const logsLimitEl = must(document.getElementById("logsLimit") as HTMLInputElement | null, "logsLimit");
  const btnLogsRefresh = must(document.getElementById("btnLogsRefresh") as HTMLButtonElement | null, "btnLogsRefresh");
  const logsStatusEl = must(document.getElementById("logsStatus") as HTMLSpanElement | null, "logsStatus");

  const logsTrimKeepEl = must(document.getElementById("logsTrimKeep") as HTMLInputElement | null, "logsTrimKeep");
  const btnLogsTrim = must(document.getElementById("btnLogsTrim") as HTMLButtonElement | null, "btnLogsTrim");
  const btnLogsExport = must(document.getElementById("btnLogsExport") as HTMLButtonElement | null, "btnLogsExport");
  const btnLogsClear = must(document.getElementById("btnLogsClear") as HTMLButtonElement | null, "btnLogsClear");

  const logsOutEl = must(document.getElementById("logsOut") as HTMLPreElement | null, "logsOut");

  // -----------------------------
  // Debug trace (shown in Logs view)
  // -----------------------------
  const debugLimitEl = must(document.getElementById("debugLimit") as HTMLInputElement | null, "debugLimit");
  const btnDebugRefresh = must(document.getElementById("btnDebugRefresh") as HTMLButtonElement | null, "btnDebugRefresh");
  const btnDebugExport = must(document.getElementById("btnDebugExport") as HTMLButtonElement | null, "btnDebugExport");
  const btnDebugClear = must(document.getElementById("btnDebugClear") as HTMLButtonElement | null, "btnDebugClear");
  const debugStatusEl = must(document.getElementById("debugStatus") as HTMLSpanElement | null, "debugStatus");
  const debugOutEl = must(document.getElementById("debugOut") as HTMLPreElement | null, "debugOut");

  return {
    rootEl,

    // Tabs + views
    tabOverview,
    tabSettings,
    tabLogs,
    viewOverview,
    viewSettings,
    viewLogs,

    // Overview
    btnOvStart,
    btnOvStop,
    ovStatusEl,
    ovDomCountEl,
    ovDomDeltaEl,
    ovResCountEl,
    ovErrorCountEl,
    ovLongTaskCountEl,
    ovStressChartEl,
    ovDomChartEl,
    ovNetChartEl,
    ovErrChartEl,
    ovLongChartEl,
    // Settings
    cfgShowDevToolsEl,
    settingsGeneralStatusEl,
    devConfigDetailsEl,
    cfgTraceConsoleEl,
    cfgActionLogMaxEl,
    cfgDebugTraceMaxEl,
    cfgFailureLogsPerRunEl,
    logsCbDebugEl,
    btnCfgResetDefaults,
    cfgStatusEl,
    settingsVersionEl,
    settingsGitHubLinkEl,

    // Logs (audit)
    logsLimitEl,
    btnLogsRefresh,
    logsStatusEl,
    logsTrimKeepEl,
    btnLogsTrim,
    btnLogsExport,
    btnLogsClear,
    logsOutEl,

    // Debug trace
    debugLimitEl,
    btnDebugRefresh,
    btnDebugExport,
    btnDebugClear,
    debugStatusEl,
    debugOutEl,
  };
}
