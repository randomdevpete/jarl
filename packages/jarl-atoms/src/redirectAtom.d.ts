import { Getter, createStore } from "jotai/vanilla";
import { Path } from "./href";
import { DefaultParams, RouteAtom, RouteOptions } from "./routeAtom";
/** Marks a value as "actually, redirect to this instead". Returned from a
 * resolvedAtom loader to defer a redirect decision until after data loads,
 * mirroring v1's `resolve: () => redirect(...)`. */
export declare class Redirect {
    readonly to: Path;
    constructor(to: Path);
}
export declare const redirect: (to: Path) => Redirect;
export declare const isRedirect: (value: unknown) => value is Redirect;
/**
 * A RouteAtom-shaped leaf that matches whenever its parent matches (it
 * swallows any remaining path, like v1's redirect routes have no children of
 * their own), and whose `reverse()`/write resolve to the redirect target
 * rather than to itself. `to` may be a static path or a function of `get`
 * for a target computed from other atoms (other matched params, auth state
 * threaded in via `context`, etc.)
 *
 * On its own, matching a redirectAtom doesn't navigate anywhere - see
 * `followRedirects` below to actually make that happen.
 */
export declare const redirectAtom: <Parent extends DefaultParams = DefaultParams>(to: Path | ((get: Getter) => Path), options?: RouteOptions<Parent>) => RouteAtom<Parent>;
export type Store = ReturnType<typeof createStore>;
/**
 * Wires one or more redirectAtoms up to actually navigate: subscribes to
 * each, and whenever it starts matching, writes to it (triggering the
 * replace-navigation defined above). Call once per redirectAtom you want
 * "live" (e.g. from the React bindings package's root Provider), analogous
 * to v1's RoutingProvider automatically following redirects found during
 * doNavigation. Returns an unsubscribe function.
 */
export declare const followRedirects: (store: Store, redirectAtoms: ReadonlyArray<RouteAtom<any>>) => (() => void);
