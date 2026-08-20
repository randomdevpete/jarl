import { WritableAtom } from "jotai/vanilla";
import { Path } from "./href";

/** The param values a route binds. Empty for routes that bind none, such as a static segment. */
export type DefaultParams = {};

/**
 * Extra argument when writing to a RouteAtom, e.g. `set(routeAtom, values, { replace: true })`.
 * `replace` navigates with `history.replaceState` rather than `history.pushState`.
 */
export type NavOptions = { replace?: boolean };

/** The param name a single pattern segment binds, honouring its `?`, `*` and `+` suffixes. */
export type ExtractRouteOptionalParam<PathType extends Path> = PathType extends `${infer Param}?`
  ? { readonly [k in Param]: string | undefined }
  : PathType extends `${infer Param}*`
    ? { readonly [k in Param]: string | undefined }
    : PathType extends `${infer Param}+`
      ? { readonly [k in Param]: string }
      : { readonly [k in PathType]: string };

/** The full param object a `:name`-style path pattern binds. */
export type ExtractRouteParams<PathType extends string> = string extends PathType
  ? DefaultParams
  : PathType extends `${infer _Start}:${infer ParamWithOptionalRegExp}/${infer Rest}`
    ? ParamWithOptionalRegExp extends `${infer Param}(${infer _RegExp})`
      ? ExtractRouteOptionalParam<Param> & ExtractRouteParams<Rest>
      : ExtractRouteOptionalParam<ParamWithOptionalRegExp> & ExtractRouteParams<Rest>
    : PathType extends `${infer _Start}:${infer ParamWithOptionalRegExp}`
      ? ParamWithOptionalRegExp extends `${infer Param}(${infer _RegExp})`
        ? ExtractRouteOptionalParam<Param>
        : ExtractRouteOptionalParam<ParamWithOptionalRegExp>
      : {};

/**
 * What reading any route atom gives you. `match`/`exact` say whether and how completely it
 * matches the current location, `values` holds the params it and its ancestors bound, `rest`
 * the path segments left for its children, and `reverse` turns param values back into a URL.
 */
export type RouteReturn<T extends DefaultParams = DefaultParams> = {
  reverse: (values: T) => string;
} & (
  | {
      match: true;
      values: T;
      exact: boolean;
      rest: { path: string[] };
    }
  | {
      match: false;
      exact: false;
      values: undefined;
    }
);

/** The matched branch of a `RouteReturn`: the one carrying `values` and `rest`. */
export type MatchedRoute<T extends DefaultParams = DefaultParams> = Extract<RouteReturn<T>, { match: true }>;

// jotai's WritableAtom takes its write-side arguments as a tuple (Args) plus
// a Result type, rather than the single-Update-type shape older jotai
// versions used — hence `[T]` (a single-argument tuple) and `void` here.
/** A route: read it for its `RouteReturn` match state, write param values to it to navigate. */
export type RouteAtom<T extends DefaultParams> = WritableAtom<RouteReturn<T>, [T, NavOptions?], void>;

/** Common options for every route atom constructor. */
export type RouteOptions<Parent extends DefaultParams> = {
  /** Route this one nests under, matching the segment after its parent's. Defaults to `rootRouteAtom`. */
  parent?: RouteAtom<Parent>;
};
