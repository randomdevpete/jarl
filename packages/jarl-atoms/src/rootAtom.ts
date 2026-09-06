import { atom } from "jotai/vanilla";
import { Path, normalizePathname } from "./href";
import { locationAtom } from "./locationAtom";
import { DefaultParams, RouteAtom } from "./types";

/** Options for `createRootAtom`: how to scope the router to a subtree of the URL. */
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
 * app needs to be scoped under a `basePath` - e.g. mounted under a subpath, or as one router
 * among several sharing a page. The returned atom is a normal `RouteAtom`: pass it as `parent`
 * to the routes built on top of it, exactly like `rootAtom` itself.
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
