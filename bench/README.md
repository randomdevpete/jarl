# jarl vs react-router benchmark

A reproducible comparison of jarl (`jarl-atoms` + `jarl-react`) and react-router. Results and
interpretation are published in the docs site's [Benchmarks guide](../packages/docs/src/content/guides/Benchmarks.md);
this README defines exactly what is measured and how to re-run it.

```bash
# from the repo root: builds jarl-atoms + jarl-react, then runs everything
npm run bench
```

`npm test` in this workspace runs only the deterministic render-count comparison (no timing), so it
is safe in CI; the timed benchmarks run under `NODE_ENV=production` in a forked Node process with
`--expose-gc`.

## What is measured

### Re-renders per navigation (`src/renders.test.tsx`)

Both routers drive the same app — a layout with 13 active-styled nav links, 10 components that read
no route state ("widgets"), and four routed pages — defined once in `src/shape.ts` and
`src/apps/sharedComponents.tsx`, with only the router integration differing per app. Navigation is
performed by clicking the rendered links under jsdom, and every component tallies its own renders.
Counts are deterministic, so there is no sampling; the run also asserts that both apps produce
**byte-identical HTML** after mount and after every single navigation, which is what makes the
comparison like-for-like.

Nav links are built from each router's public hook primitives (`useAtom` over the route atom for
jarl; `useMatch`/`useHref`/`useLinkClickHandler` for react-router) so both render the same anchor
markup. One deliberate deviation, discovered by the parity assertion: jarl's own `active` flag
(`useLink`/`activeClassName`) is route-level — every link to a route atom reports active whatever
its param values — so the jarl nav link narrows it to href-level by also comparing param values,
matching react-router's semantics.

React's development build is used here; without StrictMode it renders each component once per
update, the same as production, and no timing is taken from this file.

### Matching/resolve throughput (`src/matching.benchmark.ts`)

Pure library cost with React excluded, over a 100-route table (50 static sections, each with a
`:id` param child), run under plain Node. Neither side touches history or the DOM there: jarl's
`locationAtom` falls back to its server path, and react-router is given a config or a memory
router. The two libraries match with different machinery, so the workloads are defined by
outcome rather than mechanics:

- **resolve** — one URL string in, the matched leaf out. jarl writes `locationAtom` and reads leaf
  route atoms in order until one matches, which is exactly what a mounted `Switch` does — its
  `findIndex` short-circuits too, so a hit early in the table costs less than a late one or a
  miss. The measured URLs cycle an early, middle and late hit plus a miss so neither library is
  measured only at its best. react-router calls `matchRoutes` over the equivalent config, which
  ranks the whole table on every call. The "cold" jarl variant pays a fresh jotai store per
  resolve, as each SSR request would; `matchRoutes` is stateless, so its cold and warm costs are
  the same call.
- **navigate** — one client-side navigation through each library's own API: a param-value write to
  a route atom plus re-reading the leaves, versus `router.navigate()` on a memory router
  (awaited — its API is promise-based). Not equivalent work: `router.navigate()` runs
  react-router's full data-router state machine, where the atom write only re-derives state. jarl
  is slower here regardless, so the gap this understates is jarl's own.

Each number is 30 retained samples of 1000 operations, after 10 discarded warm-up samples, with GC
forced between samples; reported as median with p25/p75 and min/max.

### Bundle size (`src/bundle-size.benchmark.ts`)

The two entries in `src/size/` implement the same minimal app using each router's typical surface.
Each is bundled from the packages' published dist builds with rolldown (minified,
`NODE_ENV=production` defined, `react`/`react-dom` external) and reported minified and gzipped
(zlib level 9). jarl is reported both with its full dependency cost (jotai + jotai-location
bundled) and with jotai external, for apps already using jotai.

## What the numbers do not show

- No real-browser timings: navigation cost here is library work only, not layout/paint, and jsdom
  is used solely for deterministic render counting.
- No data APIs: react-router's loaders/actions/lazy-route machinery and jarl's async route atoms
  are unexercised, though the react-router bundle necessarily carries that code.
- One app shape and one route-table shape; different shapes (deep nesting, splats, query-heavy
  routing) may rank differently.
