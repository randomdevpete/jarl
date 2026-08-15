import { Atom, Getter, WritableAtom, atom } from "jotai/vanilla";
import { locationAtom } from "./locationAtom";
import { Redirect, Store, isRedirect } from "./redirectAtom";
import { Resolver, resolvedAtom } from "./resolvedAtom";
import { transformRouteAtom } from "./transformRouteAtom";
import { DefaultParams, RouteAtom } from "./types";

/**
 * Looks a matched route's params up in an async source. `undefined` means nothing exists at that
 * address, so the route doesn't match; a `Redirect` sends the app elsewhere instead, via
 * `followResolvedRedirects`.
 */
export type RouteLookup<T extends DefaultParams, Data> = Resolver<T, Data | undefined>;

/** An async route's matched values: its parent's, plus the looked-up object under `Name`. */
export type AsyncRouteValues<T extends DefaultParams, Name extends string, Data> = T & {
  readonly [key in Name]: Data;
};

/** One async route's settled lookup, carried from a server render into client hydration. */
export type AsyncRouteSnapshot = {
  pathname: string;
  /** The looked-up object, or `undefined` for "nothing exists here". */
  data: unknown;
};

/** What `asyncRouteAtom` returns: a route atom, plus the seams its lookup is driven through. */
export type AsyncRouteAtom<T extends DefaultParams, Name extends string, Data> = RouteAtom<
  AsyncRouteValues<T, Name, Data>
> & {
  /** The lookup itself, to consume with `useAtomValue` under Suspense or pass to `followResolvedRedirects`. */
  readonly lookup: Atom<Promise<Data | Redirect | undefined>>;
  /** Whether the lookup for the current location has yet to settle - true only while the parent route matches. */
  readonly pending: Atom<boolean>;
  /** The settled lookup the match reads, written by `preloadRoutes`, `hydrateAsyncRoutes` and `followAsyncRoutes`. */
  readonly settled: WritableAtom<AsyncRouteSnapshot | null, [AsyncRouteSnapshot], void>;
};

const pathnameOf = (get: Getter): string => get(locationAtom).pathname ?? "/";

/**
 * A route that exists only if an async lookup says so. `lookup` runs against the parent route's
 * matched values; `undefined` back means this route doesn't match, so a `Switch` fallback or
 * `notAtom` renders the not-found case, and anything else matches with that object bound to
 * `name` in the route's own `values` - one lookup answering both "does this exist" and "what is
 * it".
 *
 * ```ts
 * const postRoute = asyncRouteAtom(slugRoute, "post", ({ slug }) => db.findPost(slug));
 * // <Route on={postRoute} exact>{({ post }) => <PostView post={post} />}</Route>
 * ```
 *
 * Matching stays synchronous, so the lookup must be settled into the store first: `await
 * preloadRoutes(store, routes)` before a server render, `hydrateAsyncRoutes` to seed the client
 * with what that render already loaded, and `followAsyncRoutes` once at startup to keep it
 * settled across client navigation.
 */
export const asyncRouteAtom = <T extends DefaultParams, Name extends string, Data>(
  parentAtom: RouteAtom<T>,
  name: Name,
  lookup: RouteLookup<T, Data>,
): AsyncRouteAtom<T, Name, Data> => {
  const lookupAtom = resolvedAtom<T, Data | undefined>(parentAtom, lookup);
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
    lookup: lookupAtom,
    pending: atom((get) => get(parentAtom).match && !settledHere(get)),
    settled: settledAtom,
  });
};

const load = async (store: Store, route: AsyncRouteAtom<any, any, any>): Promise<AsyncRouteSnapshot> => {
  const pathname = store.get(locationAtom).pathname ?? "/";
  const settled = store.get(route.settled);
  if (settled?.pathname === pathname) {
    return settled;
  }
  const value = await store.get(route.lookup);
  const snapshot: AsyncRouteSnapshot = { pathname, data: isRedirect(value) ? undefined : value };
  // A navigation overtook this lookup; the load it triggered publishes instead.
  if ((store.get(locationAtom).pathname ?? "/") === pathname) {
    store.set(route.settled, snapshot);
  }
  return snapshot;
};

/**
 * Awaits each route's lookup for the store's current location and settles it, so a render that
 * follows sees the routes match, or not, synchronously - the step a server render needs before
 * it can produce HTML and a status code. Returns the snapshots, in the order given, to serialise
 * into the page for `hydrateAsyncRoutes`. Routes already settled for that location aren't looked
 * up again.
 */
export const preloadRoutes = (
  store: Store,
  routes: ReadonlyArray<AsyncRouteAtom<any, any, any>>,
): Promise<AsyncRouteSnapshot[]> => Promise.all(routes.map((route) => load(store, route)));

/**
 * Seeds a server render's snapshots into a client store, so hydration matches the HTML it
 * received without looking anything up a second time. `snapshots` are matched to `routes` by
 * position, exactly as `preloadRoutes` returned them.
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
 * Keeps async routes settled as the location changes: re-runs each lookup on navigation and
 * publishes what it finds. Call once near the root of a client app, after `hydrateAsyncRoutes`.
 * Returns an unsubscribe function.
 */
export const followAsyncRoutes = (store: Store, routes: ReadonlyArray<AsyncRouteAtom<any, any, any>>): (() => void) => {
  // Subscribed to the location rather than to each `lookup`: subscribing to an async atom mounts
  // it, which would run every lookup up front, including ones hydration already answered.
  const reload = () => routes.forEach((route) => void load(store, route));
  const unsubscribe = store.sub(locationAtom, reload);
  reload();
  return unsubscribe;
};
