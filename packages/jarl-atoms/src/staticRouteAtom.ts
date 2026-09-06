import { routeAtom } from "./routeAtom";
import { DefaultParams, RouteAtom, RouteOptions } from "./types";

/**
 * Matches one fixed path segment: `staticRouteAtom("about")` matches `/about`. Binds no values
 * of its own - `values` is just whatever `parent` bound - so it's the atom to reach for whenever
 * a step in the path doesn't need to capture anything.
 */
export const staticRouteAtom = <Parent extends DefaultParams>(
  name: string,
  options?: RouteOptions<Parent>,
): RouteAtom<Parent> => {
  return routeAtom(
    (path) => (name === path ? {} : undefined),
    () => name,
    options,
  );
};
