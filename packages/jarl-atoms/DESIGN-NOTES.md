# Design notes

This file preserves the intent behind exploratory sketches that were originally
left as commented-out code in `src/routeAtom.ts` on the first (uncommitted)
draft of the v2 atoms core. They were lifted out here — rather than deleted —
so the alternative designs they were exploring aren't lost, in case a later
ticket (atom coverage gaps, React bindings, etc.) wants to revisit them. Designs
explored and rejected since are recorded here too.

## Tuple-shaped `RouteReturn`

```ts
// | [match: false, values: undefined, reverse: (values: T) => string]
// | [match: true, values: T, reverse: (values: T) => string];
```

An alternative to the object-shaped `RouteReturn` that shipped
(`{ match, values, exact, rest, reverse }`). A tuple would be more compact to
destructure (`const [match, values, reverse] = get(routeAtom)`), at the cost
of losing property names at call sites and making it harder to add fields
later (e.g. `exact`/`rest`) without a breaking positional change. The object
shape was kept for extensibility; worth revisiting only if ergonomics become
a real complaint.

## Alternate generic type extraction (`Extract<T, RoutePath>`)

```ts
// type Extract<T, RoutePath extends Path = Path> = T extends DefaultParams
//   ? T
//   : ExtractRouteParams<RoutePath>;
```

Sketch of a helper that would let `routeAtom` infer its param type either
from an explicit generic `T` or, if omitted, from parsing the pattern string
itself via `ExtractRouteParams<RoutePath>` (a template-literal-type param
extractor already defined earlier in the file but never wired up to
`routeAtom`, which instead takes explicit `matchPath`/`makePath` functions).
Wiring `ExtractRouteParams` up to infer types straight from a path-pattern
string, rather than requiring callers to hand-write `matchPath`/`makePath`,
is a reasonable follow-up if a string-pattern route helper is wanted (e.g.
`routeAtom<'/users/:id'>(...)` inferring `{ id: string }` automatically).

## Pattern-string-driven `routeAtom` overload

```ts
// export const routeAtom = <
//   T extends DefaultParams | undefined = undefined,
//   RoutePath extends Path = Path
// >(
//   pattern: RoutePath
// ): WritableAtom<RouteReturn<Extract<T>>, Extract<T>> => {
//   const reverse = (values: Extract<T>) => pattern;
//   return atom(
//     (get) => {
//       const location = get(locationAtom);
//       // TODO: Magic here with pieces of Jarl
//       const match = location.pathname === pattern;
//       const values = {} as unknown as Extract<T>;
//       return match ? [match, values, reverse] : [match, undefined, reverse];
//     },
//     (get, set, action) => {
//       set(locationAtom, { pathname: reverse(action) });
//     }
//   );
// };
```

