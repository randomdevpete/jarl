// @vitest-environment jsdom

// Async data down a three-level route chain (/a/:pa/b/:pb/c/:pc), each level
// needing one 25ms lookup. Measures wall-clock time from navigation to the
// deepest level's data being in the DOM, with fresh param values per run so
// no cache is ever warm:
//   - jarl: asyncRouteAtom per level + followAsyncRoutes, which starts every
//     lookup on the location change - the levels load in parallel.
//   - react-router loaders: its own parallel mechanism, awaited by
//     router.navigate before the new tree commits.
//   - react-router Suspense cascade: each level's component use()s its own
//     fetch, so a level's lookup cannot start until its parent has rendered.
import { Suspense, use } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { asyncRouteAtom, followAsyncRoutes, locationAtom, paramRouteAtom, staticRouteAtom } from "jarl-atoms";
import { Route, Switch } from "jarl-react";
import { Provider, createStore } from "jotai";
import { Outlet, RouterProvider, createBrowserRouter, useLoaderData, useParams } from "react-router";
import { Summary, formatSummary, summarise } from "./stats";

const DELAY_MS = 25;
const SAMPLES = 25;
const WARMUP = 5;

const fetchData = (key: string): Promise<string> =>
  new Promise((resolve) => setTimeout(() => resolve(`data(${key})`), DELAY_MS));

const pathFor = (run: number) => `/a/u${run}/b/v${run}/c/w${run}`;
const leafMarker = (run: number) => `C:data(c:w${run})`;

type Harness = {
  element: React.ReactElement;
  navigate: (path: string) => void;
  dispose?: () => void;
};

const timeApp = async (create: () => Harness): Promise<Summary> => {
  window.history.replaceState(null, "", "/");
  const container = document.createElement("div");
  document.body.appendChild(container);
  const { element, navigate, dispose } = create();
  const root = createRoot(container);
  flushSync(() => root.render(element));

  const tick = () => new Promise((resolve) => setTimeout(resolve, 1));
  const times: number[] = [];
  for (let run = 0; run < WARMUP + SAMPLES; run++) {
    const start = performance.now();
    navigate(pathFor(run));
    const deadline = start + 50 * DELAY_MS;
    while (!container.innerHTML.includes(leafMarker(run))) {
      if (performance.now() > deadline) throw new Error(`no ${leafMarker(run)} within deadline`);
      await tick();
    }
    if (run >= WARMUP) times.push(performance.now() - start);
  }

  flushSync(() => root.unmount());
  dispose?.();
  container.remove();
  return summarise(times);
};

const createJarlAsyncApp = (): Harness => {
  // Param routes chain on each other, never on the async atoms, so every
  // level's lookup depends only on the URL and all three start together.
  const aRoute = paramRouteAtom("pa", { parent: staticRouteAtom("a") });
  const bRoute = paramRouteAtom("pb", { parent: staticRouteAtom("b", { parent: aRoute }) });
  const cRoute = paramRouteAtom("pc", { parent: staticRouteAtom("c", { parent: bRoute }) });
  const aAsync = asyncRouteAtom(aRoute, "dataA", ({ pa }) => fetchData(`a:${pa}`));
  const bAsync = asyncRouteAtom(bRoute, "dataB", ({ pb }) => fetchData(`b:${pb}`));
  const cAsync = asyncRouteAtom(cRoute, "dataC", ({ pc }) => fetchData(`c:${pc}`));

  const store = createStore();
  const unfollow = followAsyncRoutes(store, [aAsync, bAsync, cAsync]);
  return {
    element: (
      <Provider store={store}>
        <Switch fallback={<p>Loading</p>}>
          <Route on={aAsync}>
            {({ dataA }) => (
              <div>
                <h2>A:{dataA}</h2>
                <Switch fallback={<p>Loading</p>}>
                  <Route on={bAsync}>
                    {({ dataB }) => (
                      <div>
                        <h2>B:{dataB}</h2>
                        <Switch fallback={<p>Loading</p>}>
                          <Route on={cAsync} exact>
                            {({ dataC }) => <h2>C:{dataC}</h2>}
                          </Route>
                        </Switch>
                      </div>
                    )}
                  </Route>
                </Switch>
              </div>
            )}
          </Route>
        </Switch>
      </Provider>
    ),
    navigate: (path) => store.set(locationAtom, { pathname: path, searchParams: new URLSearchParams() }),
    dispose: unfollow,
  };
};

const createLoaderApp = (): Harness => {
  const router = createBrowserRouter([
    {
      path: "a/:pa",
      loader: ({ params }) => fetchData(`a:${params.pa}`),
      Component: () => (
        <div>
          <h2>A:{useLoaderData<string>()}</h2>
          <Outlet />
        </div>
      ),
      children: [
        {
          path: "b/:pb",
          loader: ({ params }) => fetchData(`b:${params.pb}`),
          Component: () => (
            <div>
              <h2>B:{useLoaderData<string>()}</h2>
              <Outlet />
            </div>
          ),
          children: [
            {
              path: "c/:pc",
              loader: ({ params }) => fetchData(`c:${params.pc}`),
              Component: () => <h2>C:{useLoaderData<string>()}</h2>,
            },
          ],
        },
      ],
    },
  ]);
  return {
    element: <RouterProvider router={router} />,
    navigate: (path) => void router.navigate(path),
    dispose: () => router.dispose(),
  };
};

const createCascadeApp = (): Harness => {
  // One promise per key, held across renders so use() can settle.
  const cache = new Map<string, Promise<string>>();
  const cachedFetch = (key: string): Promise<string> => {
    let promise = cache.get(key);
    if (!promise) {
      promise = fetchData(key);
      cache.set(key, promise);
    }
    return promise;
  };

  const CascadeLevel = ({ level, children }: { level: "a" | "b" | "c"; children?: React.ReactNode }) => {
    const params = useParams();
    const data = use(cachedFetch(`${level}:${params[`p${level}`]}`));
    return children ? (
      <div>
        <h2>
          {level.toUpperCase()}:{data}
        </h2>
        {children}
      </div>
    ) : (
      <h2>
        {level.toUpperCase()}:{data}
      </h2>
    );
  };

  const router = createBrowserRouter([
    {
      path: "a/:pa",
      element: (
        <CascadeLevel level="a">
          <Outlet />
        </CascadeLevel>
      ),
      children: [
        {
          path: "b/:pb",
          element: (
            <CascadeLevel level="b">
              <Outlet />
            </CascadeLevel>
          ),
          children: [{ path: "c/:pc", element: <CascadeLevel level="c" /> }],
        },
      ],
    },
  ]);
  return {
    element: (
      <Suspense fallback={<p>Loading</p>}>
        <RouterProvider router={router} />
      </Suspense>
    ),
    navigate: (path) => void router.navigate(path),
    dispose: () => router.dispose(),
  };
};

test("nested async data: parallel pre-resolution vs loaders vs a Suspense cascade", async () => {
  const jarl = await timeApp(createJarlAsyncApp);
  const loaders = await timeApp(createLoaderApp);
  const cascade = await timeApp(createCascadeApp);

  console.log(`\nNested async data, 3 levels × ${DELAY_MS}ms lookup, navigation → deepest data on screen (ms):`);
  console.log(`  jarl (followAsyncRoutes)        ${formatSummary(jarl, "ms")}`);
  console.log(`  react-router (loaders)          ${formatSummary(loaders, "ms")}`);
  console.log(`  react-router (Suspense cascade) ${formatSummary(cascade, "ms")}`);
});
