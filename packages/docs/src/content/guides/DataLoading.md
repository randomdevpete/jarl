# Data Loading

Most of the time in a real application, every route carries with it some data requirements.
Rather than managing an `isLoading` flag by hand in every component that needs data, JARL lets
you attach a loader to a route atom and let jotai's own async-atom machinery (and, in React,
`Suspense`) manage the loading state for you.

`resolvedAtom` (from `jarl-atoms`) takes a route atom and a loader function, and resolves once
that route matches:

routes.ts:

```ts
import { staticRouteAtom, paramRouteAtom } from "jarl-atoms";
import { resolvedAtom } from "jarl-atoms";

export const productsRoute = staticRouteAtom("products");
export const productRoute = paramRouteAtom("productId", { parent: productsRoute });

export const productDataRoute = resolvedAtom(productRoute, async ({ productId }) => {
    const result = await fetch(`/api/products/${productId}`);
    return result.json();
});
```

`resolvedAtom` is a plain jotai async atom (`Atom<Promise<Data | Redirect | undefined>>`), so
any of jotai's usual ways of consuming one work - the most idiomatic in React is `useAtomValue`
under a `Suspense` boundary:

```tsx
import { Suspense } from "react";
import { useAtomValue } from "jarl-react";
import { productDataRoute } from "./routes";

const ProductPage = () => {
    const product = useAtomValue(productDataRoute);
    return <ProductView product={product} />;
};

export default () => (
    <Suspense fallback="Loading...">
        <ProductPage />
    </Suspense>
);
```

By loading data as part of the route atom itself, the data is guaranteed to exist (or the
resolver's `Promise` is still pending, transparently handled by `Suspense`) by the time
`ProductPage` renders - no separate loading flag to plumb through. If you'd rather not suspend,
jotai/utils' `loadable()` wraps any async atom into a synchronous `{ state: "hasData" | "loading"
| "hasError", ... }` value instead.

## Redirecting

Sometimes a route shouldn't render at all, and should instead send the visitor somewhere else -
an auth gate, a canonical-URL redirect, or (as below) a resolver that didn't find what it was
looking for. `redirect(to)` marks that outcome:

```ts
import { staticRouteAtom, paramRouteAtom, resolvedAtom, redirect } from "jarl-atoms";

export const productBySlugRoute = paramRouteAtom("productSlug", { parent: productsRoute });

export const productBySlugDataRoute = resolvedAtom(productBySlugRoute, async ({ productSlug }) => {
    const response = await fetch(`/api/productsBySlug?slug=${productSlug}`);
    if (!response.ok) {
        return redirect("/products/not-found");
    }
    return response.json();
});
```

A `Redirect` returned from a resolver doesn't navigate anywhere by itself - reading the atom
just tells you a redirect *would* happen, which keeps it composable and testable like any other
value. To actually perform the navigation, wire `followResolvedRedirects` up once near the root
of your app (typically alongside where you create your jotai store):

```ts
import { followResolvedRedirects } from "jarl-atoms";
import { productBySlugDataRoute } from "./routes";

const unsubscribe = followResolvedRedirects(store, [productBySlugDataRoute]);
```

It subscribes to each resolved atom given and, the moment one produces a `Redirect`, replaces
the current location with its target (`history.replaceState`, so the abandoned URL doesn't
linger in the back-button history).

If a route should redirect unconditionally - with no data fetch involved at all -
`redirectAtom`/`followRedirects` do the same job without the `resolvedAtom` wrapper:

```ts
import { redirectAtom, followRedirects } from "jarl-atoms";
import { staticRouteAtom } from "jarl-atoms";

export const oldAboutRoute = staticRouteAtom("about-us");
export const oldAboutRedirect = redirectAtom("/about", { parent: oldAboutRoute });

followRedirects(store, [oldAboutRedirect]);
```