An earlier, simpler `routeAtom` sketch that took a single pattern string
(e.g. `"/users/:id"`) and matched the _whole_ location pathname against it in
one atom, rather than the path-segment-by-segment composition the shipped
`routeAtom`/`staticRouteAtom`/`paramRouteAtom` use (each route atom consumes
one segment off its parent's remaining path via `rest.path`). The segment
composition model won out because it supports nesting route atoms as parents
of other route atoms (see `RouteOptions.parent`), which a single
whole-pathname match can't do without re-parsing the full pattern at every
level. This sketch also used the tuple `RouteReturn` shape above and never
got its `matchPath`/`values` extraction implemented (`values = {} as
unknown as Extract<T>` was a stub) — both would need finishing if this
approach were revived instead of the segment-composition one.

## Alternate return type annotation

```ts
// : Match<T extends DefaultParams ? T : ExtractRouteParams<RoutePath>>;
```

A leftover return-type annotation for the pattern-string `routeAtom` sketch
above, referencing a `Match<T>` type that was never defined in this file.
Dead in isolation; only relevant if the pattern-string sketch is revived.

## Scoping `locationAtom` to a path prefix with a jotai store

Rejected in favour of `rootRouteAtom({ basePath })`.

The idea was to mount a subtree in its own jotai store whose `locationAtom` reads
and writes relative to a prefix, so the subtree's route atoms could be declared
without knowing where they are mounted. Two mechanisms exist and neither works:

- **A nested `<Provider store={createStore()}>`.** jotai stores don't inherit, so
  the subtree gets its own `atomWithLocation`, which only refreshes on `popstate`.
  Navigating inside the subtree calls `history.pushState`, which fires no
  `popstate`, so the outer store keeps serving the old pathname: the URL changes
  while every route atom outside the subtree still matches the previous location.
- **A store that shares state with its parent but overrides `locationAtom`.**
  jotai 2.20 exposes this only as `INTERNAL_buildStoreRev3` and friends — private,
  revision-numbered API that `jotai-scope` is built on. Not a dependency a router
  can take on a peer's internals.

`rootRouteAtom({ basePath })` gets the useful half of the idea in one store: route
atoms below it are static module-level values, and the prefix is named once, on the
root, where a `reverse()` can prepend it again.

## A derived "this chain always matches" bit on `RouteAtom`

Rejected in favour of `requireMatch`/`useRequiredRoute`.

Whether a chain can miss is a property of how its atoms compose, so the obvious design is to
derive it: `RouteAtom<T, Always extends boolean = boolean>`, `RouteReturn<T, Always>` collapsing
to the matched branch when `Always` is `true`, and every constructor threading the bit through
`RouteOptions` from its parent. It typechecks — `Extract`/conditional types are enough, no
type-surgery dependency — and assignability survives, because `RouteAtom` is covariant in its
read type. Three things sink it anyway:

- **The provable class is almost empty.** Only `rootRoute` (or `rootRouteAtom()` with no
  `basePath`) is unconditionally total, and every path route can miss by construction, so a
  chain qualifies only if it binds nothing off the path at all: optional `queryParamRouteAtom`s and
  total `transformRouteAtom`s, and nothing else.
- **It doesn't cover the case that motivated it.** The data-grid demo roots on
  `rootRouteAtom({ basePath: "/demos/data-grid" })`, which reports `match: false` for any
  location outside the prefix. A sound derivation has to call that chain partial. What actually
  guarantees the match is the `<Route>` the demo is mounted under — knowledge that lives above
  the atoms and can't be recovered from them.
- **`transformRouteAtom` can't report it.** Its getter is declared `=> Return | undefined`, so
  totality would have to be inferred from the callback's own return type, changing how `Return`
  is inferred for every existing caller.

A manual `alwaysMatches: true` opt-in avoids the derivation entirely and was rejected on
soundness: it makes the type assert something nothing checks, so a wrong guarantee surfaces as
`undefined` field access far from the claim. `requireMatch` is the same assertion made by the
same caller, checked, and thrown at the point it is wrong.

## Naming: `*RouteAtom` vs `*Atom`

The suffix names the return type. An export whose value is a `RouteAtom` — something you can read
for a `RouteReturn`, write param values to in order to navigate, pass as another route's `parent`,
or hand to `<Route on={...}>` — ends in `RouteAtom`. An export that is any other kind of atom ends
in `Atom` alone.

So `routeAtom`, `staticRouteAtom`, `paramRouteAtom`, `numericRouteAtom`, `transformRouteAtom`,
`validateRouteAtom`, `queryParamRouteAtom`, `redirectRouteAtom`, `asyncRouteAtom`,
`rootRouteAtom` and `rootRoute` are all routes; `locationAtom` (the location they read
from), `queryAtom` (the whole query string as state), `notAtom` (`Atom<boolean>`) and
`navigationGuardAtom` (`Atom<string | null>`) are not. The rule already held at the type level —
`RouteAtom` and `AsyncRouteAtom` against `NavigationGuardAtom` — before the values were brought
into line with it.

One export sits outside the return-type rule even though it is a route: `rootRoute`. Every other
name above is a factory — it takes an argument, even an optional one, and returns an atom
instance — which already matches jotai core's own convention that a `...Atom`-suffixed export
is a _factory_ for an atom instance, not the instance itself (`atomFamily`, `atomWithStorage`,
and every route/guard constructor in this package). `rootRoute` is not a factory; it is the one
no-arg default instance built by calling its own factory, `rootRouteAtom({ basePath })`. Naming
that instance `rootRouteAtom` (as first landed) put a value on the factory side of jotai's
convention; renaming the instance to `rootRoute` and promoting the factory from
`createRootRouteAtom` to `rootRouteAtom` puts both back on the right side — the bare word names
the value, the `Atom`-suffixed word names what makes one. This is not a second suffix rule: it
only bites where a factory and its own ready-made instance share one root word, which happens
exactly once in this package. `queryAtom` is a singleton with no factory of its own name
competing for it, and every other `*RouteAtom` is a pure factory with no default instance, so the
return-type rule above still decides their names outright.

The distinction is worth carrying in the names because the two categories are not
interchangeable anywhere they appear, and the pairs that read alike are exactly the ones that
mislead: `rootRoute` and `locationAtom` are both ambient singletons but only one is a route,
and `queryAtom` and `queryParamRouteAtom` sound like two flavours of query state when only the
second participates in matching. An options type takes its atom's name minus the `Atom`
(`RootRouteOptions`, `QueryParamRouteOptions`, `NumericRouteOptions`).

Dropping `Route` from every name instead was rejected: `routeAtom` would collide with jotai's own
`atom`, and `staticAtom`/`paramAtom` name nothing.

No deprecated aliases were kept for the old names. Two names per export would make the surface
less consistent rather than more, which is the opposite of the point, and the alias would then
need its own removal later.

## Naming a fixed-value segment: `enumRouteAtom`

`enum` is the ecosystem's word for a value drawn from a fixed set of strings — JSON Schema's and
OpenAPI's `enum`, and zod's `z.enum([...])`, which takes the same non-empty literal tuple and
yields the same string-literal union. It is not TypeScript's `enum` keyword, which this package
uses nowhere; what the route binds is a union of literals. It also keeps the segment constructors
named for the kind of segment they match — static, param, numeric, enum — which is what makes the
family scannable.

Two other names were rejected. `setRouteAtom` satisfies the return-type rule above but collides
with jotai's write vocabulary, where `set` means "write to an atom": `useSetAtom(setRouteAtom(...))`
is a sentence fighting itself. `oneOfRouteAtom` reads well in isolation, but "one of" names a choice
between whole alternatives — JSON Schema's `oneOf` is exactly a union of schemas — which is what a
primitive combining several _routes_ wants, not one constraining a single segment to a value set.
The two do different jobs and neither subsumes the other, so two near-synonymous names would only
invite reaching for the wrong one.

## A fixed-value segment needs no precedence rule

A path segment is one string, so at most one member of the set can match it: matching is a
membership test rather than an ordered scan, and the order the values are listed in decides
nothing. What can still overlap is a route and its _siblings_ — a `staticRouteAtom("about")` and an
`enumRouteAtom` that accepts `"about"` under the same parent both match `/about` — but that is the
ordinary ambiguity of declaring two routes for one URL, which no single route atom can see.
