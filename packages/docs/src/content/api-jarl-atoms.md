# jarl-atoms API reference

The core exports of `jarl-atoms` - the framework-agnostic half of JARL. Everything here is a
plain [jotai](https://jotai.org/) atom with no React dependency; the React components and hooks
that consume these atoms live in the sibling [`jarl-react`](/api/jarl-react) package. See the
[v1 History](/history) page for how JARL's original `RouteMap`/`RoutingProvider` API worked, and
why the atomic model replaced it.

Every route atom - whatever kind - shares the same shape when read: `{ match, exact, values,
reverse, rest? }`. `match`/`exact` tell you whether (and how completely) it matches the current
location, `values` gives you the params it (and its ancestors) bound, and `reverse(values)`
turns a set of param values back into a URL. Writing to a route atom navigates.

The reference below is generated from the doc comments on each export.
