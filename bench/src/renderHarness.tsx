// Shared jsdom render-count harness: mounts an app, navigates it by clicking
// its own links, and tallies renders per component group and scenario.
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { BenchApp } from "./apps/types";
import { diffCounts, resetCounts, snapshotCounts } from "./renderCounter";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export type Scenario = {
  name: string;
  /** Navigations that put the app in the scenario's starting state, excluded from its counts. */
  setup: string[];
  navigations: string[];
};

export type AppRun = {
  mountCounts: Map<string, number>;
  scenarioCounts: Map<string, Map<string, number>>;
  /** innerHTML after mount and after every navigation, in order, for cross-app parity checks. */
  html: string[];
};

export const runApp = async (create: () => BenchApp, scenarios: Scenario[]): Promise<AppRun> => {
  window.history.replaceState(null, "", "/");
  resetCounts();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const { element, dispose } = create();
  const root = createRoot(container);

  const html: string[] = [];
  const clickHref = async (href: string) => {
    const anchor = container.querySelector<HTMLAnchorElement>(`a[href="${href}"]`);
    if (!anchor) throw new Error(`no link with href ${href}`);
    await act(async () => anchor.click());
    html.push(container.innerHTML);
  };

  const before = snapshotCounts();
  await act(async () => root.render(element));
  html.push(container.innerHTML);
  const mountCounts = diffCounts(before);

  const scenarioCounts = new Map<string, Map<string, number>>();
  for (const scenario of scenarios) {
    for (const href of scenario.setup) await clickHref(href);
    const beforeScenario = snapshotCounts();
    for (const href of scenario.navigations) await clickHref(href);
    scenarioCounts.set(scenario.name, diffCounts(beforeScenario));
  }

  await act(async () => root.unmount());
  dispose?.();
  container.remove();
  return { mountCounts, scenarioCounts, html };
};

/** One row per component group: the group name, then each run's count in order. */
export const comparisonRows = (runs: Map<string, number>[]): (string | number)[][] => {
  const groups = [...new Set(runs.flatMap((run) => [...run.keys()]))].sort();
  return groups.map((group) => [group, ...runs.map((run) => run.get(group) ?? 0)]);
};

export const assertHtmlParity = (runs: AppRun[]) => {
  const [first, ...rest] = runs;
  for (const run of rest) {
    expect(run.html.length).toBe(first.html.length);
    first.html.forEach((markup, step) => expect(run.html[step]).toBe(markup));
  }
};
