import { Atom, Getter } from "jotai/vanilla";
import { DefaultParams, RouteAtom } from "./routeAtom";
import { Redirect } from "./redirectAtom";
import type { Store } from "./redirectAtom";
export type Resolver<T extends DefaultParams, Data> = (values: T, get: Getter) => Promise<Data | Redirect>;
/**
 * Runs `resolver` whenever `routeAtom` matches, resolving to `undefined`
 * when it doesn't. Because this is a plain async atom, consumers get to
 * choose how they want to observe it: `useAtomValue` + Suspense, jotai/utils
 * `loadable()` for a non-suspending pending/hasData/hasError view (the
 * closest atomic analogue of v1's synchronous `resolved` object), or simply
 * `await store.get(resolvedAtom)` outside React entirely.
 */
export declare const resolvedAtom: <T extends DefaultParams, Data>(routeAtom: RouteAtom<T>, resolver: Resolver<T, Data>) => Atom<Promise<Data | Redirect | undefined>>;
/**
 * Wires one or more resolvedAtoms up so that if their resolver ever produces
 * a Redirect, it's actually followed (history.replace to the redirect
 * target) - the async-loading equivalent of `followRedirects`. Mirrors v1's
 * `doNavigation` treating a resolve's Redirect result as an abort-and-
 * redirect (RoutingProvider.js: "Convert redirect into a Promise rejection").
 * Returns an unsubscribe function.
 */
export declare const followResolvedRedirects: (store: Store, resolvedAtoms: ReadonlyArray<Atom<Promise<unknown>>>) => (() => void);
