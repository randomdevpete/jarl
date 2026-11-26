import { useCallback, useMemo } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { DefaultParams, NavOptions, RouteAtom } from "jarl-atoms";
import { isActive } from "./isActive";

// Re-export jotai's own primitive hooks. Per jotai convention (see
// jotai-location, jotai-utils, etc), a bindings package built on atoms
// re-exports the hooks its own conveniences are built from, so consumers
// don't need a separate direct dependency on jotai for the common cases.
export { useAtom, useAtomValue, useSetAtom };

/**
 * Subscribes to a route atom and returns its current match state (`match`, `exact`, `values`,
 * `reverse`, ...). Equivalent to `useAtomValue(routeAtom)`.
 */
export function useRoute<T extends DefaultParams>(routeAtom: RouteAtom<T>) {
  return useAtomValue(routeAtom);
}

/**
 * Returns a stable `navigate` function bound to one route atom. Calling it with param values
 * pushes a new location; pass `{ replace: true }` as a second argument for a replace navigation,
 * mirroring the route atom's own setter (`set(routeAtom, values, { replace: true })`).
 */
export function useNavigate<T extends DefaultParams>(routeAtom: RouteAtom<T>) {
  const setRoute = useSetAtom(routeAtom);
  return useCallback((to: T, options?: NavOptions) => setRoute(to, options), [setRoute]);
}

/**
 * Returns whether a route atom currently matches - optionally requiring an exact (leaf) match,
 * rather than matching because a descendant route is active too.
 */
export function useIsActive<T extends DefaultParams>(
  routeAtom: RouteAtom<T>,
  { exact = false }: { exact?: boolean } = {},
): boolean {
  return isActive(useAtomValue(routeAtom), exact);
}

/**
 * Reverses a route atom's pattern with the given param values into a URL path. Still subscribes
 * to the route atom, since `reverse` depends on ancestor state, so it re-renders on navigation
 * even when the returned href doesn't change.
 */
export function useHref<T extends DefaultParams>(routeAtom: RouteAtom<T>, to: T): string {
  const { reverse } = useAtomValue(routeAtom);
  return useMemo(() => reverse(to), [reverse, to]);
}

/** Everything a link-like component needs: where it points, whether it's active, and how to follow it. */
export type UseLinkResult = {
  href: string;
  active: boolean;
  /**
   * Attach directly to a native element's onClick, or call with no args. On an `<a href>`, a
   * modified or non-primary click, a `target` other than `_self` or a `download` link is left to
   * the browser, so "open in new tab" keeps working. A click an earlier handler has already
   * default-prevented doesn't navigate; call `onClick()` with no event to navigate regardless.
   */
  onClick: (event?: { preventDefault?: () => void }) => void;
};

type LinkClick = {
  defaultPrevented?: boolean;
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  currentTarget?: unknown;
};

// Attributes rather than properties: an SVG <a>'s `href` and `target` are SVGAnimatedStrings.
const isLinkWithHref = (element: unknown): element is Element => {
  const candidate = element as Partial<Element> | null | undefined;
  return (
    candidate?.localName === "a" &&
    typeof candidate.hasAttribute === "function" &&
    (candidate.hasAttribute("href") || candidate.hasAttribute("xlink:href"))
  );
};

const leftToBrowser = ({ button, metaKey, ctrlKey, shiftKey, altKey, currentTarget }: LinkClick) => {
  if (!isLinkWithHref(currentTarget)) return false;
  const target = currentTarget.getAttribute("target");
  return Boolean(
    (button !== undefined && button !== 0) ||
    metaKey ||
    ctrlKey ||
    shiftKey ||
    altKey ||
    (target && target !== "_self") ||
    currentTarget.hasAttribute("download"),
  );
};

/** Options for `useLink`/`Link`: how strictly a link reports itself `active`. */
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
  const { reverse } = route;
  const active = isActive(route, exact);
  const href = useMemo(() => reverse(to), [reverse, to]);
  const onClick = useCallback(
    (event?: { preventDefault?: () => void }) => {
      const click = event as LinkClick | undefined;
      if (click && (click.defaultPrevented || leftToBrowser(click))) return;
      event?.preventDefault?.();
      setRoute(to);
    },
    [setRoute, to],
  );
  return { href, active, onClick };
}
