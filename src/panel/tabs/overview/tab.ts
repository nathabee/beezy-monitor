// src/panel/tabs/overview/tab.ts

import * as actionLog from "../../../shared/actionLog";
import * as debugTrace from "../../../shared/debugTrace";

import type { Dom } from "../../app/dom";
import type { createBus } from "../../app/bus";

import { getBusy } from "../../app/state";

import { computeStress, createOverviewModel, type OverviewTotals } from "./model";
import { createOverviewView } from "./view";

type Bus = ReturnType<typeof createBus>;

const POLL_MS = 5000;

function nowMs(): number {
    return Date.now();
}

function safeNumber(v: any, fallback = 0): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

// Runs in inspected page context via chrome.devtools.inspectedWindow.eval
function buildEvalSnapshotExpr(): string {
    return (
        "(" +
        function () {
            try {
                const w: any = window as any;

                if (!w.__beezyMonitor) {
                    w.__beezyMonitor = {
                        errTotal: 0,
                        longTaskTotal: 0,
                        _origConsoleError: null as any,
                        _perfObsLong: null as any,
                    };

                    // Hook console.error (count only)
                    try {
                        const c: any = w.console;
                        if (c && typeof c.error === "function") {
                            w.__beezyMonitor._origConsoleError = c.error.bind(c);
                            c.error = function (...args: any[]) {
                                try {
                                    w.__beezyMonitor.errTotal++;
                                } catch {
                                    // ignore
                                }
                                return w.__beezyMonitor._origConsoleError(...args);
                            };
                        }
                    } catch {
                        // ignore
                    }

                    // Long tasks (best-effort)
                    try {
                        if ("PerformanceObserver" in w) {
                            const Obs: any = (w as any).PerformanceObserver;
                            const obs = new Obs((list: any) => {
                                try {
                                    const entries = list.getEntries?.() || [];
                                    w.__beezyMonitor.longTaskTotal += entries.length;
                                } catch {
                                    // ignore
                                }
                            });
                            obs.observe({ entryTypes: ["longtask"] });
                            w.__beezyMonitor._perfObsLong = obs;
                        }
                    } catch {
                        // ignore
                    }
                }

                const domNodes = document.getElementsByTagName("*").length;

                let resTotal = 0;
                try {
                    const p: any = w.performance;
                    const entries = p?.getEntriesByType?.("resource") || [];
                    resTotal = entries.length;
                } catch {
                    // ignore
                }

                const errTotal = Number(w.__beezyMonitor?.errTotal || 0);
                const longTaskTotal = Number(w.__beezyMonitor?.longTaskTotal || 0);

                return {
                    ok: true,
                    domNodes,
                    resTotal,
                    errTotal,
                    longTaskTotal,
                };
            } catch (e: any) {
                return { ok: false, error: String(e?.message || e || "unknown error") };
            }
        }.toString() +
        ")()"
    );
}

async function evalInInspectedPage<T = any>(expression: string): Promise<{ ok: boolean; value?: T; error?: string }> {
    try {
        const api: any = (globalThis as any)?.chrome?.devtools?.inspectedWindow;
        if (!api?.eval) return { ok: false, error: "chrome.devtools.inspectedWindow.eval unavailable." };

        return await new Promise((resolve) => {
            api.eval(expression, (result: any, exceptionInfo: any) => {
                if (exceptionInfo && exceptionInfo.isException) {
                    resolve({
                        ok: false,
                        error: String(exceptionInfo.value || exceptionInfo.description || "Eval exception"),
                    });
                    return;
                }
                resolve({ ok: true, value: result as T });
            });
        });
    } catch (e: any) {
        return { ok: false, error: String(e?.message || e || "Eval failed") };
    }
}

