import { renderToString } from "react-dom/server";
import { createStore, Provider } from "jotai";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import createEmotionServer from "@emotion/server/create-instance";
import App from "./App";
import { locationAtom } from "jarl-atoms";

// Re-exported so the plain-Node prerender script (scripts/build.mjs) can drive the
// build off a single source of truth for "which paths exist", without needing to
// itself understand TypeScript module resolution.
export { staticPaths } from "./router/routes";

export type RenderResult = {
  html: string;
  /** `<style>` markup for every rule the page uses, to substitute into the template's `<!--app-head-->`. */
  head: string;
};

/**
 * Renders the app for a given path, on the server. Each call gets its own jotai
 * store and its own emotion cache, so prerendering many routes in one process
 * can't leak state or styles between them — `jarl-atoms`' `locationAtom` keeps
 * its server-side override per-store precisely so this holds.
 */
export const render = (path: string): RenderResult => {
  const store = createStore();
  const [rawPathname, rawSearch = ""] = path.split("?");
  store.set(locationAtom, {
    pathname: rawPathname || "/",
    searchParams: new URLSearchParams(rawSearch),
  });
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
  return { html, head: constructStyleTagsFromChunks(extractCriticalToChunks(html)) };
};
