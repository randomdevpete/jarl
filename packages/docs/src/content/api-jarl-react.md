# jarl-react API reference

Hand-curated reference for the core exports of `jarl-react` - the React bindings (components +
hooks) built on top of the framework-agnostic route atoms in
[`jarl-atoms`](/api/jarl-atoms). `jarl-react` does not re-export `jarl-atoms`: get your route
atoms from `jarl-atoms` and these components/hooks from `jarl-react`.

## `<Link route to>`

Renders an anchor (or `element`) linking to a route atom plus param values. Clicking navigates
by writing to the route atom instead of triggering a full page load - `href` still resolves to
a real, right-clickable/`Cmd`-clickable URL, it's just intercepted on a plain click.

| prop | type | required | description |
| --- | --- | --- | --- |
| `route` | `RouteAtom<T>` | yes | The route atom this link points at. |
| `to` | `T` | no | Param values to reverse into a path for this route (default `{}`). |
| `exact` | `Boolean` | no | Only report `active`/apply `activeClassName` for an exact match. |
| `activeClassName` | `String` | no | Extra class applied only while this link is active. |
| `element` | `Component` \| `String` | no | Render as something other than `a` (default `a`). |
| `children` | `Node` \| `Function` | no | Function-as-child receives `{ href, active, onClick }`. |

Also forwards any other standard anchor props (e.g. `className`, `target`) straight through to
the rendered element, and sets a `data-active` attribute while active so links can be styled in
pure CSS without needing `activeClassName`.

## `<Route on children exact>`

Renders its children only while the given route atom matches the current location.

| prop | type | required | description |
| --- | --- | --- | --- |
| `on` | `RouteAtom<T>` | yes | The route atom to check. |
| `children` | `Node` \| `Function` | no | Plain nodes, or a function receiving the matched route's `values`. |
| `exact` | `Boolean` | no | Only render on an exact (leaf) match, not just because a descendant route also matches. |

## Hooks

All hooks take a route atom (from `jarl-atoms`) as their first argument.

* **`useRoute(routeAtom)`** - subscribes to a route atom and returns its current match state
  (`{ match, exact, values, reverse, ... }`). Equivalent to `useAtomValue(routeAtom)`.
* **`useNavigate(routeAtom)`** - returns a stable `(values) => void` function that navigates to
  the given route atom with the supplied param values.
* **`useIsActive(routeAtom, { exact? })`** - returns whether the route atom currently matches
  (or, with `exact: true`, whether it's an exact/leaf match).
* **`useHref(routeAtom, values)`** - reverses a route atom's pattern with the given param values
  into a URL path, without subscribing to navigation/click handling.
* **`useLink(routeAtom, values, { exact? })`** - the hook `<Link>` itself is built on: returns
  `{ href, active, onClick }` in one call, for building link-like components without going
  through the `Link` component.

`jarl-react` also re-exports jotai's own `useAtom`, `useAtomValue`, and `useSetAtom`, so
composing directly with a route atom (or with `jarl-atoms` primitives like `resolvedAtom`)
never needs a separate direct dependency on `jotai`.

---

See the [v1 History](/history) page for how JARL's original `RoutingProvider`/`routing()` HOC
API worked, and why the atomic model replaced it.
