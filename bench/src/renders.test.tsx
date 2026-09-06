// @vitest-environment jsdom

// React's development build is fine here: without StrictMode it renders each
// component once per update, the same as production, and nothing is timed.
import { createJarlApp } from "./apps/JarlApp";
import { createReactRouterApp } from "./apps/ReactRouterApp";
import { Scenario, assertHtmlParity, comparisonRows, runApp } from "./renderHarness";
import { ITEM_COUNT, itemIds } from "./shape";
import { printTable } from "./stats";

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

test("re-render counts per navigation, with identical rendered HTML throughout", async () => {
  const jarl = await runApp(createJarlApp, scenarios);
  const reactRouter = await runApp(createReactRouterApp, scenarios);

  assertHtmlParity([jarl, reactRouter]);
  expect(jarl.html.at(-1)).toContain("<h1>About</h1>");

  const header = ["component group", "jarl renders", "react-router renders"];
  printTable("Initial mount at /", header, comparisonRows([jarl.mountCounts, reactRouter.mountCounts]));
  for (const { name } of scenarios) {
    printTable(name, header, comparisonRows([jarl.scenarioCounts.get(name)!, reactRouter.scenarioCounts.get(name)!]));
  }
});
