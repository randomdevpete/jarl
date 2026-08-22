import { Atom, atom } from "jotai/vanilla";
import { RouteAtom } from "./types";

/** Options for `notAtom`. */
export type NotOptions = {
  /**
   * Whether only an exact (leaf) match counts as matching, rather than an ancestor match too.
   * Defaults to `true`.
   */
  exact?: boolean;
};

/**
 * Matches when `route` doesn't - the inverse of a router's full route list, for a
 * catch-all/not-found case. Combine every route the app renders into one `unionRouteAtom` to
 * negate the lot: `notAtom(unionRouteAtom([homeRoute, postRoute, ...]))`.
 *
 * Exactness is what counts by default: an ancestor route (or `rootAtom` itself) can be
 * `match: true` without being the leaf that actually rendered, and only the leaf's exactness
 * should decide whether anything was found. Pass `{ exact: false }` where an ancestor match
 * should count too.
 */
export const notAtom = (route: RouteAtom<any>, { exact = true }: NotOptions = {}): Atom<boolean> =>
  atom((get) => {
    const matched = get(route);
    return !(exact ? matched.exact : matched.match);
  });
