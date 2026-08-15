# Location & Base Paths

## `locationAtom`

Every route atom ultimately reads and writes one shared atom: `locationAtom`. In the browser
it's backed directly by `history.pushState`/`replaceState` (via jotai-location), so navigation
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

Under Node, writes like this are captured in plain jotai state rather than touching `window`,
which doesn't exist there - each store keeps its own override, so prerendering many pages in one
process can't leak location between them. The same seeding trick is handy in tests: set
`locationAtom` on a fresh store instead of reaching into `window.history` to get a route atom into
a particular state.

## Scoping a router under a `basePath`

`rootAtom`, the implicit parent of every route atom, matches `/`. When the whole app is mounted
under a subpath instead - a GitHub Pages project site, a micro-frontend embedded at `/app/*` -
call `createRootAtom` yourself and use its result as every top-level route's `parent`:

```ts
import { createRootAtom, staticRouteAtom } from "jarl-atoms";

export const appRoot = createRootAtom({ basePath: "/app" });
export const aboutRoute = staticRouteAtom("about", { parent: appRoot });
```

`aboutRoute` now matches `/app/about`: the prefix is stripped before matching begins and
prepended again by `reverse()`/write, so every downstream route atom deals in paths relative to
`basePath` and never has to know it's there. A location outside `basePath` entirely - including
one that merely shares its prefix, like `/app-other` - makes the whole tree report `match: false`,
not just the routes under it.

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
