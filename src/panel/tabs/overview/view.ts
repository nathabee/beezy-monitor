// src/panel/tabs/overview/view.ts

import type { Dom } from "../../app/dom";
import type { OverviewPoint, OverviewRates, OverviewTotals } from "./model";

function fmtInt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return String(Math.max(0, Math.floor(n)));
}

function fmtRate(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const x = Math.max(0, n);
  if (x >= 100) return String(Math.round(x));
  if (x >= 10) return String(Math.round(x * 10) / 10);
  return String(Math.round(x * 100) / 100);
}

type ChartColors = {
  accent: string;
  muted: string;
  border: string;
  danger: string;
};

function getCssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function getColors(): ChartColors {
  return {
    accent: getCssVar("--accent", "#7aa2ff"),
    muted: getCssVar("--muted", "rgba(255,255,255,0.68)"),
    border: getCssVar("--border", "rgba(255,255,255,0.08)"),
    danger: getCssVar("--danger", "#ff6b6b"),
  };
}

function setupCanvas(canvas: HTMLCanvasElement): {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  dpr: number;
} {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(`[overview] Canvas 2D context missing for #${canvas.id}`);

  // Treat HTML attributes as the intended CSS pixel size
  const cssW = canvas.getAttribute("width") ? Number(canvas.getAttribute("width")) : canvas.clientWidth;
  const cssH = canvas.getAttribute("height") ? Number(canvas.getAttribute("height")) : canvas.clientHeight;

  const w = Number.isFinite(cssW) && cssW > 0 ? cssW : 300;
  const h = Number.isFinite(cssH) && cssH > 0 ? cssH : 150;

  const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));

  // IMPORTANT: do NOT use canvas.width for CSS sizing after scaling
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  // Backing store
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);

  // Draw using CSS pixel coordinates
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { ctx, w, h, dpr };
}


function clear(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
}

function drawFrame(ctx: CanvasRenderingContext2D, w: number, h: number, border: string) {
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  // 4 vertical + 2 horizontal
  const vCount = 4;
  for (let i = 1; i <= vCount; i++) {
    const x = (w * i) / (vCount + 1);
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();
  }

  const y1 = h * 0.33;
  const y2 = h * 0.66;
  ctx.beginPath();
  ctx.moveTo(0, y1 + 0.5);
  ctx.lineTo(w, y1 + 0.5);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, y2 + 0.5);
  ctx.lineTo(w, y2 + 0.5);
  ctx.stroke();
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  values: number[],
  minY: number,
  maxY: number,
  stroke: string,
  lineWidth = 2
) {
  if (values.length < 2) return;

  const span = Math.max(1e-9, maxY - minY);

  const xStep = w / Math.max(1, values.length - 1);

  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.beginPath();

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const t = (v - minY) / span;
    const x = i * xStep;
    const y = h - t * h;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.stroke();
}

function autoRange(values: number[]): { min: number; max: number } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 };
  if (min === max) return { min: min - 1, max: max + 1 };
  const pad = (max - min) * 0.08;
  return { min: min - pad, max: max + pad };
}

export function createOverviewView(dom: Dom) {
  const colors = getColors();

  function setEmpty() {
    dom.ovDomCountEl.textContent = "—";
    dom.ovDomDeltaEl.textContent = "";
    dom.ovResCountEl.textContent = "—";
    dom.ovErrorCountEl.textContent = "—";
    dom.ovLongTaskCountEl.textContent = "—";

    // clear charts
    const canvases = [
      dom.ovStressChartEl,
      dom.ovDomChartEl,
      dom.ovNetChartEl,
      dom.ovErrChartEl,
      dom.ovLongChartEl,
    ];
    for (const c of canvases) {
      const { ctx, w, h } = setupCanvas(c);
      // clear(ctx, w, h);
      ctx.clearRect(0, 0, w, h);
      drawFrame(ctx, w, h, colors.border);
    }
  }

  function render(totals: OverviewTotals | null, rates: OverviewRates | null, baselineDomNodes: number | null) {
    if (!totals) {
      setEmpty();
      return;
    }

    dom.ovDomCountEl.textContent = fmtInt(totals.domNodes);

    if (baselineDomNodes == null) {
      dom.ovDomDeltaEl.textContent = "";
    } else {
      const delta = Math.floor(totals.domNodes - baselineDomNodes);
      if (delta === 0) dom.ovDomDeltaEl.textContent = "Δ 0";
      else if (delta > 0) dom.ovDomDeltaEl.textContent = `Δ +${fmtInt(delta)}`;
      else dom.ovDomDeltaEl.textContent = `Δ ${fmtInt(delta)}`;
    }

    if (rates) {
      dom.ovResCountEl.textContent = fmtRate(rates.resPerMin);
      dom.ovErrorCountEl.textContent = fmtRate(rates.errPerMin);
      dom.ovLongTaskCountEl.textContent = fmtRate(rates.longTaskPerMin);
    } else {
      dom.ovResCountEl.textContent = fmtInt(totals.resTotal);
      dom.ovErrorCountEl.textContent = fmtInt(totals.errTotal);
      dom.ovLongTaskCountEl.textContent = fmtInt(totals.longTaskTotal);
    }
  }

  function renderCharts(points: OverviewPoint[]) {
    // Need at least 2 points to show a line
    if (!points || points.length < 2) {
      // Still draw frames so you see the boxes
      const canvases = [
        dom.ovStressChartEl,
        dom.ovDomChartEl,
        dom.ovNetChartEl,
        dom.ovErrChartEl,
        dom.ovLongChartEl,
      ];
      for (const c of canvases) {
        const { ctx, w, h } = setupCanvas(c);
        // clear(ctx, w, h);
        ctx.clearRect(0, 0, w, h);
        drawFrame(ctx, w, h, colors.border);
      }
      return;
    }

    const stressVals = points.map((p) => p.stress);
    const domVals = points.map((p) => p.dom);
    const netVals = points.map((p) => p.resPerMin);
    const errVals = points.map((p) => p.errPerMin);
    const longVals = points.map((p) => p.longPerMin);

    // --- Stress (fixed range 0..100) ---
    {
      const { ctx, w, h } = setupCanvas(dom.ovStressChartEl);
      //clear(ctx, w, h);
      ctx.clearRect(0, 0, w, h);
      drawGrid(ctx, w, h, colors.border);
      drawLine(ctx, w, h, stressVals, 0, 100, colors.accent, 2);
      drawFrame(ctx, w, h, colors.border);
    }

    // --- Sparklines (auto-range) ---
    function drawSpark(canvas: HTMLCanvasElement, values: number[], stroke: string) {
      const { ctx, w, h } = setupCanvas(canvas);
      clear(ctx, w, h);
      const r = autoRange(values);
      drawLine(ctx, w, h, values, r.min, r.max, stroke, 2);
      drawFrame(ctx, w, h, colors.border);
    }

    drawSpark(dom.ovDomChartEl, domVals, colors.accent);
    drawSpark(dom.ovNetChartEl, netVals, colors.accent);
    drawSpark(dom.ovErrChartEl, errVals, colors.danger);
    drawSpark(dom.ovLongChartEl, longVals, colors.accent);
  }

  return {
    setEmpty,
    render,
    renderCharts,
  };
}
