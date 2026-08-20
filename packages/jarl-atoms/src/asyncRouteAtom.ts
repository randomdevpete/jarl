import { Atom, Getter, WritableAtom, atom } from "jotai/vanilla";
import { splitHref } from "./href";
import { locationAtom } from "./locationAtom";
import { Redirect, Store, isRedirect } from "./redirectRouteAtom";
import { transformRouteAtom } from "./transformRouteAtom";
import { DefaultParams, RouteAtom } from "./types";

/**
 * Loads what a matched route needs. `undefined` means nothing exists at that address, so a route
 * gating on this loader doesn't match; a `Redirect` sends the app elsewhere instead, via
 * `followAsyncRedirects`.
 */
export type RouteLoader<T extends DefaultParams, Data> = (
  values: T,
  get: Getter,
) => Promise<Data | Redirect | undefined>;

/** An async route's matched values: its parent's, plus the loaded object under `Name`. */
export type AsyncRouteValues<T extends DefaultParams, Name extends string, Data> = T & {
  readonly [key in Name]: Data;
};

/** One async route's settled load, carried from a server render into client hydration. */
export type AsyncRouteSnapshot = {
  pathname: string;
  /** The loaded object, or `undefined` for "nothing exists here". */
  data: unknown;
};

/** What `asyncRouteAtom` returns: a route atom, plus the seams its loader is driven through. */
export type AsyncRouteAtom<T extends DefaultParams, Name extends string, Data> = RouteAtom<
  AsyncRouteValues<T, Name, Data>
> & {
  /** The load on its own, with no bearing on matching and no lifecycle to wire up. */
  readonly data: Atom<Promise<Data | Redirect | undefined>>;
  /** Whether the load for the current location has yet to settle - true only while the parent route matches. */
  readonly pending: Atom<boolean>;
  /** The settled load the match reads, written by `preloadAsyncRoutes`, `hydrateAsyncRoutes` and `followAsyncRoutes`. */
  readonly settled: WritableAtom<AsyncRouteSnapshot | null, [AsyncRouteSnapshot], void>;
};

const pathnameOf = (get: Getter): string => get(locationAtom).pathname ?? "/";

/**
 * Attaches an async load to a route, answering both "what data does this route have" and, if you
 * want it to, "does this route exist at all". `load` runs against the parent route's matched
 * values whenever the parent matches.
 *
 * Read `.data` and that is all it is - a plain async atom of the loaded value, alongside a route
 * that already matched, consumed however suits: `useAtomValue` under Suspense, jotai/utils
 * `loadable()`, or `await store.get(...)` outside React. Nothing else needs wiring up.
 *
 * ```ts
 * const productData = asyncRouteAtom(productRoute, "product", ({ id }) => api.product(id)).data;
 * ```
 *
 * Read the atom itself as a route and the load decides the match: `undefined` back means this
 * route doesn't match, so a `Switch` fallback or `notAtom` renders the not-found case, and
 * anything else matches with that object bound to `name` in the route's own `values`.
 *
 * ```ts
 * const postRoute = asyncRouteAtom(slugRoute, "post", ({ slug }) => db.findPost(slug));
 * // <Route on={postRoute} exact>{({ post }) => <PostView post={post} />}</Route>
 * ```
 *
 * Matching stays synchronous, so that second use needs the load settled into the store first:
 * `await preloadAsyncRoutes(store, routes)` before a server render, `hydrateAsyncRoutes` to seed
 * the client with what that render already loaded, and `followAsyncRoutes` once at startup to
 * keep it settled across client navigation.
 */
