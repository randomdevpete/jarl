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

Matched values are merged with the parent's, so `localeRoute` reads back everything `shopRoute`
bound as well as its own `locale`. That merge is what lets a leaf route be linked to with one
`to` object covering the whole chain.

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

Nothing about it is path-specific, so it composes over query params just as happily. The
[data grid demo](/demos/data-grid) parses a `?sort=-price` query value into
`{ key: "price", direction: "desc" }` on the way down and serialises it back on the way up, so
the components below it never see the raw string.

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

## Constraints spanning several segments: `validateAtom`

A segment's own options only bound it in isolation. `/blog/2024/02/31` passes every one of them -
`31` is all digits, and no `max` on a day segment can know which month it landed in. `validateAtom`
narrows an existing route to the values a predicate accepts, and it sees the whole chain's values,
not just the last segment's:

```ts
import { numericRouteAtom, validateAtom } from "jarl-atoms";

const daySegment = numericRouteAtom("day", { parent: monthRoute });
export const dayRoute = validateAtom(daySegment, ({ year, month, day }) => isValidCalendarDate(year, month, day));
```

31 February now simply doesn't match, and falls through to whatever handles a non-matching URL -
a `Switch` fallback, or the 404 that `notAtom` reports (see
[Switch & Not Found](/docs/switch-and-not-found)). The alternative - matching, then checking the
date inside the page component - makes every consumer of that route responsible for a rule the
route itself should own. The [blog routing demo](/demos/blog-routing) does exactly this.

`validateAtom` is a `transformRouteAtom` with an identity `setter` and a predicate for a `getter`,
so it changes a route's values not at all - only whether it matches. Its predicate takes a `Getter`
too, for a constraint that depends on other atoms rather than only on the values in the URL.

For a lookup that has to go somewhere asynchronous before it can answer "does this exist", the
predicate shape isn't enough - see `asyncRouteAtom` in the [Data Loading](/docs/data-loading)
guide.
