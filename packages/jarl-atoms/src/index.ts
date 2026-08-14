// jarl-atoms: the framework-agnostic half of JARL. Everything here is plain
// jotai atoms with no React dependency (note routeAtom.ts imports from
// "jotai/vanilla" specifically, not the "jotai" root entry, which would pull
// in jotai/react). The React components and hooks that consume these atoms
// live in the sibling `jarl-react` package.
export * from "./routeAtom";
export * from "./notAtom";
export * from "./href";
export * from "./queryAtom";
export * from "./redirectAtom";
export * from "./resolvedAtom";
