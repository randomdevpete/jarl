import { Getter, SetStateAction, WritableAtom } from "jotai/vanilla";
import { Path } from "./href";
export type { Path };
export type DefaultParams = {};
/**
 * Options that can be passed as an (optional) extra argument when writing to
 * a RouteAtom, e.g. `set(routeAtom, values, { replace: true })`. Mirrors
 * jotai-location's own applyLocation options, so a `replace` navigation here
 * results in `history.replaceState` rather than `history.pushState` - used
 * by redirectAtom to avoid polluting browser history with a route that's
 * about to be replaced anyway.
 */
export type NavOptions = {
  replace?: boolean;
};
export type ExtractRouteOptionalParam<PathType extends Path> = PathType extends `${infer Param}?`
  ? {
      readonly [k in Param]: string | undefined;
    }
  : PathType extends `${infer Param}*`
    ? {
        readonly [k in Param]: string | undefined;
      }
    : PathType extends `${infer Param}+`
      ? {
          readonly [k in Param]: string;
        }
      : {
          readonly [k in PathType]: string;
        };
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
 * The location shape jotai-location's `atomWithLocation` reads and writes.
 * Declared here rather than imported: jotai-location exports its `Location`
 * type only from `jotai-location/dist/atomWithLocation`, not from the package
 * entry point, so the inferred type of `locationAtom` below can't be *named*
 * when emitting declarations (TS2883) - and reaching into the package's dist/
 * internals to name it would be worse. Structurally identical, so assignment
 * both ways still typechecks.
 */
export type JarlLocation = {
  pathname?: string;
  searchParams?: URLSearchParams;
  hash?: string;
};
/**
 * The location every route atom reads from, and the seam where SSR/SSG is made
 * possible.
 *
 * In a browser this is exactly `atomWithLocation()`: reads and writes go
 * straight through to jotai-location, so navigation still drives real
 * `history.pushState`/`replaceState` and responds to popstate.
 *
 * Under Node there is no `window` to push history onto, so writes are captured
 * in plain jotai state instead and reads prefer that captured value. That makes
 * a route seedable per-render on the server:
 *
 * ```ts
 * const store = createStore();
 * store.set(locationAtom, { pathname: "/docs", searchParams: new URLSearchParams() });
 * renderToString(<Provider store={store}><App /></Provider>);
 * ```
 *
 * Each store keeps its own override, so prerendering many routes in one process
 * can't leak location between them. Without this, seeding a location server-side
 * throws `ReferenceError: window is not defined` and the router can't SSR at all
 * — which is what the docs site (packages/docs) needs in order to prerender.
 */
export declare const locationAtom: WritableAtom<
  JarlLocation,
  [
    SetStateAction<JarlLocation>,
    {
      replace?: boolean;
    }?,
  ],
  void
>;
export type RouteReturn<T extends DefaultParams = DefaultParams> = {
  reverse: (values: T) => string;
} & (
  | {
      match: true;
      values: T;
      exact: boolean;
      rest: {
        path: string[];
      };
    }
  | {
      match: false;
      exact: false;
      values: undefined;
    }
);
export type RouteAtom<T extends DefaultParams> = WritableAtom<RouteReturn<T>, [T, NavOptions?], void>;
export type RouteOptions<Parent extends DefaultParams> = {
  parent?: RouteAtom<Parent>;
};
export declare const routeAtom: <T extends DefaultParams = DefaultParams, Parent extends DefaultParams = DefaultParams>(
  matchPath: (path: string, get: Getter) => T | undefined,
  makePath: (values: T, get: Getter) => string,
  options?: RouteOptions<Parent>,
) => RouteAtom<T & Parent>;
export type RootOptions = {
  /**
   * Scopes this router to a subtree of the URL, mirroring v1's
   * RoutingProvider `basePath` prop: the prefix is stripped from the
   * pathname before matching begins, and prepended again by `reverse`/write.
   *
   * Unlike v1 (which simply *ignored* navigation events outside basePath,
   * leaving the router frozen on its last good state) this makes the whole
   * tree report `match: false` when the current location falls outside
   * basePath - there's no "previous state" to fall back to in a pull-based
   * atom, and treating it as a plain non-match is the closer fit for the
   * atomic model. Documented as a deliberate deviation, see PR body.
   */
  basePath?: Path;
};
/**
 * Creates a root RouteAtom. Call this directly (instead of using the default
 * `rootAtom` export) when the app needs to be scoped under a basePath.
 */
export declare const createRootAtom: (options?: RootOptions) => RouteAtom<DefaultParams>;
export declare const rootAtom: RouteAtom<DefaultParams>;
export declare const staticRouteAtom: <Parent extends DefaultParams>(
  name: string,
  options?: RouteOptions<Parent>,
) => RouteAtom<Parent>;
export declare const paramRouteAtom: <T extends string, Parent extends DefaultParams>(
  name: T,
  options?: RouteOptions<Parent>,
) => RouteAtom<{ [key in T]: string } & Parent>;
export declare const transformRouteAtom: <T extends DefaultParams, Return extends DefaultParams>(
  parentAtom: RouteAtom<T>,
  getter: (values: T, get: Getter) => Return | undefined,
  setter: (values: Return, get: Getter) => T,
) => RouteAtom<Return>;
