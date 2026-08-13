// Per-route async data loading, covering v1's `resolve`/`resolved`/
// `mapResolved` (RoutingProvider.js `doNavigation`'s Promise-chain reduction,
// routing.js's `mapResolvedToProps`), used by the advanced-routing gallery
// demo to fetch gallery item data once a route matches.
//
// v1 had to hand-build all of this: a reducer chain to run resolvers in
// series, a `resolved` object threaded through context, `mapResolvedToProps`
// to pick specific props out of it, and special-casing so a resolver
// returning a Redirect aborts the chain (RoutingProvider.js:255-270).
//
// None of that state machine needs porting: it's exactly what jotai's async
// atoms already give you. `resolvedAtom` below is a plain
// `atom(async (get) => ...)` - reading it through `get()` inside another
// async atom's body automatically awaits it and dedupes/caches via jotai's
// own dependency graph, which is the "run resolvers in series, only once"
// behaviour v1 built by hand. "mapResolved" likewise doesn't need its own
// primitive: it's just `atom(async (get) => mapFn(await get(resolvedAtom)))`
// - ordinary jotai derivation, so it's deliberately not reimplemented here.
// A resolver returning a Redirect (see redirectAtom.ts) is exposed as-is on
// the resolved value; `followResolvedRedirects` is the effect that turns
// that into an actual navigation, mirroring `followRedirects` for
// redirectAtom.

import { Atom, Getter, atom } from "jotai/vanilla";
import { splitHref } from "./href";
import { DefaultParams, RouteAtom, locationAtom } from "./routeAtom";
import { Redirect, isRedirect } from "./redirectAtom";
import type { Store } from "./redirectAtom";

/** Loads the data a matched route needs. Returning a `Redirect` sends the app elsewhere instead. */
export type Resolver<T extends DefaultParams, Data> = (values: T, get: Getter) => Promise<Data | Redirect>;

/**
 * Runs `resolver` whenever `routeAtom` matches, resolving to `undefined` when it doesn't. This
 * is a plain async atom, so observe it however suits: `useAtomValue` + Suspense, jotai/utils
 * `loadable()` for a non-suspending pending/hasData/hasError view, or `await
 * store.get(resolvedAtom)` outside React entirely.
 */
export const resolvedAtom = <T extends DefaultParams, Data>(
  routeAtom: RouteAtom<T>,
  resolver: Resolver<T, Data>,
): Atom<Promise<Data | Redirect | undefined>> =>
  atom(async (get) => {
    const route = get(routeAtom);
    if (!route.match) {
      return undefined;
    }
    return resolver(route.values, get);
  });

/**
 * Follows any `Redirect` a resolver produces, replace-navigating to its target - the
 * async-loading counterpart of `followRedirects`. Returns an unsubscribe function.
 */
export const followResolvedRedirects = (
  store: Store,
  resolvedAtoms: ReadonlyArray<Atom<Promise<unknown>>>,
): (() => void) => {
  const unsubs = resolvedAtoms.map((resolved) => {
    const check = () => {
      store.get(resolved).then((value) => {
        if (isRedirect(value)) {
          const [pathname, searchParams] = splitHref(value.to);
          store.set(locationAtom, (prev) => ({ ...prev, pathname, searchParams }), { replace: true });
        }
      });
    };
    const unsub = store.sub(resolved, check);
    check();
    return unsub;
  });
  return () => unsubs.forEach((unsub) => unsub());
};
