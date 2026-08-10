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

export type DefaultParams = {};

/**
 * Options that can be passed as an (optional) extra argument when writing to
 * a RouteAtom, e.g. `set(routeAtom, values, { replace: true })`. Mirrors
 * jotai-location's own applyLocation options, so a `replace` navigation here
 * results in `history.replaceState` rather than `history.pushState` - used
 * by redirectAtom to avoid polluting browser history with a route that's
 * about to be replaced anyway.
 */
export type NavOptions = { replace?: boolean };

export type ExtractRouteOptionalParam<PathType extends Path> = PathType extends `${infer Param}?`
    ? { readonly [k in Param]: string | undefined }
    : PathType extends `${infer Param}*`
      ? { readonly [k in Param]: string | undefined }
      : PathType extends `${infer Param}+`
        ? { readonly [k in Param]: string }
        : { readonly [k in PathType]: string };

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

// Exported so queryAtom/redirectAtom/resolvedAtom can compose on top of the
// same underlying location without each creating their own history binding.
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
 * can't leak location between them. Without this, seeding a location server-side
 * throws `ReferenceError: window is not defined` and the router can't SSR at all
 * — which is what the docs site (packages/docs) needs in order to prerender.
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
export type RouteAtom<T extends DefaultParams> = WritableAtom<RouteReturn<T>, [T, NavOptions?], void>;

// Earlier design sketches (a tuple-shaped RouteReturn, a pattern-string-driven
// routeAtom overload, and the type plumbing they'd need) were explored here
// and are preserved with context in ../DESIGN-NOTES.md rather than dropped.

export type RouteOptions<Parent extends DefaultParams> = {
    parent?: RouteAtom<Parent>;
};

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

const stripBasePath = (pathname: string, basePath: string): string | undefined => {
    if (!basePath) return pathname;
    if (pathname === basePath) return "/";
    if (pathname.indexOf(`${basePath}/`) === 0) {
        return pathname.slice(basePath.length) || "/";
    }
    return undefined;
};

/**
 * Creates a root RouteAtom. Call this directly (instead of using the default
 * `rootAtom` export) when the app needs to be scoped under a basePath.
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

export const rootAtom = createRootAtom();

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
