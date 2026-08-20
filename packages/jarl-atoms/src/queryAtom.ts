// Query-string support for the v2 atomic model. The original routeAtom.ts
// draft only ever matched path segments (`// TODO: Combine query parameters
// too`); these atoms fill that gap.
//
// v1 (RouteMap.js) leaned on `qs` for parsing/stringifying, and let a route
// declare a whole map of named query matchers. That's a lot of
// surface area to port 1:1 into the atomic model in one pass. Instead this
// implements the common, composable subset: a single named query param as
// its own RouteAtom-shaped leaf (`queryParamRouteAtom`), plus a raw whole-query
// atom (`queryAtom`) for reading/writing everything at once. Both are built
// on plain `URLSearchParams`, deliberately not supporting `qs`'s nested/array
// query syntax - v1 itself flags that as a known limitation
// (`// TODO: This won't support qs's nested/array queries`), so this isn't a
// regression, just not a superset either.

import { Getter, atom } from "jotai/vanilla";
import { appendQueryParam, splitHref } from "./href";
import { locationAtom } from "./locationAtom";
import { rootRouteAtom } from "./rootRouteAtom";
import { DefaultParams, NavOptions, RouteAtom, RouteOptions } from "./types";

/** Parses a `URLSearchParams` (or query string) into a plain object. Repeated
 * keys become string arrays, matching the common (non-`qs`) convention. */
export const parseQuery = (search: URLSearchParams | string): Record<string, string | string[]> => {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const query: Record<string, string | string[]> = {};
  for (const key of params.keys()) {
    const values = params.getAll(key);
    query[key] = values.length > 1 ? values : values[0];
  }
  return query;
};

/** Inverse of parseQuery: serializes a plain object into a query string
 * (without the leading `?`). */
export const stringifyQuery = (query: Record<string, string | string[] | undefined>): string => {
  const params = new URLSearchParams();
  for (const key of Object.keys(query)) {
    const value = query[key];
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.set(key, value);
    }
  }
  return params.toString();
};

/**
 * Read/write atom for the whole current query string, as a plain object.
 * Reading never fails to match; writing replaces the entire query string
 * (pass `undefined` for a key to remove it, keep other current keys by
 * spreading `get(queryAtom)` yourself first).
 */
export const queryAtom = atom(
  (get) => parseQuery(get(locationAtom).searchParams ?? new URLSearchParams()),
  (get, set, query: Record<string, string | string[] | undefined>, navOptions?: NavOptions) => {
    const [pathname] = splitHref(get(locationAtom).pathname || "/");
    set(
      locationAtom,
      (prev) => ({
        ...prev,
        pathname,
        searchParams: new URLSearchParams(stringifyQuery(query)),
      }),
      navOptions,
    );
  },
);

/** `RouteOptions` plus whether the param must be present for the route to match. */
export type QueryParamRouteOptions<Parent extends DefaultParams> = RouteOptions<Parent> & {
  /** Makes a missing query param a non-match; by default it just yields `undefined`. */
  required?: boolean;
};

/**
 * A single named query param, composable exactly like a path RouteAtom:
 * it can be given a `parent` (any RouteAtom, path- or query-based), and its
 * own `reverse()`/write round-trip through the same href as its parent, with
 * this param appended/updated on top. Doesn't consume any path segments, so
 * path matching continues unaffected by however many query params are
 * chained on.
 */
export const queryParamRouteAtom = <T extends string, Parent extends DefaultParams = DefaultParams>(
  name: T,
  options?: QueryParamRouteOptions<Parent>,
): RouteAtom<{ readonly [key in T]: string | undefined } & Parent> => {
  const parentAtom = options?.parent || (rootRouteAtom as RouteAtom<Parent>);
  type Values = { readonly [key in T]: string | undefined };

  const reverse =
    (get: Getter) =>
    (values: Values & Parent): string => {
      const parent = get(parentAtom);
      const parentHref = parent.reverse(values as unknown as Parent);
      return appendQueryParam(parentHref, name, values[name]);
    };

  return atom(
    (get) => {
      const parent = get(parentAtom);
      if (!parent.match) {
        return {
          match: false,
          exact: false,
          values: undefined,
          reverse: reverse(get),
        };
      }
      const searchParams = get(locationAtom).searchParams ?? new URLSearchParams();
      const value = searchParams.has(name) ? searchParams.get(name)! : undefined;
      if (options?.required && value === undefined) {
        return {
          match: false,
          exact: false,
          values: undefined,
          reverse: reverse(get),
        };
      }
      return {
        ...parent,
        reverse: reverse(get),
        values: { ...parent.values, [name]: value } as Values & Parent,
      };
    },
    (get, set, action, navOptions) => {
      const path = reverse(get)(action);
      const [pathname, searchParams] = splitHref(path);
      set(locationAtom, (prev) => ({ ...prev, pathname, searchParams }), navOptions);
    },
  ) as RouteAtom<Values & Parent>;
};
