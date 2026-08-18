# JARL: Atomic Routing Library

Routing for the atomic age

[![latest npm version](https://img.shields.io/npm/v/jarl-react.svg)](https://www.npmjs.com/package/jarl-react)
[![downloads](https://img.shields.io/npm/dm/jarl-react.svg)](https://www.npmjs.com/package/jarl-react)
[![CI](https://github.com/randomdevpete/jarl/actions/workflows/ci.yml/badge.svg)](https://github.com/randomdevpete/jarl/actions/workflows/ci.yml)
[![Discord](https://img.shields.io/badge/%20-5865F2?logo=discord&logoColor=white&label=)](https://discord.gg/6yGq39rJ63)

If you just want the docs: [JARL demos and documentation](https://jarl.randomdev.co.uk)

## What is a router?

A web router, fundamentally, is very simple: a mapping between URL and state. I have always
wanted something that did just this job extremely well, but without getting in the way of or
dictating application structure, and without forcing route matching logic into the component
tree itself, where it never seemed to belong. JARL builds that mapping out of composable atoms
using [jotai](https://jotai.org/) under the hood: each route is its own atom, with a link to a
parent atom and so on up to the [`rootAtom`](/api/jarl-atoms#rootatom); each one matching a
piece of the URL (normally a path segment) and telling you both whether it *currently* matches,
as well as **how to build a URL _to_ that route** based on a given state. Routing decisions in
your application then decompose to very simple logic based on the current states of these
atoms; a simple `switch` statement or series of `if`s is enough to decide what components to
render, and navigation can be performed by *calling the atom setter*. (Convenience components
like [`<Route>`](/api/jarl-react#route) and [`<Switch>`](/api/jarl-react#switch) and of course
the ubiquitous [`<Link>`](/api/jarl-react#link) are of course provided in the React package, if
you want to build more compositionally; they all just accept atoms for parameters instead of
type-unsafe strings.)

Because each route atom is an independent, subscribable unit of jotai state, only components
that actually read route state are re-rendered by navigation, resolving a URL against the whole
route table is fast, and the bundle stays small. Those claims are
[measured against react-router](/docs/benchmarks) rather than asserted - including the workloads
where the two routers tie, and the one where react-router is quicker.

## Features

*   Map URLs directly to state (and back again) - the URL becomes the source of truth
*   Composable route atoms - build nested/dynamic routes out of small, independent pieces
*   Framework-agnostic core (`jarl-atoms`) with lightweight React bindings (`jarl-react`)
*   Full querystring matching support
*   Resolve promises during routing (via jotai's own async atoms) and redirect if required
*   SSR/SSG-safe: the resolved location atom is hydratable per-render on the server
*   And much more...

## Concrete Example

Add to your project (`jotai` is a peer dependency of both packages - install it
alongside so there's exactly one copy in your tree):

```
npm install jarl-atoms jarl-react jotai
```

Declare some route atoms:

```ts
// routes.ts
import { rootAtom, staticRouteAtom, paramRouteAtom } from "jarl-atoms";

export const homeRoute = rootAtom;
export const aboutRoute = staticRouteAtom("about");
export const productsRoute = staticRouteAtom("products");
// The `productId` segment is bound into `values` when this route matches:
export const productRoute = paramRouteAtom("productId", { parent: productsRoute });
```

Wrap your app in a jotai `<Provider>` (this is what makes the shared location atom live) and
render based on which route atom currently matches, using `<Route>`:

```tsx
// main.tsx
import { createRoot } from "react-dom/client";
import { Provider } from "jotai";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <Provider>
    <App />
  </Provider>
);
```

```tsx
// App.tsx
import { Route } from "jarl-react";
import { homeRoute, aboutRoute, productRoute } from "./routes";

const App = () => (
  <>
    <Route on={homeRoute} exact>
      <HomePage />
    </Route>
    <Route on={aboutRoute} exact>
      <AboutPage />
    </Route>
    <Route on={productRoute} exact>
      {({ productId }) => <ProductPage productId={productId} />}
    </Route>
  </>
);

export default App;
```

Wait, we missed something! How do you actually link to a page? JARL has a `Link` component much
like other router libraries, but its unique feature is that it links directly to a route atom
plus param values, generating the URL by reversing that same atom:

```tsx
import { Link } from "jarl-react";

const MainMenu = () => (
  <nav>
    <Link route={homeRoute} exact>Home</Link>
    <Link route={aboutRoute}>About</Link>
    <Link route={productRoute} to={{ productId: "123" }}>
      Our Best Product Ever!
    </Link>
    <SearchForm />
  </nav>
);
```

These links use each route atom's `reverse()` to stringify the correct URL, e.g. the product
link becomes `<a href="/products/123">`.

A component that needs to navigate programmatically (rather than render a plain link) can use
the `useNavigate` hook instead:

```tsx
import { atom, useAtom } from "jotai";
import { useNavigate } from "jarl-react";
import { queryParamAtom } from "jarl-atoms";

// A single named query-string param is its own composable route atom too:
const searchQueryRoute = queryParamAtom("q");

// Controlled search input value also tracked in an atom
const searchTextAtom = atom("");

const SearchForm = () => {
  const [searchText, setSearchText] = useAtom(searchTextAtom);
  const navigate = useNavigate(searchQueryRoute);
  return (
    <form onSubmit={(e) => { e.preventDefault(); navigate({ q: searchText }); }}>
      <input
        type="text"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Enter search term"
      />
      <button type="submit">Search</button>
    </form>
  );
};

export default SearchForm;
```

That's all the basics! Hopefully this gave a flavour of the power and simplicity of this
routing system. See the [docs site](https://jarl.randomdev.co.uk) for query strings, redirects, and
data loading (resolving promises as part of a route match, `jarl-atoms`' `resolvedAtom`) in more
depth.

## Documentation

Detailed documentation, and demos with annotated code samples, can be viewed at the following address:

[JARL demos and documentation](https://jarl.randomdev.co.uk)

[Changelog](https://jarl.randomdev.co.uk/changelog)

## Tests & Demos

```
git clone https://github.com/randomdevpete/jarl
cd jarl
npm install
npm run build
```

To run unit tests:

```
npm test
```

To run the docs/demo site (`packages/docs`):

```
npm run dev
```

To run E2E tests (using [Playwright](https://playwright.dev)):

```
npm run test:e2e:install   # once, to install the suite's deps and browsers
npm run test:e2e
```

To check the packages as actually published on npm — installed from the registry into a
clean consumer project, with no workspace linking (see
[`e2e/registry-smoke`](./e2e/registry-smoke)):

```
npm run test:smoke:install
npm run test:smoke
```

## Releases & versioning

`jarl-atoms` and `jarl-react` are versioned and released together via
[semantic-release](https://semantic-release.gitbook.io/), driven by
[Conventional Commits](https://www.conventionalcommits.org/) on `master`. Major version
bumps are suppressed by design (breaking changes produce a minor bump instead) while the
v2 API is still settling. See [`docs/release-strategy.md`](./docs/release-strategy.md)
for the full details.

## Community

We have a dedicated Discord server with CI announcements in #build: https://discord.gg/6yGq39rJ63

Or, come and join the conversation at Reactiflux: https://discordapp.com/invite/KWHrBDe

## Credits

Built on [jotai](https://jotai.org/) atoms and `jotai-location` for the underlying,
SSR-safe browser history binding.

Some ideas and inspiration from `redux-first-router`: https://github.com/faceyspacey/redux-first-router

And to some extent the [Autoroute](http://www.davidhayden.me/blog/autoroute-custom-patterns-and-route-regeneration-in-orchard-1.4) feature of Orchard CMS, which I was a contributor to many moons ago ;)

## Copyright

©2017-2026 Randomdev Ltd

Distributed under MIT license. See [LICENSE.md](./LICENSE.md) for full details.
