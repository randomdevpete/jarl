# jarl-atoms API reference

Hand-curated reference for the core exports of `jarl-atoms` - the framework-agnostic half of
JARL. Everything here is a plain [jotai](https://jotai.org/) atom with no React dependency; the
React components and hooks that consume these atoms live in the sibling
[`jarl-react`](/api/jarl-react) package.

Every route atom - whatever kind - shares the same shape when read: `{ match, exact, values,
reverse, rest? }`. `match`/`exact` tell you whether (and how completely) it matches the current
location, `values` gives you the params it (and its ancestors) bound, and `reverse(values)`
turns a set of param values back into a URL. Writing to a route atom navigates.

## `rootAtom`

The default root of every route atom chain. Matches `/` itself; every `staticRouteAtom`,
`paramRouteAtom`, etc. below the top of a chain uses this as its implicit `parent` unless one is
given explicitly.

## `createRootAtom({ basePath? })`

Creates a root route atom scoped to a `basePath`, for mounting a router under a subtree of the
URL (e.g. a widget embedded at `/app/*`). The prefix is stripped before matching and reprepended
on write/reverse; unlike v1's `RoutingProvider` `basePath` (which froze on the last good state
for navigation outside it), the whole tree simply reports `match: false` outside `basePath`.

## `routeAtom(matchPath, makePath, { parent? })`

The primitive every other route atom in this package is built from. `matchPath(segment, get)`
decides whether (and to what value) the next unconsumed path segment matches; `makePath(values,
get)` is its inverse, producing the segment for `reverse`. Reach for this directly when
`staticRouteAtom`/`paramRouteAtom` don't fit (custom segment syntax, regex constraints, etc).

## `staticRouteAtom(name, { parent? })`

Matches a single fixed path segment, e.g. `staticRouteAtom("about")` matches `/about`.

## `paramRouteAtom(name, { parent? })`

Binds a single dynamic path segment to a named value, e.g. `paramRouteAtom("productId", {
parent: productsRoute })` matches `/products/:productId`-shaped URLs and yields `{ productId:
"123" }`.

## `transformRouteAtom(parentAtom, getter, setter)`

Reshapes a route atom's matched `values` into a different shape (and back, for `reverse`/write) -
composable middleware for a chain of route atoms, without needing a new `routeAtom` primitive.

## `queryAtom`

Read/write atom for the whole current query string as a plain object (repeated keys become
string arrays). Writing replaces the entire query string.

## `queryParamAtom(name, { parent?, required? })`

A single named query-string parameter, composable exactly like a path route atom (any route
atom as `parent`), except it doesn't consume a path segment. `values[name]` is `undefined` when
the param is absent, unless `required: true` is set, in which case a missing param is a
non-match.

## `redirectAtom(to, { parent? })` / `followRedirects(store, redirectAtoms)`

`redirectAtom` is a route-atom-shaped leaf that matches whenever its parent does, and whose
`reverse()`/write resolve to `to` (a path, or a function of `get`) rather than to itself -
reading it is pure and has no side effects. `followRedirects` is the effect: subscribe one or
more redirect atoms to a jotai store, and the moment one starts matching, it's written to
(triggering a `history.replaceState`-style navigation). Typically called once near the root of
an app, mirroring v1's `RoutingProvider` automatically following redirects during navigation.

## `redirect(to)` / `isRedirect(value)` / `Redirect`

`redirect(to)` constructs a `Redirect` marker value - most often returned from a `resolvedAtom`
loader (see below) to defer a redirect decision until after data has loaded. `isRedirect`
narrows a value to `Redirect`.

## `resolvedAtom(routeAtom, resolver)` / `followResolvedRedirects(store, resolvedAtoms)`

`resolvedAtom` runs `resolver(values, get)` whenever `routeAtom` matches, resolving to
`undefined` when it doesn't - a plain jotai async atom (`Atom<Promise<Data | Redirect |
undefined>>`), so any of jotai's usual consumption patterns apply: `useAtomValue` + `Suspense`,
`loadable()` for a non-suspending view, or `await store.get(resolvedAtom)` outside React
entirely. `followResolvedRedirects` is the async counterpart to `followRedirects`: if a
resolver ever produces a `Redirect`, the navigation is actually performed.

## `locationAtom`

The shared, SSR-safe location every route atom ultimately reads from and writes to. In a
browser it's backed directly by `jotai-location`'s `history`-bound atom (real
`pushState`/`replaceState`, responds to `popstate`); under Node - where there's no `window` to
push history onto - writes are captured per-store instead, so a location can be seeded
per-render for prerendering (`store.set(locationAtom, { pathname, searchParams })` before
`renderToString`) without needing a browser at all. This docs site's own navigation is built
directly on this - see the [v1 History](/history) page for more on why.

## `Path`, `normalizePathname`, `splitHref`, `joinHref`, `appendQueryParam`

Small string helpers for combining/splitting a path and its query string, shared internally by
the atoms above and exported in case a custom `routeAtom` needs the same normalization rules.

---

See the [v1 History](/history) page for how JARL's original `RouteMap`/`RoutingProvider` API
worked, and why the atomic model replaced it.
