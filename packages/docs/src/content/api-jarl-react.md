# jarl-react API reference

Hand-curated reference for the core exports of `jarl-react` - the React bindings (components +
hooks) built on top of the framework-agnostic route atoms in
[`jarl-atoms`](/api/jarl-atoms). `jarl-react` does not re-export `jarl-atoms`: get your route
atoms from `jarl-atoms` and these components/hooks from `jarl-react`.

## `<Link route to>`

Renders an anchor (or `element`) linking to a route atom plus param values. Clicking navigates
by writing to the route atom instead of triggering a full page load - `href` still resolves to
a real, right-clickable/`Cmd`-clickable URL, it's just intercepted on a plain click.

| prop              | type                    | required | description                                                        |
| ----------------- | ----------------------- | -------- | ------------------------------------------------------------------ |
| `route`           | `RouteAtom<T>`          | yes      | The route atom this link points at.                                |
| `to`              | `T`                     | no       | Param values to reverse into a path for this route (default `{}`). |
| `exact`           | `Boolean`               | no       | Only report `active`/apply `activeClassName` for an exact match.   |
| `activeClassName` | `String`                | no       | Extra class applied only while this link is active.                |
| `element`         | `Component` \| `String` | no       | Render as something other than `a` (default `a`).                  |
| `children`        | `Node` \| `Function`    | no       | Function-as-child receives `{ href, active, onClick }`.            |

Also forwards any other standard anchor props (e.g. `className`, `target`) straight through to
the rendered element, and sets a `data-active` attribute while active so links can be styled in
pure CSS without needing `activeClassName`.

## `<Route on children exact>`

Renders its children only while the given route atom matches the current location.

| prop       | type                 | required | description                                                                             |
| ---------- | -------------------- | -------- | --------------------------------------------------------------------------------------- |
| `on`       | `RouteAtom<T>`       | yes      | The route atom to check.                                                                |
| `children` | `Node` \| `Function` | no       | Plain nodes, or a function receiving the matched route's `values`.                      |
| `exact`    | `Boolean`            | no       | Only render on an exact (leaf) match, not just because a descendant route also matches. |

## `<Switch children fallback>`

Renders only the first of its `<Route>` children that is currently active, or `fallback` when
none of them is.

| prop       | type   | required | description                              |
| ---------- | ------ | -------- | ---------------------------------------- |
| `children` | `Node` | no       | `<Route>` elements, in precedence order. |
| `fallback` | `Node` | no       | Rendered when no child route is active.  |

```jsx
<Switch fallback={<NotFound />}>
  <Route on={homeRoute} exact>
    <Home />
  </Route>
  <Route on={usersRoute}>
    <UsersSection />
  </Route>
</Switch>
```

Each child is judged by its own rule - a child with `exact` counts only on a leaf match, one
without counts on an ancestor match too - so `<Switch>` renders whichever child would have
rendered on its own. All it adds is that later children stop once one has.

That makes nesting the natural thing: a non-`exact` `<Route>` is a section, and a `<Switch>`
inside it catches the URLs that fall through _within_ that section, without the outer `fallback`
firing too.

### `<Switch>` or `notAtom`?

[`notAtom`](/api/jarl-atoms) answers the same catch-all question one layer down, as a boolean
atom over a list of route atoms. The two are complements rather than rivals:

- **`<Switch>` gives you precedence.** Overlapping siblings - `staticRouteAtom("new")` and
  `paramRouteAtom("id")` under the same parent - are _both_ exact matches at `/users/new`. In a
  `<Switch>` the earlier one wins. `notAtom` cannot express that at all.
- **`<Switch>` derives its route list from its own children.** `notAtom(...)` needs every route
  at that level restated as an argument and kept in step with the JSX by hand, which is what
  makes a per-section not-found expensive once there is more than one section.
- **`notAtom` works where there is no JSX.** It is a plain atom: read it outside rendering (say,
  to decide an HTTP status while prerendering) or outside React entirely.

### Sharp edges

Children must be `<Route>` elements. Conditional children (`{flag && <Route ... />}`) are fine,
but a fragment or any other wrapper around a group of routes throws - `<Switch>` cannot see
through it, and quietly ignoring the routes inside would be worse. Nest a `<Switch>` inside a
`<Route>` rather than grouping children.

The catch-all is a `fallback` prop rather than a trailing `<Route>` with no `on`, as in
react-router's original `<Switch>`. A pathless route would mean weakening `on` to optional for
every user of `<Route>` to serve one position in one parent, and a catch-all only ever belongs
last, so encoding it in child order buys nothing.

## Hooks

All hooks take a route atom (from `jarl-atoms`) as their first argument.

- **`useRoute(routeAtom)`** - subscribes to a route atom and returns its current match state
  (`{ match, exact, values, reverse, ... }`). Equivalent to `useAtomValue(routeAtom)`.
- **`useNavigate(routeAtom)`** - returns a stable `(values) => void` function that navigates to
  the given route atom with the supplied param values.
- **`useIsActive(routeAtom, { exact? })`** - returns whether the route atom currently matches
  (or, with `exact: true`, whether it's an exact/leaf match).
- **`useHref(routeAtom, values)`** - reverses a route atom's pattern with the given param values
  into a URL path, without subscribing to navigation/click handling.
- **`useLink(routeAtom, values, { exact? })`** - the hook `<Link>` itself is built on: returns
  `{ href, active, onClick }` in one call, for building link-like components without going
  through the `Link` component.

`jarl-react` also re-exports jotai's own `useAtom`, `useAtomValue`, and `useSetAtom`, so
composing directly with a route atom (or with `jarl-atoms` primitives like `resolvedAtom`)
never needs a separate direct dependency on `jotai`.

---

See the [v1 History](/history) page for how JARL's original `RoutingProvider`/`routing()` HOC
API worked, and why the atomic model replaced it.
