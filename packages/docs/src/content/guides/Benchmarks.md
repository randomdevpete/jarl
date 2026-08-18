# Benchmarks

The README claims routing with subscribable atoms is efficient; this page holds the actual
measurements behind that claim, compared against react-router — including the places where JARL
ties or loses. The full harness is checked into the repo under
[`bench/`](https://github.com/randomdevpete/jarl/tree/master/bench) and reproducible with a
single command from the repo root:

```bash
npm run bench
```

## Setup

|                   |                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| jarl              | `jarl-atoms` 2.6.0 + `jarl-react` 2.6.0 (jotai 2.20.2, jotai-location 0.6.2)                                       |
| react-router      | 8.3.0 — data router (`createBrowserRouter`); the deep-nesting scenario also covers the declarative `<Routes>` form |
| react / react-dom | 19.2.8 (identical for both)                                                                                        |
| environment       | Node 24.15.0, Intel i7-1165G7, Linux (WSL2)                                                                        |

Two app shapes are driven by every router under comparison: a flat app (a layout with 13
active-styled nav links, 10 components that read no route state, and four routed pages) and a
five-level nested app. The harness asserts all implementations of a shape produce
**byte-identical HTML** after every navigation, so every number below compares the same rendered
output. Timed results are medians with quartiles over repeated samples, GC forced between
samples and warm-up samples discarded; render counts are deterministic and need no sampling.
The timed numbers below are one full run of the suite; the orderings and ratios were stable
across five repeat runs under varying background load, absolute medians within about ±20%.

## Re-renders per navigation (flat app)

Renders per component group, navigating by clicking links (jsdom, counts identical across runs):

| component group                             | jarl                  | react-router  |
| ------------------------------------------- | --------------------- | ------------- |
| nav links (13), per navigation              | 13                    | 13            |
| changed page, per navigation                | 1                     | 1             |
| layout, per navigation                      | 0                     | 0             |
| non-routing components (10), per navigation | 0                     | 0             |
| everything above, at initial mount          | nav links ×2, rest ×1 | everything ×1 |

**This is a tie, not a win.** Components that read no route state are never re-rendered by
navigation in either router; react-router's context-based model is more precise here than it is
usually given credit for. Every active-styled link re-renders on every navigation in both
routers — each subscribes to location state to know whether it is active — including when
re-clicking the already-active link. JARL's one measured deficit: each route-atom subscriber
renders twice at initial mount, once for the tree and once when `atomWithLocation` first syncs.

Two caveats the harness surfaced:

- A route atom's value is a fresh object on every location change, so _every_ subscriber of _any_
  route atom re-renders on _any_ navigation — atom-level subscription narrows _which components
  subscribe_, it does not currently skip unaffected routes.
- JARL's `active` flag is route-level: two links to the same route atom with different param
  values both report active. The harness narrows it to href-level by comparing param values, to
  match react-router's semantics.

## Matching and navigation throughput

Pure library cost, React excluded, over a 100-route table (50 static sections each with a
`:id` param child), per operation:

| workload                                   | jarl                           | react-router                |
| ------------------------------------------ | ------------------------------ | --------------------------- |
| resolve URL → matched leaf (warm)          | **120 µs** (p25 110 / p75 131) | 407 µs (p25 380 / p75 471)  |
| resolve, cold store per URL (as SSR would) | **164 µs** (p25 143 / p75 180) | 407 µs (stateless)          |
| client navigation via each API             | 138 µs (p25 123 / p75 160)     | **79 µs** (p25 72 / p75 96) |

### Why is react-router's navigation faster than its resolution?

Navigating does resolve the route — these two rows are not contradictory, they price different
work. The public `matchRoutes()` flattens and ranks the whole route config on **every call**. A
data router does that **once at creation**, keeps the ranked branches, and each
`router.navigate()` matches against them (`precomputedBranches` in react-router's `router.ts`).
So the resolve row is what an ad-hoc `matchRoutes` caller pays per call, table preparation
included; the navigate row is what a mounted client app pays per navigation, where that
preparation is already amortised to zero.

The benchmark demonstrates this directly by holding the matched URL at the **first-ranked
branch** while the table grows, so per-call match work is constant and any growth is per-call
preparation:

| routes in table | `matchRoutes` | `router.navigate` | jarl (first leaf read) |
| --------------- | ------------- | ----------------- | ---------------------- |
| 2               | 17 µs         | 61 µs             | 12 µs                  |
| 20              | 112 µs        | 79 µs             | 18 µs                  |
| 100             | 421 µs        | 73 µs             | 18 µs                  |

`matchRoutes` scales linearly with table size — its per-call cost is dominated by preparing the
table, not matching against it. `router.navigate` is near-flat: warm matching is a few µs and
the rest is its state-machine and subscriber work. jarl has no preparation step to amortise —
route atoms are their own index, so a cold resolve pays only a fresh jotai store, never a table
prep — which is why it wins the resolve row outright while losing the navigate row to a router
that has already paid resolution's expensive half up front.

jarl's leaf reads also stop at the first match where `matchRoutes` ranks then scans, so the
resolve row's URLs deliberately cycle an early, middle and late hit plus a miss rather than
sampling only the cheap case. And the navigate row understates jarl's deficit if anything:
`router.navigate` runs react-router's whole data-router state machine, strictly more work than
the atom write it beats.

## Deep nesting

Five nested levels (`/d1/:p1/d2/:p2/…/d5/:p5`), each level a layout rendering its own param and
one static child, against three implementations: jarl's nested `Switch`/`Route` atoms,
react-router's data router (route config), and react-router's declarative `<Routes>` form.
Render counts per navigation are **identical across all three** — a three-way tie, and not a
flattering one:

| component group, per navigation | jarl | rr data router | rr `<Routes>` |
| ------------------------------- | ---- | -------------- | ------------- |
| every level layout (5)          | 5    | 5              | 5             |
| per-level static children (5)   | 5    | 5              | 5             |
| nav links (6)                   | 6    | 6              | 6             |
| shell                           | 0    | 0              | 0             |

Whether only the leaf param changes, a mid-level one or the root one, **every level re-renders
in every router**: each level reads its own param, every router hands out fresh param/values
objects per navigation, and each re-rendered layout recreates its children's elements. Atom-level
subscription does not narrow this — jarl's known caveat that route atoms produce fresh objects
per location change applies at every level at once. jarl also repeats its mount deficit here
(nav links render twice at initial mount).

Since the same components re-render everywhere, the routers can only differ in per-render cost,
so the same leaf toggle is also timed with React included (click to committed DOM, production
builds, `flushSync`):

| per navigation, React render + commit | median                         |
| ------------------------------------- | ------------------------------ |
| react-router `<Routes>`               | **137 µs** (p25 122 / p75 150) |
| react-router data router              | 397 µs (p25 355 / p75 517)     |
| jarl                                  | 493 µs (p25 434 / p75 585)     |

A clear jarl loss, and an instructive ordering: the declarative `<Routes>` form — no state
machine, a tiny route table re-matched per render — is the fastest way to do a deep navigation,
the data router pays its state machine, and jarl pays re-deriving five levels of route atoms
plus six `useAtom` subscribers. (Absolute numbers are jsdom without layout or paint; the ranking
is the result.)

## Nested async data

A three-level route chain where every level needs one **25ms** async lookup, measured from
navigation to the deepest level's data on screen, fresh param values per run so no cache is ever
warm:

| strategy                                                | median                            |
| ------------------------------------------------------- | --------------------------------- |
| jarl: `asyncRouteAtom` + `followAsyncRoutes` (parallel) | **26.8 ms** (p25 26.4 / p75 27.1) |
| react-router: loaders (parallel)                        | **26.9 ms** (p25 26.2 / p75 27.7) |
| react-router: per-component Suspense cascade            | 78.1 ms (p25 77.5 / p75 78.5)     |

jarl's atom pre-resolution starts every level's lookup the moment the location changes — the
param routes chain on each other, not on the async atoms, so no lookup waits for another's
data — and lands in ~one lookup's time. A fetch-on-render Suspense cascade cannot start a
level's lookup until its parent has rendered, so it pays the full sum of the chain, 3× here and
growing with depth. The honest comparison: react-router's loaders exist precisely to avoid that
cascade and match jarl's parallel time exactly. The cascade row is the cost of _not_ using a
router-level data story on either side — jarl's atoms give you the parallel behaviour as the
idiomatic default, react-router's requires opting into loaders.

## Bundle size

The same minimal routed app bundled from each router's published dist build (rolldown, minified,
production, `react`/`react-dom` external):

|                                                                    | minified | min+gzip   |
| ------------------------------------------------------------------ | -------- | ---------- |
| jarl, full cost (jarl-atoms + jarl-react + jotai + jotai-location) | 14.1 kB  | **5.7 kB** |
| jarl, app already using jotai                                      | 4.6 kB   | **2.0 kB** |
| react-router                                                       | 90.1 kB  | 28.3 kB    |

Not a like-for-like feature set: react-router's bundle carries its data APIs (loaders, actions,
lazy routes) whether or not the app uses them, where JARL's data loading is jotai's own async
atoms. It is, however, the real wire cost of "a routed app" with each library.

## What these numbers do not show

- No real-browser timings — no layout, paint or input latency; jsdom timings cover library and
  React render/commit work only.
- react-router's actions and lazy-route machinery are unexercised.
- Two app shapes and two route-table shapes; splats or query-heavy routing may rank differently.