export function createOverviewTab(dom: Dom, bus: Bus) {
    const model = createOverviewModel();
    const view = createOverviewView(dom);

    let timer: number | null = null;
    let mounted = false;
    let bound = false;

    function setControls(running: boolean) {
        dom.btnOvStart.disabled = running || getBusy();
        dom.btnOvStop.disabled = !running || getBusy();
    }

    function setStatus(text: string) {
        model.setStatus(text);
        dom.ovStatusEl.textContent = text || "";
    }

    async function sampleOnce() {
        if (!mounted) return;
        if (!model.enabled) return;

        const res = await evalInInspectedPage<any>(buildEvalSnapshotExpr());

        if (!res.ok) {
            setStatus("Eval failed");
            setControls(true);

            void actionLog.append({
                kind: "error",
                scope: "overview",
                message: "Failed to read metrics from inspected page.",
                ok: false,
                error: res.error || "unknown error",
            });

            void debugTrace.append({
                scope: "overview",
                kind: "error",
                message: "evalInInspectedPage failed",
                meta: { error: res.error || "unknown error" },
            });

            return;
        }

        const snap: any = res.value;
        if (!snap || snap.ok !== true) {
            const err = String(snap?.error || "unknown snapshot error");
            setStatus("Snapshot error");
            setControls(true);

            void actionLog.append({
                kind: "error",
                scope: "overview",
                message: "Metric snapshot from page returned an error.",
                ok: false,
                error: err,
            });

            void debugTrace.append({
                scope: "overview",
                kind: "error",
                message: "snapshot returned ok=false",
                meta: { error: err, snap },
            });

            return;
        }

        const totals: OverviewTotals = {
            domNodes: safeNumber(snap.domNodes, 0),
            resTotal: safeNumber(snap.resTotal, 0),
            errTotal: safeNumber(snap.errTotal, 0),
            longTaskTotal: safeNumber(snap.longTaskTotal, 0),
        };

        model.setSample(nowMs(), totals);

        // render the numeric cards (existing)
        view.render(model.totals, model.rates, model.baselineDomNodes);

        // push a chart point only once rates exist (2nd sample and onward)
        const r = model.rates;
        if (r && model.totals) {
            const stress = computeStress({
                dom: model.totals.domNodes,
                resPerMin: r.resPerMin,
                errPerMin: r.errPerMin,
                longPerMin: r.longTaskPerMin,
            });

            model.pushPoint({
                t: Date.now(),
                dom: model.totals.domNodes,
                resPerMin: r.resPerMin,
                errPerMin: r.errPerMin,
                longPerMin: r.longTaskPerMin,
                stress,
            });

            // draw charts
            view.renderCharts(model.points);


            // charts will be wired in the next step (once view has renderCharts)
            void debugTrace.append({
                scope: "overview",
                kind: "debug",
                message: "point",
                meta: model.points[model.points.length - 1],
            });

        }

        setStatus("Monitoring");
        setControls(true);

        void debugTrace.append({
            scope: "overview",
            kind: "debug",
            message: "sample",
            meta: totals,
        });
    }

    function startPolling() {
        if (timer != null) return;

        model.clearPoints();
        model.clearBaseline();

        model.setEnabled(true);
        setStatus("Starting…");
        setControls(true);

        // immediate sample
        void sampleOnce().catch(() => null);

        timer = window.setInterval(() => {
            void sampleOnce().catch(() => null);
        }, POLL_MS);

        void actionLog.append({
            kind: "run",
            scope: "overview",
            message: "Monitoring started.",
            ok: true,
            meta: { pollMs: POLL_MS },
        });

        void debugTrace.append({
            scope: "overview",
            kind: "debug",
            message: "polling:start",
            meta: { pollMs: POLL_MS },
        });
    }

    function stopPolling() {
        if (timer != null) {
            window.clearInterval(timer);
            timer = null;
        }

        model.setEnabled(false);
        setStatus("Idle");
        setControls(false);

        void actionLog.append({
            kind: "run",
            scope: "overview",
            message: "Monitoring stopped.",
            ok: true,
        });

        void debugTrace.append({
            scope: "overview",
            kind: "debug",
            message: "polling:stop",
        });
    }

    async function onStartClick() {
        if (getBusy()) {
            setStatus("Busy");
            setControls(model.enabled);
            return;
        }
        if (model.enabled) return;
        startPolling();
    }

    async function onStopClick() {
        if (getBusy()) {
            setStatus("Busy");
            setControls(model.enabled);
            return;
        }
        if (!model.enabled) return;
        stopPolling();
    }

    const off = bus.on(() => {
        // Beezy Monitor v0: no background events yet
    });

    function bind() {
        if (bound) return;
        bound = true;

        dom.btnOvStart.addEventListener("click", () => {
            void onStartClick().catch(() => null);
        });

        dom.btnOvStop.addEventListener("click", () => {
            void onStopClick().catch(() => null);
        });
    }

    return {
        id: "overview" as const,

        refresh() {
            if (getBusy()) return;
            void sampleOnce().catch(() => null);
        },

        mount() {
            mounted = true;
            view.setEmpty();
            setStatus(model.enabled ? "Monitoring" : "Idle");
            setControls(model.enabled);
        },

        unmount() {
            mounted = false;
            stopPolling();
        },

        bind,

        dispose() {
            stopPolling();
            off();
        },
    };
}
