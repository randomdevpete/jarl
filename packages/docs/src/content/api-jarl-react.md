# API Reference: jarl-react

The core exports of `jarl-react` - the React bindings (components + hooks) built on top of the
framework-agnostic route atoms in [`jarl-atoms`](/api/jarl-atoms). `jarl-react` does not
re-export `jarl-atoms`: get your route atoms from `jarl-atoms` and these components/hooks from
`jarl-react`. See the [v1 History](/history) page for how JARL's original
`RoutingProvider`/`routing()` HOC API worked, and why the atomic model replaced it.

Every hook here takes a route atom as its first argument. `jarl-react` also re-exports jotai's
own `useAtom`, `useAtomValue` and `useSetAtom`, so composing directly with a route atom (or with
`jarl-atoms` primitives like `asyncRouteAtom`) never needs a separate direct dependency on
`jotai`.

The reference below is generated from the doc comments on each export. Components list only
their own props: `Link` also forwards any other standard anchor prop (`className`, `target`, ...)
straight through to the rendered element.
