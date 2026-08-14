import { Atom, atom } from "jotai/vanilla";
import { RouteAtom } from "./routeAtom";

/**
 * Matches when none of the given route atoms are an exact match - the
 * inverse of a router's full route list, for a catch-all/not-found case.
 * Checks `exact` rather than `match`: an ancestor route (or `rootAtom`
 * itself) can be `match: true` without being the leaf that actually
 * rendered, and only the leaf's exactness should count.
 */
export const notAtom = (...routes: RouteAtom<any>[]): Atom<boolean> =>
  atom((get) => !routes.some((route) => get(route).exact));
