// @vitest-environment jsdom

// React's development build is fine here: without StrictMode it renders each
// component once per update, the same as production, and nothing is timed.
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createJarlApp } from "./apps/JarlApp";
import { createReactRouterApp } from "./apps/ReactRouterApp";
import type { BenchApp } from "./apps/types";
import { diffCounts, resetCounts, snapshotCounts } from "./renderCounter";
import { ITEM_COUNT, itemIds } from "./shape";
import { printTable } from "./stats";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Scenario = {
  name: string;
  /** Navigations that put the app in the scenario's starting state, excluded from its counts. */
  setup: string[];
  navigations: string[];
};

const scenarios: Scenario[] = [
  {
    name: `Param-only navigation: /items/1 → … → /items/${ITEM_COUNT} (${ITEM_COUNT - 1} navigations)`,
    setup: ["/items/1"],
    navigations: itemIds.slice(1).map((id) => `/items/${id}`),
  },
  {
    name: "Section navigation: /about ↔ /items (10 navigations)",
    setup: [],
    navigations: Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? "/about" : "/items")),
  },
  {
    name: "Re-click the already-active link: /about (10 navigations)",
    setup: ["/about"],
    navigations: Array.from({ length: 10 }, () => "/about"),
  },
];

type AppRun = {
  mountCounts: Map<string, number>;
  scenarioCounts: Map<string, Map<string, number>>;
  /** innerHTML after mount and after every navigation, in order, for cross-app parity checks. */
  html: string[];
};

const runApp = async (create: () => BenchApp): Promise<AppRun> => {
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

const comparisonRows = (jarl: Map<string, number>, reactRouter: Map<string, number>) => {
  const groups = [...new Set([...jarl.keys(), ...reactRouter.keys()])].sort();
  return groups.map((group) => [group, jarl.get(group) ?? 0, reactRouter.get(group) ?? 0]);
};

test("re-render counts per navigation, with identical rendered HTML throughout", async () => {
  const jarl = await runApp(createJarlApp);
  const reactRouter = await runApp(createReactRouterApp);

  expect(jarl.html.length).toBe(reactRouter.html.length);
  jarl.html.forEach((markup, step) => expect(markup).toBe(reactRouter.html[step]));
  expect(jarl.html.at(-1)).toContain("<h1>About</h1>");

  const header = ["component group", "jarl renders", "react-router renders"];
  printTable("Initial mount at /", header, comparisonRows(jarl.mountCounts, reactRouter.mountCounts));
  for (const { name } of scenarios) {
    printTable(name, header, comparisonRows(jarl.scenarioCounts.get(name)!, reactRouter.scenarioCounts.get(name)!));
  }
});
