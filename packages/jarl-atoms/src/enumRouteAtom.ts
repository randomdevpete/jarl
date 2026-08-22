import { routeAtom } from "./routeAtom";
import { DefaultParams, RouteAtom, RouteOptions } from "./types";

/** The segment values an `enumRouteAtom` accepts: a non-empty tuple of string literals. */
export type EnumValues = readonly [string, ...string[]];

/**
 * Binds one dynamic path segment to a named value drawn from a fixed set: `enumRouteAtom("page",
 * ["home", "about", "contact"], { parent: site })` matches `/:page` on those three segments and no
 * others, and types `values.page` as the union of them rather than as `string` - so a `switch` over
 * it is exhaustive, and a value that isn't one of them is a compile error wherever the route is
 * written to, reversed or linked. Any other segment leaves the route unmatched, which is what makes
 * an unknown one a genuine miss rather than a page rendering its own "not found".
 *
 * Pass the values as a literal array, or as an `as const` tuple to share the list with the code
 * that consumes it; a plain `string[]` has no literals left to bind and won't type.
 */
export const enumRouteAtom = <Name extends string, const Values extends EnumValues, Parent extends DefaultParams>(
  name: Name,
  allowed: Values,
  options?: RouteOptions<Parent>,
): RouteAtom<{ [key in Name]: Values[number] } & Parent> => {
  type Bound = { [key in Name]: Values[number] };
  const accepted = new Set<string>(allowed);
  return routeAtom<Bound, Parent>(
    (path) => (accepted.has(path) ? ({ [name]: path } as Bound) : undefined),
    (values) => values[name],
    options,
  );
};
