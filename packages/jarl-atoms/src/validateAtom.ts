import { Getter } from "jotai/vanilla";
import { transformRouteAtom } from "./transformRouteAtom";
import { DefaultParams, RouteAtom } from "./types";

/**
 * Narrows a route to the values a predicate accepts, leaving the rest unmatched: `validateAtom(day,
 * ({ year, month, day }) => isValidCalendarDate(year, month, day))` matches `/:year/:month/:day`
 * only on real dates, so 31 February falls through to whatever handles a non-matching URL. Use it
 * for constraints spanning several segments, which no single segment's own options can express.
 * The predicate also gets a `Getter`, so it can validate against other atoms.
 */
export const validateAtom = <T extends DefaultParams>(
  parentAtom: RouteAtom<T>,
  isValid: (values: T, get: Getter) => boolean,
): RouteAtom<T> =>
  transformRouteAtom<T, T>(
    parentAtom,
    (values, get) => (isValid(values, get) ? values : undefined),
    (values) => values,
  );
