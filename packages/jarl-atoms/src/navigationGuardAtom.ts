import { Atom, Getter, atom } from "jotai/vanilla";
import type { Store } from "./redirectAtom";

/** A guard's verdict: the message to confirm a navigation with, or `null` to let it through. */
export type NavigationGuardAtom = Atom<string | null>;

/**
 * A guard that vetoes navigations while its condition holds - typically an unsaved-edits prompt:
 *
 * ```ts
 * const unsavedGuard = navigationGuardAtom((get) =>
 *   get(formDirtyAtom) ? "You have unsaved edits. Leave anyway?" : null,
 * );
 * ```
 *
 * Returning a string blocks the navigation behind a `window.confirm` carrying that message;
 * returning `null` allows it. Reading one is pure - `enforceNavigationGuards` is the effect that
 * makes it bite, and documents which navigations can and cannot be vetoed.
 */
export const navigationGuardAtom = (guard: (get: Getter) => string | null): NavigationGuardAtom => atom(guard);

const enforcedGuardsAtom = atom<ReadonlyArray<NavigationGuardAtom>>([]);

// Wrapped in an object because a bare function set into a primitive atom is taken as an updater.
const guardListenerAtom = atom<{ remove: () => void } | null>(null);

const blockingMessage = (get: Getter): string | null => {
  for (const guard of get(enforcedGuardsAtom)) {
    const message = get(guard);
    if (message !== null) return message;
  }
  return null;
};

/** Whether the enforced guards allow a navigation now, confirming with the user if one blocks. */
export const allowsNavigation = (get: Getter): boolean => {
  const message = blockingMessage(get);
  return message === null || window.confirm(message);
};

// Module-level rather than per-store: window.navigation and history are one global per page, so
// this only needs to track "was the in-flight pushState ours", not which store made it.
let approvingOwnNavigation = false;

/**
 * Runs a navigation whose guards have already been consulted. The `navigate` event its
 * `history.pushState` fires would otherwise consult them a second time and confirm twice.
 */
export const withApprovedNavigation = (navigate: () => void): void => {
  approvingOwnNavigation = true;
  try {
    navigate();
  } finally {
    approvingOwnNavigation = false;
  }
};

const listen = (store: Store): { remove: () => void } => {
  if (typeof window === "undefined") return { remove: () => {} };

  const onNavigate = (event: NavigateEvent) => {
    // Anything leaving the document is beforeunload's job below: asking here as well would
    // prompt twice for one navigation, and the browser's own dialog is unavoidable anyway.
    if (approvingOwnNavigation || !event.cancelable || !event.destination.sameDocument) return;
    if (!allowsNavigation(store.get)) event.preventDefault();
  };
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (blockingMessage(store.get) !== null) event.preventDefault();
  };

  const navigation = window.navigation as Navigation | undefined;
  navigation?.addEventListener("navigate", onNavigate);
  window.addEventListener("beforeunload", onBeforeUnload);
  return {
    remove: () => {
      navigation?.removeEventListener("navigate", onNavigate);
      window.removeEventListener("beforeunload", onBeforeUnload);
    },
  };
};

/**
 * Makes navigation guard atoms actually block, for the given store. Call once near the root of an
 * app - or per component via `jarl-react`'s `useNavigationGuard` - for every guard you want live.
 * Guards compose: the first that returns a message wins. Returns an unsubscribe function.
 *
 * Nothing commits before a guard has had its say, so a blocked navigation leaves no history
 * entry and the URL never flickers. What each navigation source gets:
 *
 * - In-app navigation - `Link`, `useNavigate`, a route atom or `locationAtom` written directly -
 *   is vetoed at `locationAtom`'s write, and needs no browser support.
 * - A same-document navigation from outside jarl - third-party `history.pushState`, a fragment
 *   change, same-document back/forward - is vetoed through the
 *   [Navigation API](https://developer.mozilla.org/docs/Web/API/Navigation_API), and goes
 *   unguarded in a browser that lacks it.
 * - Leaving the document - reload, a cross-document link, closing the tab - gets `beforeunload`,
 *   so the browser shows its own wording instead of the guard's message.
 *
 * Two things the platform refuses to let anyone veto, as anti-trapping measures: a cross-document
 * back/forward, and a back/forward repeated without interacting with the page in between, since
 * cancelling one consumes the activation that permits cancelling. A navigation the browser starts
 * for itself - the URL bar, a bookmark, the reload button - reaches `beforeunload` and nothing else.
 */
export const enforceNavigationGuards = (store: Store, guards: ReadonlyArray<NavigationGuardAtom>): (() => void) => {
  store.set(enforcedGuardsAtom, (enforced) => [...enforced, ...guards]);
  if (!store.get(guardListenerAtom)) {
    store.set(guardListenerAtom, listen(store));
  }
  return () => {
    store.set(enforcedGuardsAtom, (enforced) => enforced.filter((guard) => !guards.includes(guard)));
    if (store.get(enforcedGuardsAtom).length > 0) return;
    store.get(guardListenerAtom)?.remove();
    store.set(guardListenerAtom, null);
  };
};
