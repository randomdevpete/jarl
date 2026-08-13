// Heavily borrowed from Wouter

// Import from "jotai/vanilla" rather than the "jotai" root entry point: the
// root entry re-exports "jotai/react" too, which pulls in a React peer
// dependency this package intentionally doesn't have (React bindings are a
// separate concern — see ticket 55). "jotai/vanilla" has everything atoms
// need: atom(), Getter, WritableAtom.
import { Getter, SetStateAction, WritableAtom, atom } from "jotai/vanilla";
import { atomWithLocation } from "jotai-location";
import { normalizePathname, splitHref, Path } from "./href";

export type { Path };

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

// Declared rather than imported: jotai-location exports its structurally identical `Location`
// only from jotai-location/dist/atomWithLocation, so locationAtom's inferred type can't be
// named when emitting declarations (TS2883).
/** The location every route atom reads: pathname, query params and hash. */
export type JarlLocation = {
  pathname?: string;
  searchParams?: URLSearchParams;
  hash?: string;
};

const isBrowser = typeof window !== "undefined";

/**
 * jotai-location's history-bound location atom. Constructing and *reading* this
 * is safe under Node (it falls back to an empty location when there's no
 * `window`); only writing is not, since the write path calls
 * `history.pushState`/`replaceState` directly.
 */
const historyLocationAtom = atomWithLocation();

/**
 * Server-side location override. Stays `null` in the browser, where
 * `historyLocationAtom` is the single source of truth.
 */
const serverLocationAtom = atom<JarlLocation | null>(null);

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
 * can't leak location between them.
 */
export const locationAtom: WritableAtom<JarlLocation, [SetStateAction<JarlLocation>, { replace?: boolean }?], void> =
  atom(
    (get) => {
      if (!isBrowser) {
        const override = get(serverLocationAtom);
        if (override) return override;
      }
      return get(historyLocationAtom);
    },
    (get, set, update: SetStateAction<JarlLocation>, options?: { replace?: boolean }) => {
      if (isBrowser) {
        set(historyLocationAtom, update, options);
        return;
      }
      const current = get(serverLocationAtom) ?? get(historyLocationAtom);
      set(
        serverLocationAtom,
        typeof update === "function" ? (update as (prev: JarlLocation) => JarlLocation)(current) : update,
      );
    },
  );

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

// jotai's WritableAtom takes its write-side arguments as a tuple (Args) plus
// a Result type, rather than the single-Update-type shape older jotai
// versions used — hence `[T]` (a single-argument tuple) and `void` here.
/** A route: read it for its `RouteReturn` match state, write param values to it to navigate. */
export type RouteAtom<T extends DefaultParams> = WritableAtom<RouteReturn<T>, [T, NavOptions?], void>;

// Earlier design sketches (a tuple-shaped RouteReturn, a pattern-string-driven
// routeAtom overload, and the type plumbing they'd need) were explored here
// and are preserved with context in ../DESIGN-NOTES.md rather than dropped.

/** Common options for every route atom constructor. */
export type RouteOptions<Parent extends DefaultParams> = {
  /** Route this one nests under, matching the segment after its parent's. Defaults to `rootAtom`. */
  parent?: RouteAtom<Parent>;
};

/**
 * The primitive every other route atom is built from. `matchPath` decides whether the next
 * unconsumed path segment matches, and to what param values; `makePath` is its inverse, used by
 * `reverse`. Reach for it directly when `staticRouteAtom`/`paramRouteAtom` don't fit - custom
 * segment syntax, regex constraints and the like.
 */
export const routeAtom = <T extends DefaultParams = DefaultParams, Parent extends DefaultParams = DefaultParams>(
  matchPath: (path: string, get: Getter) => T | undefined,
  makePath: (values: T, get: Getter) => string,
  options?: RouteOptions<Parent>,
): RouteAtom<T & Parent> => {
  const parentAtom = options?.parent || (rootAtom as RouteAtom<Parent>);
  // TODO: To avoid unnecessary recomputes we should be caching a memoization of the unmatched
  // state, this way we won't recalculate all leaves of an unmatched branch
  const reverse = (get: Getter) => (values: T) => {
    const parent = get(parentAtom);
    const parentPath = parent.reverse(values as unknown as Parent);
    // TODO: Combine query parameters too
    return parentPath === "/" ? parentPath + makePath(values, get) : parentPath + "/" + makePath(values, get);
  };
  return atom(
    (get) => {
      const parent = get(parentAtom);
      let values: T | undefined;
      if (!parent.match || !(values = matchPath(parent.rest.path[0], get))) {
        return {
          reverse: reverse(get),
          match: false,
          exact: false,
          values: undefined,
        };
      }
      const rest = { path: parent.rest.path.slice(1) };
      return {
        reverse: reverse(get),
        match: true,
        exact: rest.path.length === 0,
        rest,
        values: { ...values, ...parent.values },
      };
    },
    (get, set, action, navOptions) => {
      // Every write recomputes the full href (path, and query if any query
      // atoms are composed into this chain via `reverse`) and replaces the
      // location wholesale - a route only ever preserves the query params it
      // explicitly declares, matching v1's per-route stringify semantics.
      const [pathname, searchParams] = splitHref(reverse(get)(action));
      set(locationAtom, (prev) => ({ ...prev, pathname, searchParams }), navOptions);
    },
  );
};

