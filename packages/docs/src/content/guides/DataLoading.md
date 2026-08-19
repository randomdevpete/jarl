# Data Loading

Most of the time in a real application, every route carries with it some data requirements.
Rather than managing component-level loading states or suspense fallbacks and watching the
page layout churn as everything resolves, JARL lets you attach a loader to a route atom and
resolve everything it needs before the route ever renders - jotai's own async-atom machinery,
behind a single `Suspense` boundary in React, handles the wait.

`asyncRouteAtom` (from `jarl-atoms`) takes a route atom, a name for what the loader produces,
and the loader itself. Its `.data` is a plain jotai async atom that resolves once that route
matches:

routes.ts:

```ts
import { staticRouteAtom, paramRouteAtom, asyncRouteAtom } from "jarl-atoms";

export const productsRoute = staticRouteAtom("products");
export const productRoute = paramRouteAtom("productId", { parent: productsRoute });

export const productData = asyncRouteAtom(productRoute, "product", async ({ productId }) => {
  const result = await fetch(`/api/products/${productId}`);
  return result.json();
}).data;
```

`.data` is `Atom<Promise<Data | Redirect | undefined>>`, so any of jotai's usual ways of
consuming an async atom work - the most idiomatic in React is `useAtomValue` under a `Suspense`
boundary:

```tsx
import { Suspense } from "react";
import { useAtomValue } from "jarl-react";
import { productData } from "./routes";

const ProductPage = () => {
  const product = useAtomValue(productData);
  return <ProductView product={product} />;
};

export default () => (
  <Suspense fallback="Loading...">
    <ProductPage />
  </Suspense>
);
```

By loading data as part of the route atom itself, the data is guaranteed to exist (or the
loader's `Promise` is still pending, transparently handled by `Suspense`) by the time
`ProductPage` renders - no separate loading flag to plumb through. If you'd rather not suspend,
jotai/utils' `loadable()` wraps any async atom into a synchronous `{ state: "hasData" | "loading"
| "hasError", ... }` value instead.

Read this way, `.data` has no bearing on whether the route matches and needs nothing else wired
up. The name you passed (`"product"` above) is only used by the next section.

## Routes that only exist if the data does

Sometimes the lookup _is_ the route. Whether `/blog/some-slug` is a page at all is a question only
the database can answer, and answering it twice - once to decide, once to render - is a wasted
call. Drop the `.data` and keep the atom itself: the load then decides the match, and whatever it
found is bound to the route's own values under the name you gave it.

```ts
import { staticRouteAtom, paramRouteAtom, asyncRouteAtom } from "jarl-atoms";
import { db } from "./db";

export const blogRoute = staticRouteAtom("blog");
export const slugRoute = paramRouteAtom("slug", { parent: blogRoute });

export const postRoute = asyncRouteAtom(slugRoute, "post", ({ slug }) => db.findPost(slug));

/** Every async route in the app, in one list to preload, hydrate and follow. */
export const asyncRoutes = [postRoute];
```

`undefined` back from the loader means the route doesn't match, so a `Switch` fallback (or
`notAtom`) renders your not-found case. A hit matches, with the loaded object typed onto `values`:

```tsx
<Switch fallback={<NotFound />}>
  <Route on={postRoute} exact>
    {({ post }) => <PostView post={post} />}
  </Route>
</Switch>
```

`post` here is a `Post`, not an `unknown` you have to narrow, and `PostView` fetches nothing of
its own.

### Server rendering

Route matching is synchronous everywhere in JARL, so the load has to have settled before a
render can read it. On the server that is a single `await`, and it is what lets the response
carry a real 404 status rather than a 200 whose body happens to say "not found":

```tsx
const store = createStore();
store.set(locationAtom, { pathname, searchParams });

const routeData = await preloadAsyncRoutes(store, asyncRoutes);
const html = renderToString(
  <Provider store={store}>
    <App />
  </Provider>,
);
const status = store.get(notFoundAtom) ? 404 : 200;
```

`notFoundAtom` there is `notAtom(...everyRouteYouRender)` - listing `postRoute` rather than
`slugRoute`, so an unknown slug counts as a miss.

`preloadAsyncRoutes` returns one snapshot per route, in the order given. Serialise them into the
page and the client picks up where the server left off, without repeating the load:

```tsx
hydrateAsyncRoutes(store, asyncRoutes, window.__ROUTE_DATA__ ?? []);
followAsyncRoutes(store, asyncRoutes);
hydrateRoot(root, <Provider store={store}>{<App />}</Provider>);
```

`followAsyncRoutes` keeps the routes settled from then on, re-running each load as the location
changes. While one is in flight, `postRoute.pending` is `true` - render a spinner on it, or the
not-found case will flash before the answer arrives.

This lifecycle is what gating costs. A route read only through `.data` never needs any of it.

## Redirecting

Sometimes a route shouldn't render at all, and should instead send the visitor somewhere else -
an auth gate, a canonical-URL redirect, or (as below) a loader that didn't find what it was
looking for. `redirect(to)` marks that outcome:

```ts
import { staticRouteAtom, paramRouteAtom, asyncRouteAtom, redirect } from "jarl-atoms";

export const productBySlugRoute = paramRouteAtom("productSlug", { parent: productsRoute });

export const productBySlugData = asyncRouteAtom(productBySlugRoute, "product", async ({ productSlug }) => {
  const response = await fetch(`/api/productsBySlug?slug=${productSlug}`);
  if (!response.ok) {
    return redirect("/products/not-found");
  }
  return response.json();
}).data;
```

A `Redirect` returned from a loader doesn't navigate anywhere by itself - reading the atom
just tells you a redirect _would_ happen, which keeps it composable and testable like any other
value. To actually perform the navigation, wire `followAsyncRedirects` up once near the root
of your app (typically alongside where you create your jotai store):

```ts
import { followAsyncRedirects } from "jarl-atoms";
import { productBySlugData } from "./routes";

const unsubscribe = followAsyncRedirects(store, [productBySlugData]);
```

It subscribes to each `.data` atom given and, the moment one produces a `Redirect`, replaces
the current location with its target (`history.replaceState`, so the abandoned URL doesn't
linger in the back-button history).

If a route should redirect unconditionally - with no data fetch involved at all -
`redirectAtom`/`followRedirects` do the same job without a loader:

```ts
import { redirectAtom, followRedirects } from "jarl-atoms";
import { staticRouteAtom } from "jarl-atoms";

export const oldAboutRoute = staticRouteAtom("about-us");
export const oldAboutRedirect = redirectAtom("/about", { parent: oldAboutRoute });

followRedirects(store, [oldAboutRedirect]);
```
