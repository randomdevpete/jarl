import { routeAtom } from "./routeAtom";
import { DefaultParams, RouteAtom, RouteOptions } from "./types";

/** The segment values an `enumRouteAtom` accepts: a non-empty tuple of string literals. */
export type EnumValues = readonly [string, ...string[]];

/**
 * Binds one path segment to a named value from a fixed set, typed as the union of those values
 * rather than as `string`:
 *
 * ```ts
 * const pageRoute = enumRouteAtom("page", ["home", "about", "contact"], { parent: siteRoute });
 * ```
 *
 * Only those segments match; any other leaves the route unmatched. Writing, reversing or linking
 * with a value outside the set is a compile error.
 *
 * Pass a literal array, or an `as const` tuple to share the list with the code that consumes it.
 * A plain `string[]` has no literals left to bind and won't type.
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
