// src/panel/tabs/overview/model.ts

export type OverviewPoint = {
  t: number;
  dom: number;
  resPerMin: number;
  errPerMin: number;
  longPerMin: number;
  stress: number;
};

const MAX_POINTS = 60; // ~5 min at 5s interval

export function computeStress(p: {
  dom: number;
  resPerMin: number;
  errPerMin: number;
  longPerMin: number;
}) {
  const domScore = Math.min(p.dom / 2000, 1) * 25;
  const netScore = Math.min(p.resPerMin / 120, 1) * 25;
  const errScore = Math.min(p.errPerMin / 5, 1) * 25;
  const longScore = Math.min(p.longPerMin / 3, 1) * 25;

  return Math.round(domScore + netScore + errScore + longScore);
}

export type OverviewTotals = {
  domNodes: number;
  resTotal: number;
  errTotal: number;
  longTaskTotal: number;
};

export type OverviewRates = {
  resPerMin: number;
  errPerMin: number;
  longTaskPerMin: number;
};

export function createOverviewModel() {
  let enabled = false;

  let baselineDomNodes: number | null = null;

  let totals: OverviewTotals | null = null;
  let rates: OverviewRates | null = null;

  let lastTotals: OverviewTotals | null = null;
  let lastAtMs = 0;

  let status = "Idle";

  let points: OverviewPoint[] = [];

  function setEnabled(v: boolean) {
    enabled = !!v;
  }

  function setStatus(text: string) {
    status = text || "";
  }

  function setBaselineDomNodes(v: number) {
    baselineDomNodes = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : null;
  }

  function clearBaseline() {
    baselineDomNodes = null;
  }

  function clearPoints() {
    points = [];
  }

  function pushPoint(p: OverviewPoint) {
    points = [...points, p];
    if (points.length > MAX_POINTS) points = points.slice(points.length - MAX_POINTS);
  }

  function setSample(nowMs: number, next: OverviewTotals) {
    totals = next;

    // compute rates vs lastTotals
    if (lastTotals && lastAtMs > 0 && nowMs > lastAtMs) {
      const dtSec = (nowMs - lastAtMs) / 1000;
      if (dtSec > 0.25) {
        const resDelta = Math.max(0, next.resTotal - lastTotals.resTotal);
        const errDelta = Math.max(0, next.errTotal - lastTotals.errTotal);
        const longDelta = Math.max(0, next.longTaskTotal - lastTotals.longTaskTotal);

        rates = {
          resPerMin: (resDelta * 60) / dtSec,
          errPerMin: (errDelta * 60) / dtSec,
          longTaskPerMin: (longDelta * 60) / dtSec,
        };
      }
    }

    lastTotals = next;
    lastAtMs = nowMs;

    if (baselineDomNodes == null && Number.isFinite(next.domNodes)) {
      setBaselineDomNodes(next.domNodes);
    }
  }

  return {
    get enabled() {
      return enabled;
    },
    get baselineDomNodes() {
      return baselineDomNodes;
    },
    get totals() {
      return totals;
    },
    get rates() {
      return rates;
    },
    get status() {
      return status;
    },
    get points() {
      return points;
    },

    setEnabled,
    setStatus,
    setBaselineDomNodes,
    clearBaseline,

    clearPoints,
    pushPoint,

    setSample,
  };
}
