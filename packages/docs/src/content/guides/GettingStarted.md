## Getting Started

JARL is split across two packages: `jarl-atoms`, framework-agnostic [jotai](https://jotai.org/)
atoms that do the actual route matching, and `jarl-react`, React bindings (components + hooks)
over them. To get started you need three things: some route atoms, a jotai `<Provider>` at the
root of your app, and `Link`/`Route` from `jarl-react` to navigate and render.

### Route Atoms

routes.ts:

```ts
import { rootAtom, staticRouteAtom } from "jarl-atoms";

export const homeRoute = rootAtom;
export const aboutRoute = staticRouteAtom("about");
```

Each of these is a **route atom**: a jotai atom that, when read, tells you whether its path
currently matches (`match`, `exact`, `values`) and how to build a URL for it (`reverse`); when
_written_, it navigates there. `rootAtom` matches `/` itself and is the implicit parent every
other route atom builds on unless you give it a different `parent`. `staticRouteAtom("about")`
matches a single fixed path segment - here, `/about`.

Unlike a v1-style route table, there's no single object describing your whole site: each page
is its own atom, composed out of smaller ones (see the [Path Variables](/docs/path-variables)
guide for nesting and dynamic segments).

The next task is to make these atoms live. Route atoms read/write a shared `locationAtom`
that's ultimately backed by the browser's `history` API (via jotai's own `Provider`/store, no
separate `history` package to configure), so all you need at the root of your app is a
`<Provider>`.

main.tsx:

```tsx
import { createRoot } from "react-dom/client";
import { Provider } from "jotai";
import App from "./App";

createRoot(document.getElementById("root")!).render(
    <Provider>
        <App />
    </Provider>
);
```

Finally, render based on which route atom currently matches, using `<Route>` from `jarl-react`:

App.tsx:

```tsx
import { Route } from "jarl-react";
import { homeRoute, aboutRoute } from "./routes";
import { HomePage, AboutPage } from "./pages";

export default () => (
    <>
        <Route on={homeRoute} exact>
            <HomePage />
        </Route>
        <Route on={aboutRoute} exact>
            <AboutPage />
        </Route>
    </>
);
```

`exact` means "only render when this is the final matched segment, not just because a
descendant route also matches" - without it, `homeRoute` (which everything else is built on
top of) would match on every page, not just `/`.

There is one piece missing of course - we can't actually navigate between the pages yet! Let's
see what a Menu component will look like, using `Link`:

Menu.tsx:

```tsx
import { Link } from "jarl-react";
import { homeRoute, aboutRoute } from "./routes";

export default () => (
    <nav>
        <Link route={homeRoute} to={{}} exact>
            Home
        </Link>
        <Link route={aboutRoute} to={{}}>
            About
        </Link>
    </nav>
);
```

`Link` takes the route atom to link to plus the param `values` for it (`{}` here, since neither
route has any dynamic segments) and reverses them back into an `href` - so your route atoms
stay the single source of truth for URL shape in both directions, exactly like a v1 location
object did, just expressed as atoms instead of a route table.

That's it for the basics! Continue to [Path Variables](/docs/path-variables) for dynamic
segments, or [Data Loading](/docs/data-loading) for fetching data as part of a route match.
