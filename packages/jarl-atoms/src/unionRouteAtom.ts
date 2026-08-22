import { Getter, atom } from "jotai/vanilla";
import { RouteAtom, RouteReturn, RouteValues } from "./types";

/** One or more route atoms, in the precedence order `unionRouteAtom` falls back through. */
export type UnionRoutes = readonly [RouteAtom<any>, ...RouteAtom<any>[]];

/**
 * Combines several routes into the one route that matches wherever any of them does: it matches
 * when any member matches, and exactly when any member matches exactly. `values`, `rest` and
 * `reverse` come from the member that actually matched - the exact one where there is one,
 * otherwise the first to match, in the order given - so a chain of increasingly specific routes
 * reads as one route bound to a union of their param types.
 *
 * It composes like any other route: as a `parent`, in `<Route on={...}>`, or as the whole route
 * list handed to `notAtom`. A union has no URL shape of its own, though, so `reverse` and writes
 * go to whichever member matches, and to the first listed when none does - navigate through the
 * specific member you mean rather than through the union.
 */
export const unionRouteAtom = <Routes extends UnionRoutes>(routes: Routes): RouteAtom<RouteValues<Routes[number]>> => {
  type Values = RouteValues<Routes[number]>;
  // An ancestor is `match: true` for every location beneath it, so the leaf that actually
  // rendered is the honest source of values wherever one of the members is it.
  const matched = (get: Getter) => routes.find((route) => get(route).exact) ?? routes.find((route) => get(route).match);
  return atom(
    (get) => {
      const route = matched(get);
      if (route) {
        return get(route) as RouteReturn<Values>;
      }
      // Nothing matched, so nothing bound values or consumed path - but the first member is
      // still the union's only answer to "where would this point".
      const { reverse } = get(routes[0]);
      return { match: false, exact: false, values: undefined, reverse };
    },
    (get, set, values, navOptions) => {
      set(matched(get) ?? routes[0], values, navOptions);
    },
  );
};
