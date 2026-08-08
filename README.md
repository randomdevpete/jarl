# JARL

JARL: Atomic Routing Library.

The production grade "batteries included" **controlled component** router.

[![latest npm version](https://img.shields.io/npm/v/jarl-react.svg)](https://www.npmjs.com/package/jarl-react)
[![downloads](https://img.shields.io/npm/dm/jarl-react.svg)](https://www.npmjs.com/package/jarl-react)
[![dependencies](https://david-dm.org/downplay/jarl-react.svg?path=packages/jarl-react)](https://david-dm.org/downplay/jarl-react?path=packages/jarl-react)
[![CI](https://github.com/downplay/jarl-react/actions/workflows/ci.yml/badge.svg)](https://github.com/downplay/jarl-react/actions/workflows/ci.yml)
[![Cypress end-to-end tests](https://img.shields.io/badge/cypress-dashboard-brightgreen.svg)](https://dashboard.cypress.io/#/projects/ps43vs/runs)
[![Join the conversation on Discord](https://img.shields.io/discord/437254750946459648.svg)](https://discord.gg/BVcQ6Z)

If you just want the docs: [JARL demos and documentation](http://jarl.downplay.co)

## Why another router?

A web router simply performs a mapping between URL and state. I wanted
something that did this job extremely well without getting in the way
of application structure and without mixing routing logic up with the component tree. JARL's
routes are defined in a top-level config and are used to generate a `location` object.
Routing decisions can then be made in your application by making this `location` state
available and using simple conditions. (For instance, the is no `<Switch/>` component: just use a `switch` statement instead!)

'Locations' are defined as simple serializable state objects. The route table is then a
mapping between URLs and these objects. The router is a controlled component, meaning you decide how and when the location actually gets updated. This provides some key benefits:

*   The state can be stored in Redux, local state, or any other storage mechanism,
    and used for making any rendering decisions
*   URLs don't ever need to be used inside your application, instead Link can build
    its URL from state objects, making it very easy to tweak your route structure at any time
*   React Native support becomes very easy since we can drop the URLs entirely and everything still works!

Some examples of state mapping:

`/about` -> `{page: "about"}`
`/product/:productId` -> `{page: "product", productId: <string>}`

All routing can be described using this simple approach.

## Features

*   Controlled Router with "batteries included"
*   Object-based locations (instead of URLs)
*   Full querystring matching support
*   Resolve promises during routing and redirect if required
*   And much more...

## Concrete Example

Add to your project:

```
yarn add jarl-react
```

Declare a routing table:

```js
const routes = [
    // Home page route
    {
        path: "/",
        // Model the state however you want!
        // Here we decided to use a `page` property to
        // switch between pages:
        state: { page: "home" }
    },
    // Another static page
    {
        path: "/about",
        state: { page: "about" }
    },
    // A dynamic URL for viewing products
    {
        path: "/products/:productId",
        // The `productId` property be merged into state when the
        // route matches
        state: { page: "product" },
        // Nested child routes are straightforward:
        routes: [
            {
                path: "/comments",
                // All the state will be merged down the branch,
                // so we'll end up with the following:
                // { page: "product", productId: <id>, tab: "comments" }
                state: { tab: "comments" }
            }
        ]
    },
    // Dynamic (and in brackets for optional) query parameters:
    {
        path: "/search?q=:search&sort=(:sortKey)",
        state: { page: "search" }
    },
    // Finally a catch-all `*` route for any bad URLs...
    // ...including matching any query params into a 'query' hash
    {
        path: "/*:missingPath?*=:query",
        state: { page: "404" }
    }
];
```

Load the routes and a `history` implementation of your choice into your `RoutingProvider`:

```js
const history = createBrowserHistory();
ReactDOM.render(
    <RoutingProvider history={history} routes={routes}>
        <App />
    </RoutingProvider>,
    rootElement
);
```

(See [history](https://github.com/ReactTraining/history) package for `createBrowserHistory` and other variations)

And finally in your `App` component you can inject the state to perform the actual routing:

```js
import { routing } from "jarl-react";

// All our possible state variables are made available in the App
const App = ({ page, productId, search, sortKey, tab, missingPath }) => {
    // Our routing is just one big switch statement - no component needed!
    switch (page) {
        case "home":
            return <HomePage />;
        case "about":
            return <AboutPage />;
        case "product":
            // Inside ProductPage we'll have a similar switch or some other
            // conditional to maybe render a tab...
            return <ProductPage productId={productId} tab={tab} />;
        case "search":
            return <SearchPage search={search} sortKey={sortKey} />;
        case "404":
            return <MissingPage path={missingPath} />;
    }
};

// State is actually injected into App using the `routing` higher-order component
export default routing()(App);
```

Wait, we missed something! How do you actually link to a page? JARL has a Link component much like other router libraries, but its unique feature is that we can actually generate URLs from exactly the same state objects as specified in our routing table. Your main menu might look like this:

```js
import { Link } from "jarl-react";

const MainMenu = () => (
    <nav>
        <Link to={{ page: "home" }}>Home</Link>
        <Link to={{ page: "about" }}>About</Link>
        <Link to={{ page: "product", productId: 123 }}>
            Our Best Product Ever!
        </Link>
        <SearchForm />
    </nav>
);
```

These links will use the routing table in reverse to stringify all the correct URLs to your pages, e.g. the product link will become `<a href="/product/123">`.

The `SearchForm` component needs to handle links in a slightly different way, as it needs to programmatically navigate to the search page. It looks like this:

```js
class SearchForm extends React.Component {
    state = { searchText: "" };

    handleChange = e => {
        // Standard controlled input state management
        this.setState({ searchText: e.target.value });
    };

    render() {
        return (
            <form>
                <input
                    type="text"
                    value={this.state.searchText}
                    onChange={this.handleChange}
                    placeholder="Enter search term"
                />
                {/* Use the function-as-child pattern of Link to dynamically construct the search location and navigate programmatically using `onClick` */}
                <Link to={{ page: "search", search: this.state.searchText }}>
                    {({ onClick }) => <button onClick={onClick}>Search</button>}
                </Link>
            </form>
        );
    }
}

export default SearchForm;
```

That's all the basics! Hopefully this gave a flavour of the power and simplicity of this routing system. For more complex scenarios, there is also a `routing` higher-order component giving access to current location as well as all the router functions (serializing URLs from location objects, calling navigate or redirect, and checking whether links are active). More advanced demos (such as data preloading and code splitting) will be showcased in the demo site...

## Documentation

Detailed documentation, and demos with annotated code samples, can be viewed at the following address:

[JARL demos and documentation](https://jarl.downplay.co)

[Changelog](https://jarl.downplay.co/changelog)

## Tests & Demos

```
git clone https://github.com/downplay/jarl-react
cd jarl-react
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

## Releases & versioning

`jarl-atoms` and `jarl-react` are versioned and released together via
[semantic-release](https://semantic-release.gitbook.io/), driven by
[Conventional Commits](https://www.conventionalcommits.org/) on `master`. Major version
bumps are suppressed by design (breaking changes produce a minor bump instead) while the
v2 API is still settling. See [`docs/release-strategy.md`](./docs/release-strategy.md)
for the full details.

## Community

We have a dedicated Discord server with CI announcements in #build: https://discord.gg/BVcQ6Z

Or, come and join the conversation at Reactiflux: https://discordapp.com/invite/KWHrBDe

## Credits

Query string parsing by `qs`: https://github.com/ljharb/qs

Some ideas and inspiration from `redux-first-router`: https://github.com/faceyspacey/redux-first-router

And to some extent the [Autoroute](http://www.davidhayden.me/blog/autoroute-custom-patterns-and-route-regeneration-in-orchard-1.4) feature of Orchard CMS, which I was a contributor to many moons ago ;)

Recommended browser history abstraction, `history` by ReactTraining: https://github.com/ReactTraining/history

## Copyright

©2017-2018 Downplay Ltd

Distributed under MIT license. See LICENSE for full details.