/** Options for `createRootAtom`. */
export type RootOptions = {
  /**
   * Scopes the router to a subtree of the URL: the prefix is stripped from the pathname before
   * matching begins, and prepended again by `reverse`/write. A location outside `basePath` makes
   * the whole tree report `match: false`.
   */
  basePath?: Path;
};

const stripBasePath = (pathname: string, basePath: string): string | undefined => {
  if (!basePath) return pathname;
  if (pathname === basePath) return "/";
  if (pathname.indexOf(`${basePath}/`) === 0) {
    return pathname.slice(basePath.length) || "/";
  }
  return undefined;
};

/**
 * Creates a root RouteAtom. Call this instead of using the default `rootAtom` export when the
 * app needs to be scoped under a basePath.
 */
export const createRootAtom = (options?: RootOptions): RouteAtom<DefaultParams> => {
  const basePath = options?.basePath ? normalizePathname(options.basePath) : "";
  return atom(
    (get) => {
      const location = get(locationAtom);
      const path = location.pathname || "/";
      const withinBase = stripBasePath(path, basePath);
      if (withinBase === undefined) {
        // Outside of this router's basePath entirely: nothing matches.
        return {
          match: false,
          exact: false,
          values: undefined,
          reverse: () => basePath || "/",
        };
      }
      const segments = withinBase === "/" ? [""] : withinBase.split("/");
      // Handle trailing slash
      if (segments.length > 1 && segments[segments.length - 1] === "") {
        segments.pop();
      }
      return {
        // root always matches (as long as we're within basePath)
        match: true,
        exact: segments.length === 1,
        rest: { path: segments.slice(1) },
        reverse: () => basePath || "/",
        values: {},
      };
    },
    (get, set, action, navOptions) => {
      set(
        locationAtom,
        (prev) => ({ ...prev, pathname: basePath || "/", searchParams: new URLSearchParams() }),
        navOptions,
      );
    },
  );
};

/** The default root of every route atom chain: matches `/`, and is the implicit `parent`. */
export const rootAtom = createRootAtom();

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

/**
 * Binds one dynamic path segment to a named value: `paramRouteAtom("productId", { parent:
 * products })` matches `/products/:productId` and yields `{ productId: "123" }`.
 */
export const paramRouteAtom = <T extends string, Parent extends DefaultParams>(
  name: T,
  options?: RouteOptions<Parent>,
) => {
  return routeAtom(
    // Only match when there is actually a segment here to bind the param to.
    // Returning a value unconditionally would make a param route match its
    // parent's own path (e.g. `paramRouteAtom("docName", { parent: docs })`
    // matching "/docs" itself, exactly, with `docName: undefined`), so a
    // section index and its param child would both render.
    (path) => (path ? ({ [name]: path } as { [key in T]: string }) : undefined),
    (values) => values[name],
    options,
  );
};

/**
 * Reshapes a route's matched `values` into a different shape, and back again for
 * `reverse`/write - composable middleware over a chain of route atoms.
 */
export const transformRouteAtom = <T extends DefaultParams, Return extends DefaultParams>(
  parentAtom: RouteAtom<T>,
  getter: (values: T, get: Getter) => Return | undefined,
  setter: (values: Return, get: Getter) => T,
): RouteAtom<Return> => {
  const reverse = (get: Getter) => (values: Return) => {
    const transformed = setter(values, get);
    const parent = get(parentAtom);
    return parent.reverse(transformed);
  };
  return atom(
    (get) => {
      const parent = get(parentAtom);
      let transformed: Return | undefined;
      if (!parent.match || !(transformed = getter(parent.values, get))) {
        return {
          match: false,
          exact: false,
          values: undefined,
          reverse: reverse(get),
        };
      }
      return { ...parent, values: transformed, reverse: reverse(get) };
    },
    (get, set, action, navOptions) => {
      const transformed = setter(action, get);
      set(parentAtom, transformed, navOptions);
    },
  );
};
