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

|                   |                                                                              |
| ----------------- | ---------------------------------------------------------------------------- |
| jarl              | `jarl-atoms` 2.6.0 + `jarl-react` 2.6.0 (jotai 2.20.2, jotai-location 0.6.2) |
| react-router      | 8.3.0, data router (`createBrowserRouter`)                                   |
| react / react-dom | 19.2.8 (identical for both)                                                  |
| environment       | Node 24.15.0, Intel i7-1165G7, Linux (WSL2)                                  |

Both routers drive the _same app_: a layout with 13 active-styled nav links, 10 components that
read no route state, and four routed pages. The harness asserts both implementations produce
**byte-identical HTML** after every navigation, so every number below compares the same rendered
output. Timed results are medians over 30 samples of 1000 operations each (10 warm-up samples
discarded, GC forced between samples); render counts are deterministic and need no sampling.

## Re-renders per navigation

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
| resolve URL → matched leaf (warm)          | **103 µs** (p25 99 / p75 110)  | 375 µs (p25 367 / p75 402)  |
| resolve, cold store per URL (as SSR would) | **117 µs** (p25 112 / p75 127) | 375 µs (stateless)          |
| client navigation via each API             | 100 µs (p25 94 / p75 106)      | **56 µs** (p25 53 / p75 57) |

JARL resolves a URL against the whole table ~3.6× faster than `matchRoutes`, which re-flattens
and ranks the config on every call. JARL's leaf reads stop at the first match instead, so the
measured URLs deliberately cycle an early, middle and late hit plus a miss rather than sampling
only the cheap case.

The reverse holds for navigation: react-router's _stateful_ router navigates ~1.8× faster than a
route-atom write, because the router reuses its matching state while every atom write re-derives
the location and re-reads the leaf atoms. That gap is if anything understated — `router.navigate`
runs react-router's whole data-router state machine, which is strictly more work than the atom
write it beats.

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

- No real-browser timings — no layout, paint or input latency; navigation cost is library work
  only.
- Data loading is unexercised on both sides.
- One app shape and one route-table shape; deep nesting, splats or query-heavy routing may rank
  differently.
