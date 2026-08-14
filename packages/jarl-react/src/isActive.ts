import { DefaultParams, RouteReturn } from "jarl-atoms";

/**
 * The single definition of "this route is currently showing", shared by
 * `Route`, `Switch` and the `useIsActive`/`useLink` hooks so a `Switch` picks
 * the same child that child would have picked for itself.
 */
export const isActive = <T extends DefaultParams>(
  route: RouteReturn<T>,
  exact?: boolean,
): route is Extract<RouteReturn<T>, { match: true }> => (exact ? route.exact : route.match);
