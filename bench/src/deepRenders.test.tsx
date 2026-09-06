// @vitest-environment jsdom

// Five-level nested routing: jarl's Switch/Route atoms against both
// react-router forms. Deterministic render counts, no timing.
import { createJarlDeepApp } from "./apps/deep/JarlDeepApp";
import { createReactRouterDeclarativeDeepApp, createReactRouterDeepApp } from "./apps/deep/ReactRouterDeepApps";
import { Scenario, assertHtmlParity, comparisonRows, runApp } from "./renderHarness";
import { deepPath } from "./shapeDeep";
import { printTable } from "./stats";

const toggle = (overridesA: Record<string, string>, overridesB: Record<string, string>) =>
  Array.from({ length: 10 }, (_, i) => deepPath(i % 2 === 0 ? overridesA : overridesB));

const scenarios: Scenario[] = [
  {
    name: "Leaf param toggle: only :p5 changes (10 navigations)",
    setup: [deepPath({ p5: "a" })],
    navigations: toggle({ p5: "b" }, { p5: "a" }),
  },
  {
    name: "Mid param toggle: only :p3 changes (10 navigations)",
    setup: [deepPath({ p3: "a" })],
    navigations: toggle({ p3: "b" }, { p3: "a" }),
  },
  {
    name: "Root param toggle: only :p1 changes (10 navigations)",
    setup: [deepPath({ p1: "a" })],
    navigations: toggle({ p1: "b" }, { p1: "a" }),
  },
];

test("deep nesting: re-render counts per navigation, with identical rendered HTML throughout", async () => {
  const jarl = await runApp(createJarlDeepApp, scenarios);
  const dataRouter = await runApp(createReactRouterDeepApp, scenarios);
  const declarative = await runApp(createReactRouterDeclarativeDeepApp, scenarios);

  assertHtmlParity([jarl, dataRouter, declarative]);
  expect(jarl.html.at(-1)).toContain("L5:x");

  const header = ["component group", "jarl", "rr data router", "rr <Routes>"];
  printTable(
    "Initial mount at /",
    header,
    comparisonRows([jarl.mountCounts, dataRouter.mountCounts, declarative.mountCounts]),
  );
  for (const { name } of scenarios) {
    printTable(
      name,
      header,
      comparisonRows([
        jarl.scenarioCounts.get(name)!,
        dataRouter.scenarioCounts.get(name)!,
        declarative.scenarioCounts.get(name)!,
      ]),
    );
  }
});
