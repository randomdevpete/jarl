import { useCallback, useMemo } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { DefaultParams, RouteAtom } from "jarl-atoms";

// Re-export jotai's own primitive hooks. Per jotai convention (see
// jotai-location, jotai-utils, etc), a bindings package built on atoms
// re-exports the hooks its own conveniences are built from, so consumers
// don't need a separate direct dependency on jotai for the common cases.
export { useAtom, useAtomValue, useSetAtom };

/**
 * Subscribes to a route atom and returns its current match state
 * (`match`, `exact`, `values`, `reverse`, ...). Equivalent to
 * `useAtomValue(routeAtom)`, given a name that reads naturally at call
 * sites and mirrors `useRoute` conventions in other routers.
 */
export function useRoute<T extends DefaultParams>(routeAtom: RouteAtom<T>) {
  return useAtomValue(routeAtom);
}

/**
 * Returns a stable `navigate` function bound to a specific route atom.
 * Calling it with param values pushes a new location (mirrors v1's
 * `navigate` callback injected by the `routing` HOC, but scoped to one
 * route atom rather than the whole router).
 */
export function useNavigate<T extends DefaultParams>(routeAtom: RouteAtom<T>) {
  const setRoute = useSetAtom(routeAtom);
  return useCallback((to: T) => setRoute(to), [setRoute]);
}

/**
 * Returns whether a route atom currently matches - optionally requiring an
 * exact (leaf) match rather than matching because a descendant route is
 * active too. Mirrors v1's `isActive`.
 */
export function useIsActive<T extends DefaultParams>(
  routeAtom: RouteAtom<T>,
  { exact = false }: { exact?: boolean } = {},
): boolean {
  const route = useAtomValue(routeAtom);
  return exact ? route.exact : route.match;
}

/**
 * Reverses a route atom's pattern with the given param values into a URL
 * path. Mirrors v1's `stringify`. Note this still subscribes to the route
 * atom (reverse depends on ancestor state), so it re-renders on navigation
 * even though the returned href for unrelated params may not change.
 */
export function useHref<T extends DefaultParams>(routeAtom: RouteAtom<T>, to: T): string {
  const { reverse } = useAtomValue(routeAtom);
  return useMemo(() => reverse(to), [reverse, to]);
}

export type UseLinkResult = {
  href: string;
  active: boolean;
  /** Attach directly to a native element's onClick, or call with no args. */
  onClick: (event?: { preventDefault?: () => void }) => void;
};

export type UseLinkOptions = {
  /** Only report `active` for an exact match, rather than any ancestor route too. */
  exact?: boolean;
};

/**
 * The hook `Link` is built on top of. Combines `href`, `active` state and a
 * navigation handler for a route atom + param values, so link-like
 * components can be built without needing the `Link` component itself.
 */
export function useLink<T extends DefaultParams>(
  routeAtom: RouteAtom<T>,
  to: T,
  { exact = false }: UseLinkOptions = {},
): UseLinkResult {
  const [route, setRoute] = useAtom(routeAtom);
  const { match, exact: isExact, reverse } = route;
  const active = exact ? isExact : match;
  const href = useMemo(() => reverse(to), [reverse, to]);
  const onClick = useCallback(
    (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.();
      setRoute(to);
    },
    [setRoute, to],
  );
  return { href, active, onClick };
}