export const asyncRouteAtom = <T extends DefaultParams, Name extends string, Data>(
  parentAtom: RouteAtom<T>,
  name: Name,
  load: RouteLoader<T, Data>,
): AsyncRouteAtom<T, Name, Data> => {
  const dataAtom = atom(async (get) => {
    const route = get(parentAtom);
    if (!route.match) {
      return undefined;
    }
    return load(route.values, get);
  });
  const settledAtom = atom<AsyncRouteSnapshot | null>(null);
  // A snapshot taken at a different pathname says nothing about this location.
  const settledHere = (get: Getter): AsyncRouteSnapshot | undefined => {
    const settled = get(settledAtom);
    return settled && settled.pathname === pathnameOf(get) ? settled : undefined;
  };
  const route = transformRouteAtom<T, AsyncRouteValues<T, Name, Data>>(
    parentAtom,
    (values, get) => {
      const settled = settledHere(get);
      if (!settled || settled.data === undefined) {
        return undefined;
      }
      return { ...values, [name]: settled.data } as unknown as AsyncRouteValues<T, Name, Data>;
    },
    (values) => {
      const parentValues: Record<string, unknown> = { ...values };
      delete parentValues[name];
      return parentValues as unknown as T;
    },
  );
  return Object.assign(route, {
    data: dataAtom,
    pending: atom((get) => get(parentAtom).match && !settledHere(get)),
    settled: settledAtom,
  });
};

const settle = async (store: Store, route: AsyncRouteAtom<any, any, any>): Promise<AsyncRouteSnapshot> => {
  const pathname = store.get(locationAtom).pathname ?? "/";
  const settled = store.get(route.settled);
  if (settled?.pathname === pathname) {
    return settled;
  }
  const value = await store.get(route.data);
  const snapshot: AsyncRouteSnapshot = { pathname, data: isRedirect(value) ? undefined : value };
  // A navigation overtook this load; the one it triggered publishes instead.
  if ((store.get(locationAtom).pathname ?? "/") === pathname) {
    store.set(route.settled, snapshot);
  }
  return snapshot;
};

/**
 * Awaits each route's load for the store's current location and settles it, so a render that
 * follows sees the routes match, or not, synchronously - the step a server render needs before
 * it can produce HTML and a status code. Returns the snapshots, in the order given, to serialise
 * into the page for `hydrateAsyncRoutes`. Routes already settled for that location aren't loaded
 * again.
 */
export const preloadAsyncRoutes = (
  store: Store,
  routes: ReadonlyArray<AsyncRouteAtom<any, any, any>>,
): Promise<AsyncRouteSnapshot[]> => Promise.all(routes.map((route) => settle(store, route)));

/**
 * Seeds a server render's snapshots into a client store, so hydration matches the HTML it
 * received without loading anything a second time. `snapshots` are matched to `routes` by
 * position, exactly as `preloadAsyncRoutes` returned them.
 */
export const hydrateAsyncRoutes = (
  store: Store,
  routes: ReadonlyArray<AsyncRouteAtom<any, any, any>>,
  snapshots: ReadonlyArray<AsyncRouteSnapshot>,
): void => {
  routes.forEach((route, index) => {
    const snapshot = snapshots[index];
    if (snapshot) {
      store.set(route.settled, snapshot);
    }
  });
};

/**
 * Keeps async routes settled as the location changes: re-runs each load on navigation and
 * publishes what it finds. Call once near the root of a client app, after `hydrateAsyncRoutes`.
 * Returns an unsubscribe function.
 */
export const followAsyncRoutes = (store: Store, routes: ReadonlyArray<AsyncRouteAtom<any, any, any>>): (() => void) => {
  // Subscribed to the location rather than to each `data` atom: subscribing to an async atom
  // mounts it, which would run every load up front, including ones hydration already answered.
  const reload = () => routes.forEach((route) => void settle(store, route));
  const unsubscribe = store.sub(locationAtom, reload);
  reload();
  return unsubscribe;
};

/**
 * Follows any `Redirect` a loader produces, replace-navigating to its target - the async-loading
 * counterpart of `followRedirects`. Takes the `data` atoms to watch. Returns an unsubscribe
 * function.
 */
export const followAsyncRedirects = (store: Store, dataAtoms: ReadonlyArray<Atom<Promise<unknown>>>): (() => void) => {
  const unsubs = dataAtoms.map((data) => {
    const check = () => {
      store.get(data).then((value) => {
        if (isRedirect(value)) {
          const [pathname, searchParams] = splitHref(value.to);
          store.set(locationAtom, (prev) => ({ ...prev, pathname, searchParams }), { replace: true });
        }
      });
    };
    const unsub = store.sub(data, check);
    check();
    return unsub;
  });
  return () => unsubs.forEach((unsub) => unsub());
};
