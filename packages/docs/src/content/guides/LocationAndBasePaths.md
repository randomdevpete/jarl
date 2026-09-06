# Location & Base Paths

## `locationAtom`

Every route atom ultimately reads and writes one shared atom: `locationAtom`, holding the
`pathname`, `searchParams` and `hash` of the current URL. In the browser it is exactly
[jotai-location](https://github.com/jotaijs/jotai-location)'s `atomWithLocation()`: reads and
writes go straight through to `history.pushState`/`replaceState` and to `popstate`, so navigation
through route atoms and the browser's own back/forward buttons stay in sync automatically - no
separate `history` package to wire up.

You don't normally read or write it yourself; route atoms are the interface. The one place it's
useful directly is seeding a location by hand - most commonly for a server render, which has no
real browser `history` to read from:

```ts
import { createStore } from "jotai/vanilla";
import { locationAtom } from "jarl-atoms";

const store = createStore();
store.set(locationAtom, { pathname: "/docs", searchParams: new URLSearchParams() });
```

Under Node there is no `window` to push history onto, so writes like this are captured in plain
jotai state instead, and reads prefer that captured value. Each store keeps its own override, so
prerendering many pages in one process can't leak location between them. That seam is the whole
of JARL's SSR/SSG support - and it's just as handy in tests: set `locationAtom` on a fresh store
instead of reaching into `window.history` to get a route atom into a particular state.

## Scoping a router under a `basePath`

`rootRoute`, the implicit parent of every route atom, matches `/`. When a tree of routes is mounted
under a subpath instead - an app served from a project site, a micro-frontend embedded at
`/app/*`, or a self-contained widget on one page of a larger site - call `rootRouteAtom` yourself
and use its result as every top-level route's `parent`:

```ts
import { rootRouteAtom, staticRouteAtom } from "jarl-atoms";

export const appRoot = rootRouteAtom({ basePath: "/app" });
export const aboutRoute = staticRouteAtom("about", { parent: appRoot });
```

`aboutRoute` now matches `/app/about`: the prefix is stripped before matching begins and
prepended again by `reverse()`/write, so every downstream route atom deals in paths relative to
`basePath` and never has to know it's there. A location outside `basePath` entirely - including
one that merely shares its prefix, like `/app-other` - makes the whole tree report `match: false`,
not just the routes under it.

The atom `rootRouteAtom` returns is an ordinary `RouteAtom`, so it can be linked to and rendered
on like any other - `<Link route={appRoot} to={{}} exact>` is the "home" link of the scoped tree.

This is how the demos on this site stay self-contained: the [blog routing demo](/demos/blog-routing)
and the [data grid demo](/demos/data-grid) each declare their own root at their mount point and
build a whole route tree on it as plain module-level atoms, with nothing about the demo's position
in the site leaking into the site's own route table.

`basePath` on a root, rather than a scoped jotai store, is a deliberate choice: jotai stores don't
inherit, so a nested `<Provider>` gets its own location atom that only refreshes on `popstate` -
and a `pushState` from inside the subtree fires none, leaving every route atom outside it matching
a URL that no longer exists. `packages/jarl-atoms/DESIGN-NOTES.md` records the full reasoning.

## Href utilities

`jarl-atoms` also exports the small string helpers route atoms are built from -
`normalizePathname`, `splitHref`, `appendQueryParam`, `joinHref`. They're plain functions over
paths and `URLSearchParams`, with no atom or store involved. Most apps never need them directly;
they're there for the same case `routeAtom` itself is - writing a custom route atom that needs to
parse or build a full href (path plus query) rather than a single segment:

```ts
import { splitHref } from "jarl-atoms";

const [pathname, searchParams] = splitHref("/products/12?ref=email");
// pathname: "/products/12", searchParams: URLSearchParams { ref: "email" }
```

`parseQuery` and `stringifyQuery`, alongside them, do the same job for a whole query string as an
object - the pair `queryAtom` is built on.
