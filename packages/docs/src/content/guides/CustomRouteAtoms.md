# Custom Route Atoms

`staticRouteAtom` and `paramRouteAtom` cover most real routes, but both are themselves built
from a smaller primitive: `routeAtom`. Reach for it directly when a segment's syntax doesn't fit
either - a two-letter locale code, a regex-constrained slug, anything `matchPath`/`makePath`
can express that a bare string or bare variable can't.

```ts
import { routeAtom, staticRouteAtom } from "jarl-atoms";

export const shopRoute = staticRouteAtom("shop");

export const localeRoute = routeAtom<{ locale: string }>(
  (path) => (/^[a-z]{2}$/.test(path) ? { locale: path } : undefined),
  ({ locale }) => locale,
  { parent: shopRoute },
);
```

`matchPath` receives the next unconsumed path segment and either returns the values it binds, or
`undefined` for "this atom doesn't match here". `makePath` is its inverse, used by `reverse()` and
writes. Both also receive jotai's `get`, so a match can depend on other atoms - a feature flag, a
locale list fetched at startup.

## Reshaping values with `transformRouteAtom`

`transformRouteAtom` doesn't match path segments itself - it wraps another route atom and
reshapes its `values`, both for reading and for `reverse()`/write:

```ts
import { paramRouteAtom, transformRouteAtom } from "jarl-atoms";

const idParam = paramRouteAtom("id");
export const numericIdRoute = transformRouteAtom<{ id: string }, { id: number }>(
  idParam,
  (values) => (isNaN(Number(values.id)) ? undefined : { id: Number(values.id) }),
  (values) => ({ id: String(values.id) }),
);
```

`getter` only runs once the wrapped atom matches, and returning `undefined` from it rejects the
match entirely - the mechanism a constrained segment uses to say "matched syntactically, but not
semantically". `setter` is the inverse: it must produce values the wrapped atom itself accepts,
since `reverse`/write pass straight through to it. Get this wrong (an id that doesn't round-trip
through both directions) and `reverse()` will build a URL a real navigation won't match.

## `numericRouteAtom`

The numeric case above is common enough to ship pre-built: `numericRouteAtom` is exactly a
`paramRouteAtom` plus a `transformRouteAtom` that only matches all-digit segments, converts them
to a `number`, and can reject values outside an inclusive `min`/`max` range:

```ts
import { staticRouteAtom, numericRouteAtom } from "jarl-atoms";

export const blogRoute = staticRouteAtom("blog");
export const yearRoute = numericRouteAtom("year", { parent: blogRoute });
export const monthRoute = numericRouteAtom("month", { parent: yearRoute, min: 1, max: 12 });
```

`/blog/2024/13` doesn't match `monthRoute` at all (13 is outside `max`), rather than matching
with an invalid month - so a bad month never reaches your component as data to validate. Reading
a matched route hands back `{ year: 2024 }` as a real `number`, not a string you'd otherwise have
to parse yourself.
