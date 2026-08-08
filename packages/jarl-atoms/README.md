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
the same way as path atoms), `redirectAtom`, and `resolvedAtom`. See the full
docs and demos for the complete model:

[JARL demos and documentation](https://jarl.downplay.co)

For source code and issue tracking, please see the monorepo:

https://github.com/downplay/jarl-react

For questions and support, drop into our Discord:

https://discord.gg/SHSXU3

## Copyright

&copy;2017-18 Downplay Ltd

Distributed under MIT license. See LICENSE for full details.
