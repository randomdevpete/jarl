// Heavily borrowed from Wouter

import { Getter, atom } from "jotai/vanilla";
import { splitHref } from "./href";
import { locationAtom } from "./locationAtom";
import { rootAtom } from "./rootAtom";
import { DefaultParams, RouteAtom, RouteOptions } from "./types";

// Earlier design sketches (a tuple-shaped RouteReturn, a pattern-string-driven
// routeAtom overload, and the type plumbing they'd need) were explored here
// and are preserved with context in ../DESIGN-NOTES.md rather than dropped.

/**
 * The primitive every other route atom is built from. `matchPath` decides whether the next
 * unconsumed path segment matches, and to what param values; `makePath` is its inverse, used by
 * `reverse`. Reach for it directly when `staticRouteAtom`/`paramRouteAtom` don't fit - custom
 * segment syntax, regex constraints and the like.
 */
export const routeAtom = <T extends DefaultParams = DefaultParams, Parent extends DefaultParams = DefaultParams>(
  matchPath: (path: string, get: Getter) => T | undefined,
  makePath: (values: T, get: Getter) => string,
  options?: RouteOptions<Parent>,
): RouteAtom<T & Parent> => {
  const parentAtom = options?.parent || (rootAtom as RouteAtom<Parent>);
  // TODO: To avoid unnecessary recomputes we should be caching a memoization of the unmatched
  // state, this way we won't recalculate all leaves of an unmatched branch
  const reverse = (get: Getter) => (values: T) => {
    const parent = get(parentAtom);
    const parentPath = parent.reverse(values as unknown as Parent);
    // TODO: Combine query parameters too
    return parentPath === "/" ? parentPath + makePath(values, get) : parentPath + "/" + makePath(values, get);
  };
  return atom(
    (get) => {
      const parent = get(parentAtom);
      let values: T | undefined;
      if (!parent.match || !(values = matchPath(parent.rest.path[0], get))) {
        return {
          reverse: reverse(get),
          match: false,
          exact: false,
          values: undefined,
        };
      }
      const rest = { path: parent.rest.path.slice(1) };
      return {
        reverse: reverse(get),
        match: true,
        exact: rest.path.length === 0,
        rest,
        values: { ...values, ...parent.values },
      };
    },
    (get, set, action, navOptions) => {
      // Every write recomputes the full href (path, and query if any query
      // atoms are composed into this chain via `reverse`) and replaces the
      // location wholesale - a route only ever preserves the query params it
      // explicitly declares, matching v1's per-route stringify semantics.
      const [pathname, searchParams] = splitHref(reverse(get)(action));
      set(locationAtom, (prev) => ({ ...prev, pathname, searchParams }), navOptions);
    },
  );
};
