import { Getter } from "jotai/vanilla";
import { transformRouteAtom } from "./transformRouteAtom";
import { DefaultParams, RouteAtom } from "./types";

/**
 * Narrows a route to the values a predicate accepts, for a constraint spanning several segments
 * that no single segment's own options can express:
 *
 * ```ts
 * const dateRoute = validateRouteAtom(dayRoute, ({ year, month, day }) =>
 *   isValidCalendarDate(year, month, day),
 * );
 * ```
 *
 * Values the predicate rejects leave the route unmatched, so 31 February falls through to whatever
 * handles a non-matching URL.
 *
 * The predicate is also given a `Getter`, so it can validate against other atoms.
 */
export const validateRouteAtom = <T extends DefaultParams>(
  parentAtom: RouteAtom<T>,
  isValid: (values: T, get: Getter) => boolean,
): RouteAtom<T> =>
  transformRouteAtom<T, T>(
    parentAtom,
    (values, get) => (isValid(values, get) ? values : undefined),
    (values) => values,
  );
