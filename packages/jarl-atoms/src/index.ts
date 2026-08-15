// jarl-atoms: the framework-agnostic half of JARL. Everything here is plain
// jotai atoms with no React dependency, importing from "jotai/vanilla"
// specifically rather than the "jotai" root entry, which would pull in
// jotai/react. The React components and hooks that consume these atoms
// live in the sibling `jarl-react` package.
export * from "./types";
export * from "./locationAtom";
export * from "./routeAtom";
export * from "./rootAtom";
export * from "./staticRouteAtom";
export * from "./paramRouteAtom";
export * from "./transformRouteAtom";
export * from "./notAtom";
export * from "./href";
export * from "./queryAtom";
export * from "./redirectAtom";
export * from "./resolvedAtom";
