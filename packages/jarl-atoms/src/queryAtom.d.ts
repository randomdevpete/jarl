import { DefaultParams, NavOptions, RouteAtom, RouteOptions } from "./routeAtom";
/** Parses a `URLSearchParams` (or query string) into a plain object. Repeated
 * keys become string arrays, matching the common (non-`qs`) convention. */
export declare const parseQuery: (search: URLSearchParams | string) => Record<string, string | string[]>;
/** Inverse of parseQuery: serializes a plain object into a query string
 * (without the leading `?`). */
export declare const stringifyQuery: (query: Record<string, string | string[] | undefined>) => string;
/**
 * Read/write atom for the whole current query string, as a plain object.
 * Reading never fails to match; writing replaces the entire query string
 * (pass `undefined` for a key to remove it, keep other current keys by
 * spreading `get(queryAtom)` yourself first).
 */
export declare const queryAtom: import("jotai").WritableAtom<Record<string, string | string[]>, [query: Record<string, string | string[] | undefined>, navOptions?: NavOptions | undefined], void>;
export type QueryParamOptions<Parent extends DefaultParams> = RouteOptions<Parent> & {
    /** If true, a missing query param is a non-match (like v1's required query
     * keys); by default a missing param just yields `undefined`. */
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
export declare const queryParamAtom: <T extends string, Parent extends DefaultParams = DefaultParams>(name: T, options?: QueryParamOptions<Parent>) => RouteAtom<{ readonly [key in T]: string | undefined; } & Parent>;
