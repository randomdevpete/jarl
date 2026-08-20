// Redirect support for the v2 atomic model, covering what v1 did with its
// `Redirect` / `redirect()` (removed with the rest of the v1 implementation;
// see the docs site's v1 History page), exercised by the 04Redirects suite:
// a route whose `state` is a Redirect gets followed immediately on match
// (no click required), and a `resolve` function can likewise return a
// Redirect to defer the decision until after async data has loaded.
//
// v1 does this as a side effect inside RoutingProvider.doNavigation, which
// both matches a route AND performs the navigation as one imperative step.
// Atoms split that in two, on purpose:
//   - redirectRouteAtom: a *pure* RouteAtom-shaped leaf - reading it just tells
//     you whether the redirect route currently matches, exactly like any
//     other route. No side effects happen just from reading it.
//   - followRedirects: the actual effect - given a jotai store and one or
//     more redirectRouteAtoms, subscribes to them and performs the
//     history.replace-style navigation the moment one starts matching.
// This keeps the "does this match" question composable/pure (usable in
// Route/Link like any other RouteAtom) while isolating the "and now actually
// navigate" side effect into an explicit, separately-testable primitive that
// a host environment (e.g. the React bindings package) wires up once at the
// root - analogous to jotai-location's own onMount subscription, just
// exposed as a reusable function instead of hidden inside an atom.

import { Getter, atom, createStore } from "jotai/vanilla";
import { Path, splitHref } from "./href";
import { locationAtom } from "./locationAtom";
import { rootRouteAtom } from "./rootRouteAtom";
import { DefaultParams, NavOptions, RouteAtom, RouteOptions } from "./types";

/** A sentinel object meaning "actually, redirect to this instead". */
export class Redirect {
  constructor(public readonly to: Path) {}
}

/**
 * Constructs a `Redirect` sentinel object - typically returned from an `asyncRouteAtom` loader to
 * defer a redirect decision until after data has loaded.
 */
export const redirect = (to: Path): Redirect => new Redirect(to);

export const isRedirect = (value: unknown): value is Redirect => value instanceof Redirect;

/**
 * A leaf route that matches whenever its parent does, swallowing any remaining path, and whose
 * `reverse()`/write resolve to the redirect target rather than to itself. `to` may be a static
 * path or a function of `get`, for a target computed from other atoms.
 *
 * Reading it is pure: matching one navigates nowhere on its own, see `followRedirects`.
 */
export const redirectRouteAtom = <Parent extends DefaultParams = DefaultParams>(
  to: Path | ((get: Getter) => Path),
  options?: RouteOptions<Parent>,
): RouteAtom<Parent> => {
  const target = (get: Getter) => (typeof to === "function" ? to(get) : to);
  const parentAtom = options?.parent || (rootRouteAtom as RouteAtom<Parent>);

  const reverse = (get: Getter) => () => target(get);

  return atom(
    (get) => {
      const parent = get(parentAtom);
      if (!parent.match) {
        return {
          match: false,
          exact: false,
          values: undefined,
          reverse: reverse(get),
        };
      }
      return {
        match: true,
        exact: true,
        rest: { path: [] },
        reverse: reverse(get),
        values: parent.values,
      };
    },
    (get, set, _action, navOptions?: NavOptions) => {
      const [pathname, searchParams] = splitHref(target(get));
      set(
        locationAtom,
        (prev) => ({ ...prev, pathname, searchParams }),
        // Redirects replace by default (v1: `history.replace`), but an
        // explicit navOptions.replace === false can opt back into push.
        { replace: true, ...navOptions },
      );
    },
  );
};

/** A jotai store, as returned by jotai's own `createStore()`. */
export type Store = ReturnType<typeof createStore>;

/**
 * Makes redirect atoms actually navigate: subscribes to each, and replace-navigates the moment
 * one starts matching. Call once, near the root of an app, for every redirect atom you want
 * live. Returns an unsubscribe function.
 */
export const followRedirects = (store: Store, redirectRouteAtoms: ReadonlyArray<RouteAtom<any>>): (() => void) => {
  const unsubs = redirectRouteAtoms.map((route) => {
    const check = () => {
      const result = store.get(route);
      if (result.match) {
        store.set(route, {}, { replace: true });
      }
    };
    const unsub = store.sub(route, check);
    check();
    return unsub;
  });
  return () => unsubs.forEach((unsub) => unsub());
};
