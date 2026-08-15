# JARL: Atomic Routing Library

Routing for the atomic age

[![latest npm version](https://img.shields.io/npm/v/jarl-react.svg)](https://www.npmjs.com/package/jarl-react)
[![downloads](https://img.shields.io/npm/dm/jarl-react.svg)](https://www.npmjs.com/package/jarl-react)
[![jarl-atoms npm version](https://img.shields.io/npm/v/jarl-atoms.svg)](https://www.npmjs.com/package/jarl-atoms)
[![jarl-atoms downloads](https://img.shields.io/npm/dm/jarl-atoms.svg)](https://www.npmjs.com/package/jarl-atoms)
[![dependencies](https://david-dm.org/randomdevpete/jarl.svg?path=packages/jarl-react)](https://david-dm.org/randomdevpete/jarl?path=packages/jarl-react)
[![CI](https://github.com/randomdevpete/jarl/actions/workflows/ci.yml/badge.svg)](https://github.com/randomdevpete/jarl/actions/workflows/ci.yml)
[![Cypress end-to-end tests](https://img.shields.io/badge/cypress-dashboard-brightgreen.svg)](https://dashboard.cypress.io/#/projects/ps43vs/runs)
[![Join the conversation on Discord](https://img.shields.io/discord/437254750946459648.svg)](https://discord.gg/6yGq39rJ63)

If you just want the docs: [JARL demos and documentation](http://jarl.downplay.co)

## Why another router?

A web router simply performs a mapping between URL and state. I wanted something that did this
job extremely well without getting in the way of application structure and without mixing
routing logic up with the component tree. JARL builds that mapping out of composable
[jotai](https://jotai.org/) atoms: each route is its own atom, matching a piece of the URL and
telling you both whether it currently matches and how to build a URL back out of param values.
Routing decisions in your application are then just React state reads via hooks. (There's no
`<Switch/>` component either - a `<Route>` per page, or a plain conditional, does the job.)

Because each route atom is an independent, subscribable unit of jotai state, a component that
reads one only re-renders when *that atom's* derived value actually changes - not on every
navigation everywhere in the tree, which is where the "atomic" in "Atomic Routing Library"
comes from.

## Features

*   Composable route atoms - build nested/dynamic routes out of small, independent pieces
*   Framework-agnostic core (`jarl-atoms`) with thin, hooks-first React bindings (`jarl-react`)
*   Full querystring matching support
*   Resolve promises during routing (via jotai's own async atoms) and redirect if required
*   SSR/SSG-safe: the shared location atom is seedable per-render on the server
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
        <Link route={homeRoute} to={{}} exact>Home</Link>
        <Link route={aboutRoute} to={{}}>About</Link>
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
import { useState } from "react";
import { useNavigate } from "jarl-react";
import { queryParamAtom } from "jarl-atoms";

// A single named query-string param is its own composable route atom too:
const searchQueryRoute = queryParamAtom("q");

const SearchForm = () => {
    const [searchText, setSearchText] = useState("");
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
routing system. See the [docs site](https://jarl.downplay.co) for query strings, redirects, and
data loading (resolving promises as part of a route match, `jarl-atoms`' `resolvedAtom`) in more
depth.

## Documentation

Detailed documentation, and demos with annotated code samples, can be viewed at the following address:

[JARL demos and documentation](https://jarl.downplay.co)

[Changelog](https://jarl.downplay.co/changelog)

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

©2017-2018 Downplay Ltd

Distributed under MIT license. See LICENSE for full details.
