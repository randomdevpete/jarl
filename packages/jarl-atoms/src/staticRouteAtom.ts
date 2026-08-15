import { routeAtom } from "./routeAtom";
import { DefaultParams, RouteAtom, RouteOptions } from "./types";

/** Matches one fixed path segment: `staticRouteAtom("about")` matches `/about`. */
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
