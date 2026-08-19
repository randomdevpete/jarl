// @vitest-environment jsdom

// Wall-clock cost of one deep navigation with React included: click a link,
// re-render and commit the five-level tree. Same three apps as
// deepRenders.test.tsx, which also asserts their HTML is identical. React's
// production build has no `act`, so each click is wrapped in `flushSync`,
// which commits the resulting render before returning; passive effects
// (jotai subscribes in one) need a macrotask turn, granted between samples.
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { createJarlDeepApp } from "./apps/deep/JarlDeepApp";
import { createReactRouterDeclarativeDeepApp, createReactRouterDeepApp } from "./apps/deep/ReactRouterDeepApps";
import type { BenchApp } from "./apps/types";
import { deepPath } from "./shapeDeep";
import { Summary, formatSummary, summarise } from "./stats";

const hrefA = deepPath({ p5: "a" });
const hrefB = deepPath({ p5: "b" });

const settle = () => new Promise((resolve) => setTimeout(resolve));

/** Passive effects (jotai subscribes in one) may need several macrotask turns under load. */
const settleUntil = async (committed: () => boolean) => {
  const deadline = performance.now() + 2000;
  while (!committed()) {
    if (performance.now() > deadline) throw new Error("navigation did not commit");
    await settle();
  }
};

const timeApp = async (create: () => BenchApp): Promise<Summary> => {
  window.history.replaceState(null, "", "/");
  const container = document.createElement("div");
  document.body.appendChild(container);
  const { element, dispose } = create();
  const root = createRoot(container);
  flushSync(() => root.render(element));
  await settle();

  const anchorFor = (href: string) => {
    const anchor = container.querySelector<HTMLAnchorElement>(`a[href="${href}"]`);
    if (!anchor) throw new Error(`no link with href ${href}`);
    return anchor;
  };
  flushSync(() => anchorFor(hrefA).click());
  await settleUntil(() => container.innerHTML.includes("L5:a"));

  const anchors = [anchorFor(hrefB), anchorFor(hrefA)];
  const samples = 20;
  const warmup = 5;
  const iterations = 200;
  let flip = 0;
  const times: number[] = [];
  for (let s = 0; s < warmup + samples; s++) {
    await settle();
    globalThis.gc?.();
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      flushSync(() => anchors[flip++ % 2].click());
    }
    const elapsed = performance.now() - start;
    // The last click was to B when `flip` is odd: proves every click really navigated.
    const expected = flip % 2 === 1 ? "L5:b" : "L5:a";
    if (!container.innerHTML.includes(expected)) throw new Error(`expected ${expected} after sample`);
    if (s >= warmup) times.push((elapsed * 1000) / iterations);
  }

  flushSync(() => root.unmount());
  dispose?.();
  container.remove();
  return summarise(times);
};

test("deep navigation, React render and commit included (leaf param toggle)", async () => {
  const jarl = await timeApp(createJarlDeepApp);
  const dataRouter = await timeApp(createReactRouterDeepApp);
  const declarative = await timeApp(createReactRouterDeclarativeDeepApp);

  console.log("\nDeep navigation, per click (5 levels, React included):");
  console.log(`  jarl                   ${formatSummary(jarl)}`);
  console.log(`  react-router (data)    ${formatSummary(dataRouter)}`);
  console.log(`  react-router <Routes>  ${formatSummary(declarative)}`);
});
