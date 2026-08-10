// Small, framework-agnostic helpers for combining/splitting a path and its
// query string. Shared by routeAtom (plain paths) and queryAtom (paths with
// query params attached) so both go through the same parsing rules.

export type Path = string;

// Removes any double slashes
const removeSlashDupes = (path: string) => path.replace(/\/\/+/g, "/");
// Maybe remove the trailing slash from the end
const removeTrailingSlash = (path: string) => (path.length > 1 ? path.substring(0, path.length - 1) : path);

export const normalizePathname = (pathname: string): string => removeTrailingSlash(removeSlashDupes(`/${pathname}/`));

/**
 * Splits a full href (e.g. `/foo/bar?a=1&b=2`) into a normalized pathname
 * and a URLSearchParams instance for the query string.
 */
export const splitHref = (href: Path): [pathname: string, searchParams: URLSearchParams] => {
    const [pathname, search = ""] = href.split("?");
    return [normalizePathname(pathname), new URLSearchParams(search)];
};

/**
 * Appends/overwrites a single query param onto an existing href, returning
 * the combined href. Used when composing queryParamAtom on top of a parent
 * route atom's reverse() output.
 */
export const appendQueryParam = (href: Path, key: string, value: string | undefined): Path => {
    const [pathname, searchParams] = splitHref(href);
    if (value === undefined) {
        searchParams.delete(key);
    } else {
        searchParams.set(key, value);
    }
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
};

/**
 * Joins a pathname and a URLSearchParams back into a single href string.
 */
export const joinHref = (pathname: string, searchParams: URLSearchParams): Path => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
};
