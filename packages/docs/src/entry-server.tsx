import { renderToString } from "react-dom/server";
import { createStore, Provider } from "jotai";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import createEmotionServer from "@emotion/server/create-instance";
import App from "./App";
import { locationAtom, preloadAsyncRoutes } from "jarl-atoms";
import { asyncRoutes, notFoundAtom } from "./router/routes";

// Re-exported so the plain-Node prerender script (scripts/build.mjs) can drive the
// build off a single source of truth for "which paths exist", without needing to
// itself understand TypeScript module resolution.
export { staticPaths } from "./router/routes";

/** Global the client entry reads its preloaded route data back out of. */
const ROUTE_DATA_GLOBAL = "__JARL_ROUTE_DATA__";

export type RenderResult = {
  html: string;
  /** `<style>` markup and preloaded route data, to substitute into the template's `<!--app-head-->`. */
  head: string;
  /** 200, or 404 when no route exists at this path - including an async route whose lookup missed. */
  status: number;
};

/**
 * Renders the app for a given path, on the server. Each call gets its own jotai
 * store and its own emotion cache, so prerendering many routes in one process
 * can't leak state or styles between them — `jarl-atoms`' `locationAtom` keeps
 * its server-side override per-store precisely so this holds.
 *
 * Async routes are awaited before rendering, so a lookup that finds nothing is a real 404
 * in the response rather than something the page discovers after hydration.
 */
export const render = async (path: string): Promise<RenderResult> => {
  const store = createStore();
  const [rawPathname, rawSearch = ""] = path.split("?");
  store.set(locationAtom, {
    pathname: rawPathname || "/",
    searchParams: new URLSearchParams(rawSearch),
  });
  const routeData = await preloadAsyncRoutes(store, asyncRoutes);
  // The default key is what the browser-side cache adopts server-rendered styles under.
  const cache = createCache({ key: "css" });
  const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);
  const html = renderToString(
    <CacheProvider value={cache}>
      <Provider store={store}>
        <App />
      </Provider>
    </CacheProvider>,
  );
  // Escape `<` so loaded content can't close the script tag it is embedded in.
  const serialisedRouteData = JSON.stringify(routeData).replace(/</g, "\\u003c");
  return {
    html,
    head: [
      constructStyleTagsFromChunks(extractCriticalToChunks(html)),
      `<script>window.${ROUTE_DATA_GLOBAL} = ${serialisedRouteData};</script>`,
    ].join("\n"),
    status: store.get(notFoundAtom) ? 404 : 200,
  };
};
