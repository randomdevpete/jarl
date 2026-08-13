import { ReactNode } from "react";
import { RouteAtom, DefaultParams } from "jarl-atoms";
import { useRoute } from "./hooks";
import { isActive } from "./isActive";

export type RouteProps<T extends DefaultParams> = {
  /** The route atom to render on. */
  on: RouteAtom<T>;
  /** Plain nodes, or a function receiving the matched route's param values. */
  children?: ReactNode | ((values: T) => ReactNode | undefined);
  /** Only render when this is an exact (leaf) match, not just an ancestor match. */
  exact?: boolean;
};

/**
 * Renders its children only while `on` matches the current location.
 * `children` can be plain nodes, or a function receiving the matched
 * route's param `values` for cases that need them.
 *
 * Wrap several of these in a `Switch` to render only the first that matches,
 * with a catch-all for when none does.
 */
export const Route = <T extends DefaultParams>({ on, children, exact }: RouteProps<T>) => {
  const route = useRoute(on);
  if (!isActive(route, exact)) {
    return null;
  }
  return <>{typeof children === "function" ? children(route.values) : children}</>;
};
