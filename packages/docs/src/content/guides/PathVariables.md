# Path Variables

Now we've seen how to set up some static routes, let's look at something a bit more advanced.
Routing isn't much use if we have to define every single URL statically!

`paramRouteAtom` binds a single dynamic path segment to a named value, composed on top of a
parent route atom (any route atom - `rootAtom`, a `staticRouteAtom`, or another
`paramRouteAtom`, for nested dynamic segments):

routes.ts:

```ts
import { staticRouteAtom, paramRouteAtom } from "jarl-atoms";

export const productsRoute = staticRouteAtom("products");
export const productRoute = paramRouteAtom("productId", { parent: productsRoute });
```

This matches `/products/:productId`-shaped URLs: `productsRoute` consumes the `products`
segment, and `productRoute` binds whatever segment follows it to `productId`. Reading
`productRoute` (via `useRoute`, or the `values` passed to `<Route>`'s render-prop children)
gives you `{ productId: "123" }` once it matches:

```tsx
import { useEffect, useState } from "react";
import { Route } from "jarl-react";
import { productRoute } from "./routes";

const ProductPage = ({ productId }: { productId: string }) => {
    const [product, setProduct] = useState<Product | null>(null);
    useEffect(() => {
        fetch(`/api/products/${productId}`)
            .then((result) => result.json())
            .then(setProduct);
    }, [productId]);
    return product ? <ProductView product={product} /> : "Loading...";
};

export default () => (
    <Route on={productRoute} exact>
        {({ productId }) => <ProductPage productId={productId} />}
    </Route>
);
```

In this example we're optimistically loading the page and displaying a "Loading..." spinner
while the data loads. See the [Data Loading](/docs/data-loading) guide for a better way to
manage this, by moving the fetch into the route atom itself.

Linking to a dynamic route works the same way as a static one - just pass the param values as
`to`:

```tsx
<Link route={productRoute} to={{ productId: "123" }}>
    Our Best Product Ever!
</Link>
```

## Query parameters

Dynamic *path* segments aren't the only way to carry a value in a URL - `queryParamAtom` (from
`jarl-atoms`) does the same job for a single named query-string parameter, composed on top of a
parent route atom exactly like `paramRouteAtom`, except it doesn't consume a path segment:

```ts
import { staticRouteAtom, queryParamAtom } from "jarl-atoms";

export const searchRoute = staticRouteAtom("search");
export const searchQueryRoute = queryParamAtom("q", { parent: searchRoute });
```

`searchQueryRoute` matches whenever `/search` does, with `values.q` set to the current `?q=`
value (or `undefined` if it's missing - pass `{ required: true }` to make a missing query
param a non-match instead, if the page needs one to render anything meaningful). Reading,
writing, and linking all work exactly as they do for a path variable - `reverse`/`Link` append
or update just that one query param, leaving the path and any other query params untouched.

Need the whole query string as an object, rather than one named param at a time? `queryAtom`
(also from `jarl-atoms`) reads/writes it all at once.
