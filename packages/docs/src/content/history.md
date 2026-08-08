# v1 History: architecture, design, and why v2 moves to atoms

This page is a design retrospective on JARL v1 (`jarl-react`'s original implementation,
long since removed from `packages/jarl-react`) - distinct from the
[Changelog](/changelog), which just lists version-by-version release notes. This is
about *how v1 works and why*, and why v2 replaces its internals with
[jotai](https://jotai.org/) atoms, split across `packages/jarl-atoms` (the atoms
themselves) and `packages/jarl-react` (React bindings over them).

## The core idea: locations are state, not URLs

Everything else in v1 follows from one decision made at the very start: a route table
maps a URL to a plain, serializable **location object** (`{ page: "product", productId:
"123" }`), and the rest of the app only ever deals with that object - never a URL
string. `Link` builds `href`s from the same location objects in reverse. This is what
makes the same route table usable for web (`history`'s `createBrowserHistory`) and
React Native (`createMemoryHistory` plus deep-link handling) with no branching in
application code, and it's a decision v2 keeps.

Everything below - context, the HOC, the render-prop `Link`, resolve/redirect - is
about *how that location object gets from a URL, through matching, into your
components, and back out again as an `href`*. That plumbing is what v2 rebuilds.

## Legacy React context

`RoutingProvider` (`packages/jarl-react/source/RoutingProvider.js`) is a class
component using React's **legacy context API** (`childContextTypes` / `contextTypes`,
predating `React.createContext`, which shipped in 16.3 partway through JARL's life).
It exposes a single `routing` object down the tree:

```js
getChildContext() {
    return {
        routing: {
            navigate: this.handleNavigate,
            redirect: this.handleRedirect,
            stringify: this.handleStringify,
            getLocation: this.handleGetLocation,
            getResolved: this.handleGetResolved,
            isActive: this.handleIsActive
        }
    };
}
```

Every consumer (`Link`, the `routing` HOC, `Router`) declares `static contextTypes =
{ routing: routingContextShape }` and reads `this.context.routing`. This works, but it
has the well-known legacy-context downsides: it's a single implicit channel per
provider (no way to select just a slice and skip re-renders), it only works in class
components (no hook equivalent), and React has deprecated it in favour of the new
Context API since before JARL v1 was finished - v1 never migrated, partly because the
whole component tree re-renders on every navigation anyway (see below), which made the
selective-subscription benefits of new Context moot at the time.

## `RoutingProvider`: a controlled component that matches, resolves, and force-updates

`RoutingProvider` is deliberately a *controlled* component, mirroring a controlled
`<input>`: it never owns the "real" location as internal state that only it can see.
Instead:

1. It listens to the `history` package instance it's given (`history.listen`), and on
   every change (browser back/forward, or a `navigate`/`redirect` call) it matches the
   new path against the route table (`RouteMap.match`).
2. If any matched route leaf declares a `resolve` function, those are reduced into a
   single serial `Promise` chain (each resolver runs after the previous one resolves,
   accumulating into one `resolved` object) - this is JARL's data-loading mechanism,
   letting a route say "before you render me, fetch this".
3. If matching (or a resolver) produces a `Redirect` (see below), the provider calls
   `history.replace` instead of completing the navigation, so the invalid/interim URL
   never lands in browser history.
4. Once matching and all resolvers settle, `completeRouting` calls `this.props.onChange`
   (handing the new `{ location, resolved }` up to *your* app state - a plain
   `setState`, Redux dispatch, whatever you want) and then calls `this.forceUpdate()`.

That last step is the important, slightly awkward one: `RoutingProvider` doesn't store
`location`/`resolved` in its own React state - they're props, fed back in by whatever
owns `onChange`. So after a navigation it has no state of its own that changed, and the
only way to get consumers deeper in the tree (which read `getLocation()`/`getResolved()`
via context, not props) to see the update is an explicit `forceUpdate()`. It's a
pragmatic solution given legacy context has no subscription model, but it means every
navigation re-renders the entire subtree under the provider, matching happens
synchronously against the whole route table on every path change, and "is a link active"
(`isActive`) has to re-run matching for *both* the link's target and the current
location on every render of every `Link` to compare branches - there's a `TODO: PERF`
comment in the source about exactly this.

## `routing()`: a HOC over context

```js
const routing = (mapLocationToProps, mapRoutingToProps, mapResolvedToProps) =>
    hocFactory(WrappedComponent => class Routing extends Component {
        static contextTypes = { routing: routingContextShape };
        render() {
            const { isActive, navigate, stringify, redirect, getLocation, getResolved } = this.context.routing;
            const location = mapLocationToProps ? mapLocationToProps(getLocation()) : getLocation();
            const callbacks = mapRoutingToProps ? mapRoutingToProps({ isActive, navigate, stringify, redirect }, this.props) : {};
            const resolved = mapResolvedToProps ? mapResolvedToProps(getResolved()) : getResolved();
            return <WrappedComponent {...this.props} {...location} {...resolved} {...callbacks} />;
        }
    });
```

This is a very Redux-`connect`-shaped API (deliberately - the README credits
`redux-first-router` as inspiration), and it's the idiomatic way v1 expects you to
consume routing: wrap your top-level `App`, and switch on the injected `page` prop -
the README is explicit that there's **no `<Switch>` component**, just "use a switch
statement instead". `<Router>` (`Router.js`) is the same idea via the function-as-child
pattern instead of a HOC, for spots where introducing a new named component is
overkill.

## `Link`: render props, active-state comparison

`Link` (`Link.js`) supports both a plain element API and a function-as-child
("render prop") API:

```jsx
<Link to={{ page: "search", search: text }}>
    {({ href, onClick, active }) => <button onClick={onClick}>Search</button>}
</Link>
```

which exists so you can build a fully custom clickable element (e.g. a button that
programmatically navigates, as in the JARL README's search-form example) without
duplicating `Link`'s "convert a location into an `href` and a navigate handler" logic.
Clicking a plain `<Link>` calls `event.preventDefault()` and then
`context.routing.navigate(to)` - there is no actual anchor-tag navigation, `href` exists
only so the link is a real, right-clickable/`Cmd`-clickable anchor and works without JS.

## `resolve`/`redirect` semantics

A route can declare `resolve: (location, context) => Promise`, run serially down the
matched branch (see above). Two outcomes beyond a plain resolved value matter:

* Returning (or the promise resolving to) a `Redirect` instance breaks the promise
  chain immediately (`Promise.reject(result)`) and the provider issues a
  `history.replace` to the redirect target - used for auth gates, canonical-URL
  redirects, etc., without ever completing navigation to the original URL.
* An unhandled rejection falls through to `props.onError` if provided, or otherwise
  just logs a `warning` - v1 expects you to handle failure cases with a redirect
  (e.g. to an error page) rather than letting a resolver throw uncaught.

`redirect(to)` differs from `navigate(to)` only in using `history.replace` instead of
`history.push`, so a redirect doesn't leave the bad/interim URL behind in the back
button history.

## Why v2 moves to atoms

None of the above is *wrong* - JARL v1 has been stable in production for years - but
several of its rough edges trace back to a single root cause: **legacy context plus
`forceUpdate` is not a real subscription model.** Every navigation re-renders
everything under the provider, `isActive` re-derives both branches from scratch on
every render of every `Link`, and there's no way for a deeply nested component to
subscribe to just the one piece of location state it cares about.

[jotai](https://jotai.org/) atoms solve exactly that problem: each atom is an
independent, subscribable unit of state, and React components that read an atom (via
`useAtomValue`) only re-render when *that atom's* derived value actually changes - not
on every navigation regardless of relevance. The v2 atoms
(`packages/jarl-atoms/src/routeAtom.ts`) reframe the whole router around this:

* A single `locationAtom`, backed by `jotai-location` in the browser (real
  `history.pushState`/`replaceState`, responding to `popstate`) and by a per-store
  override under Node - so a location can be seeded server-side for prerendering,
  which is exactly what lets this docs site itself be statically generated.
* `routeAtom(matchPath, makePath, { parent })` derives a **route atom** from a parent
  route atom (defaulting to a `rootAtom`), matching one path segment at a time and
  carrying a `rest.path` of unconsumed segments down to child route atoms - so nested
  routes compose as a chain of atoms instead of a nested-array route table walked by a
  single `RouteMap.match` call.
* Each route atom is *writable*: reading it (`get`) gives `{ match, exact, values,
  reverse }`; writing it (`set`) navigates by computing the target path via `reverse`
  and updating `locationAtom` - so `RouteMap.stringify` and `history.push` collapse into
  one atom write, instead of the `stringify` + `navigate` pair of context callbacks v1
  exposes.
* `staticRouteAtom`/`paramRouteAtom` are just `routeAtom` with a canned
  `matchPath`/`makePath`, and `transformRouteAtom` lets one route atom's matched values
  be reshaped into another shape - composable building blocks instead of one big JSON
  route table.
* The `Link` and `Route` components (`packages/jarl-react/src/Link.tsx`, `Route.tsx`)
  read/write a specific route atom directly via `useAtom`/`useAtomValue`, so a `Link`'s
  active-state and a `Route`'s match check only re-render when *that atom's* value
  changes, not on every navigation everywhere in the tree - the performance TODOs
  scattered through `RoutingProvider.js` and `Link.js` are the direct motivation.

This docs site's own top-level navigation (see the [live routing demo](/demos)) and its
`Link`/`Route` implementation are built directly on the real `jarl-atoms`/`jarl-react`
packages described above (see `packages/docs/src/router/routes.ts`) - dogfooding the
same API, not just linking to it.

The location-objects-not-URLs philosophy, the controlled-component posture, and the
`resolve`/redirect data-loading model all carry forward conceptually into v2; what's
being replaced is specifically the plumbing connecting a URL change to a re-render.
