import { hydrateRoot } from "react-dom/client";
import { createStore, Provider } from "jotai";
import { AsyncRouteSnapshot, followAsyncRoutes, hydrateAsyncRoutes } from "jarl-atoms";
import App from "./App";
import { asyncRoutes } from "./router/routes";

declare global {
  interface Window {
    /** Async-route lookups the server render already did, embedded by src/entry-server.tsx. */
    __JARL_ROUTE_DATA__?: AsyncRouteSnapshot[];
  }
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root element");
}

const store = createStore();
// Seeded before hydration so the first client render matches the HTML without a second lookup.
hydrateAsyncRoutes(store, asyncRoutes, window.__JARL_ROUTE_DATA__ ?? []);
followAsyncRoutes(store, asyncRoutes);

hydrateRoot(
  root,
  <Provider store={store}>
    <App />
  </Provider>,
);
