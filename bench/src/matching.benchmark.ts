// Raw matching throughput, React excluded. Workloads are defined by outcome
// rather than mechanics; see ../README.md for what each one covers and why.
import { createStore } from "jotai/vanilla";
import { locationAtom, paramRouteAtom, staticRouteAtom } from "jarl-atoms";
import { createMemoryRouter, matchRoutes } from "react-router";
import { formatSummary, measure, measureAsync } from "./stats";

const SECTION_COUNT = 50;

const sections = Array.from({ length: SECTION_COUNT }, (_, i) => staticRouteAtom(`s${i}`));
const leaves = sections.map((section) => paramRouteAtom("id", { parent: section }));

const routeConfig = Array.from({ length: SECTION_COUNT }, (_, i) => ({
  path: `/s${i}`,
  children: [{ path: ":id" }],
}));

// Early, mid and late table hits plus a miss, cycled so neither library can
// specialise on one branch position.
const paths = ["/s0/1", "/s25/123", "/s49/9", "/no-such-section/404"];

type Store = ReturnType<typeof createStore>;

// Reads leaves in order and stops at the first match, as Switch's own findIndex does.
const resolveJarl = (store: Store, pathname: string): number => {
  store.set(locationAtom, { pathname, searchParams: new URLSearchParams() });
  for (let i = 0; i < SECTION_COUNT; i++) {
    if (store.get(leaves[i]).match) return i;
  }
  return -1;
};

test(`resolve: URL string in, matched leaf out (${SECTION_COUNT} sections × static + :id param)`, () => {
  let cursor = 0;
  const nextPath = () => paths[cursor++ % paths.length];

  const warmStore = createStore();
  const jarlWarm = measure(() => {
    resolveJarl(warmStore, nextPath());
  });
  const jarlCold = measure(() => {
    resolveJarl(createStore(), nextPath());
  });
  const reactRouter = measure(() => {
    matchRoutes(routeConfig, nextPath());
  });

  console.log(`\nResolve, per URL (${SECTION_COUNT * 2}-route table):`);
  console.log(`  jarl (warm store)   ${formatSummary(jarlWarm)}`);
  console.log(`  jarl (cold store)   ${formatSummary(jarlCold)}`);
  console.log(`  react-router        ${formatSummary(reactRouter)}`);
});

test("navigate: one client-side navigation through each library's API", async () => {
  const store = createStore();
  let n = 0;
  const jarl = measure(() => {
    n++;
    store.set(leaves[n % SECTION_COUNT], { id: String(n) });
    for (let i = 0; i < SECTION_COUNT; i++) {
      if (store.get(leaves[i]).match) break;
    }
  });

  const router = createMemoryRouter(routeConfig, { initialEntries: ["/s0/1"] });
  let m = 0;
  const reactRouter = await measureAsync(async () => {
    m++;
    await router.navigate(`/s${m % SECTION_COUNT}/${m}`);
    if (router.state.matches.length === 0) throw new Error("no match");
  });
  router.dispose();

  console.log(`\nNavigate, per navigation (${SECTION_COUNT * 2}-route table):`);
  console.log(`  jarl (atom write + re-read)      ${formatSummary(jarl)}`);
  console.log(`  react-router (router.navigate)   ${formatSummary(reactRouter)}`);
});
