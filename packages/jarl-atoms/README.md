# jarl-atoms

JARL: Atomic Routing Library - the framework-agnostic routing core.

## This Package

`jarl-atoms` implements routing as a tree of composable [jotai](https://jotai.org)
atoms with no React dependency: each route is an atom that reads the current
location, matches (or doesn't) against its own path segment, and can be
written to in order to navigate. `jarl-react` binds these atoms to React
(components + hooks); `jarl-atoms` is usable entirely on its own with plain
jotai, e.g. from a vanilla store in a non-React app or on the server.

## Install

`jotai` is a peer dependency: install it alongside `jarl-atoms` so your app and this
package share the same copy - atoms created here are only usable with the same jotai
instance a consuming component's `<Provider>` (or `createStore()`) uses.

```bash
npm install jarl-atoms jotai
```

## Usage

Routes are built up from `rootAtom` (or `createRootAtom()` for a scoped
`basePath`) using `staticRouteAtom` and `paramRouteAtom`, each optionally
nested under a `parent`:

```ts
import { createStore } from "jotai/vanilla";
import { staticRouteAtom, paramRouteAtom, rootAtom } from "jarl-atoms";

const docsAtom = staticRouteAtom("docs");
const docAtom = paramRouteAtom("docName", { parent: docsAtom });

const store = createStore();

// Read the current match
const result = store.get(docAtom);
if (result.match) {
  console.log(result.values.docName);
}

// Navigate by writing to the atom - this drives history.pushState
store.set(docAtom, { docName: "getting-started" });

// Build a href without navigating
const href = store.get(docAtom).reverse({ docName: "getting-started" });
```

Other exports: `queryAtom`/`queryParamAtom` (query-string state, composable
the same way as path atoms), `redirectAtom`, and `asyncRouteAtom` (async data for
a route, read as `.data`; read as a route instead and the route exists only if
the load found something, with what it found bound to the route's values). See
the full docs and demos for the complete model:

[JARL demos and documentation](https://jarl.randomdev.co.uk)

For source code and issue tracking, please see the monorepo:

https://github.com/randomdevpete/jarl

For questions and support, drop into our Discord:

https://discord.gg/6yGq39rJ63

## Copyright

&copy;2017-2026 Randomdev Ltd

Distributed under MIT license. See [LICENSE.md](./LICENSE.md) for full details.
