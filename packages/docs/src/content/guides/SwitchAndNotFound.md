# Switch & Not Found Pages

A page built from several `<Route>`s side by side renders every one that matches - useful when
routes genuinely overlap, but usually not what you want for a set of alternatives. `Switch`
renders only the first matching child, and a `fallback` for when none does.

```tsx
import { Route, Switch } from "jarl-react";
import { aboutRoute, usersRoute, userRoute } from "./routes";

export default () => (
  <Switch fallback={<NotFound />}>
    <Route on={aboutRoute} exact>
      <AboutPage />
    </Route>
    <Route on={usersRoute} exact>
      <UsersPage />
    </Route>
    <Route on={userRoute} exact>
      {({ id }) => <UserPage id={id} />}
    </Route>
  </Switch>
);
```

Children are judged in order, each by its own `exact` prop - the first `<Route>` whose `on`
matches (exactly, if it says `exact`) wins, and the rest don't render even if they'd have
matched too. `Switch` reads its children's props rather than rendering them to find out, so they
must be literal `<Route>` elements: a fragment or wrapper around a group of them hides those
routes from `Switch`, and throws rather than silently dropping them. A conditional child is fine -
`{showAdmin && <Route on={adminRoute}>...</Route>}` - `Switch` just skips a falsy one.

Nest a `Switch` inside a `<Route>` for a fallback scoped to that branch, rather than the whole
app falling back to the same not-found page regardless of where in the tree the miss happened:

```tsx
<Switch fallback={<NotFound />}>
  <Route on={usersRoute}>
    <Switch fallback={<UserNotFound />}>
      <Route on={usersRoute} exact>
        <UsersIndex />
      </Route>
      <Route on={userRoute} exact>
        {({ id }) => <UserPage id={id} />}
      </Route>
    </Switch>
  </Route>
</Switch>
```

`/users/42/settings` falls back to `<UserNotFound />` from the inner `Switch`; only a path outside
`usersRoute` entirely reaches the outer one. Note the outer `<Route on={usersRoute}>` has no
`exact`: it's there to select the branch, not to render a leaf.

## `notAtom`: not-found as a value, not a render

`Switch`'s fallback solves what to _render_ when nothing matches. Sometimes you also need the
answer as plain data - most commonly a real HTTP status code from a server render, which has to
exist before there's any HTML to talk about. `notAtom` is a boolean atom: `true` when none of the
given route atoms is an exact match.

```ts
// routes.ts
export const notFoundAtom = notAtom(homeRoute, aboutRoute, usersRoute, userRoute);
```

```tsx
// entry-server.tsx
const status = store.get(notFoundAtom) ? 404 : 200;
```

List every route your app actually renders, the same way `Switch`'s children would be listed.
`notAtom` checks `exact` rather than `match`: an ancestor route (`usersRoute`, or `rootAtom`
itself) is `match: true` for everything beneath it, so checking `match` would mean `notAtom` never
fires. For an async route, list the async atom itself (`asyncRouteAtom`'s return value) rather
than its underlying param route - an unresolved lookup is a genuine miss even though the param
route it wraps still matched syntactically. See the [Data Loading](/docs/data-loading) guide for
how that interacts with `preloadRoutes`.

## Nested routers and the status code

A route atom scoped under its own `basePath` (see
[Location & Base Paths](/docs/location-and-base-paths)) routes a whole subtree that the outer route
table knows nothing about. Listing its mount point in `notAtom` won't do: the mount point is only
`exact` for the subtree's index page, so every deeper URL inside it would report a 404 while the
subtree happily renders a page.

`notAtom` is a plain jotai atom, so compose over it rather than working around it - exempt each
nested router's whole subtree by its `match`, and let the subtree answer for itself:

```ts
const exactRouteMissedAtom = notAtom(homeRoute, aboutRoute, usersRoute, userRoute, blogMountRoute);

export const notFoundAtom = atom((get) => get(exactRouteMissedAtom) && !get(blogMountRoute).match);
```

That's a deliberate trade: anything under the nested router's mount returns a 200 even when the
subtree renders its own not-found view. Where the answer genuinely matters to a crawler, keep the
routes in the outer table instead - or, when the miss is a lookup rather than a URL shape, use an
`asyncRouteAtom`, which `notAtom` can judge exactly.
