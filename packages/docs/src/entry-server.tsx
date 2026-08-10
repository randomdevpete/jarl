import { renderToString } from "react-dom/server";
import { createStore, Provider } from "jotai";
import App from "./App";
import { locationAtom } from "jarl-atoms";

// Re-exported so the plain-Node prerender script (scripts/build.mjs) can drive the
// build off a single source of truth for "which paths exist", without needing to
// itself understand TypeScript module resolution.
export { staticPaths } from "./router/routes";

export type RenderResult = {
    html: string;
};

/**
 * Renders the app for a given path, on the server. Each call gets its own jotai
 * store, so prerendering many routes in one process can't leak state between
 * them — `jarl-atoms`' `locationAtom` keeps its server-side override per-store
 * precisely so this holds.
 */
export const render = (path: string): RenderResult => {
    const store = createStore();
    const [rawPathname, rawSearch = ""] = path.split("?");
    store.set(locationAtom, {
        pathname: rawPathname || "/",
        searchParams: new URLSearchParams(rawSearch),
    });
    const html = renderToString(
        <Provider store={store}>
            <App />
        </Provider>,
    );
    return { html };
};
