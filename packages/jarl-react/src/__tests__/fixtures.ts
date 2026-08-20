import { staticRouteAtom, paramRouteAtom } from "jarl-atoms";

// Shared route atom fixtures used across the binding tests:
//   /               -> rootRoute (imported directly by tests that need it)
//   /about          -> aboutAtom
//   /about/team     -> teamAtom
//   /users          -> usersAtom
//   /users/new      -> newUserAtom  (overlaps userAtom: both match /users/new)
//   /users/:id      -> userAtom
export const aboutAtom = staticRouteAtom("about");
export const teamAtom = staticRouteAtom("team", { parent: aboutAtom });
export const usersAtom = staticRouteAtom("users");
export const newUserAtom = staticRouteAtom("new", { parent: usersAtom });
export const userAtom = paramRouteAtom("id", { parent: usersAtom });
