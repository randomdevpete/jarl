import { SetStateAction, WritableAtom, atom } from "jotai/vanilla";
import { atomWithLocation } from "jotai-location";
import { allowsNavigation, withApprovedNavigation } from "./navigationGuardAtom";

// Declared rather than imported: jotai-location exports its structurally identical `Location`
// only from jotai-location/dist/atomWithLocation, so locationAtom's inferred type can't be
// named when emitting declarations (TS2883).
/** The location every route atom reads: pathname, query params and hash. */
export type JarlLocation = {
  pathname?: string;
  searchParams?: URLSearchParams;
  hash?: string;
};

const isBrowser = typeof window !== "undefined";

// jotai-location's own default listens to popstate alone, which stays silent for a
// `history.pushState` from outside jarl. The Navigation API reports every same-document
// navigation however it was made.
const subscribe = (callback: () => void) => {
  const navigation = window.navigation as Navigation | undefined;
  if (!navigation) {
    window.addEventListener("popstate", callback);
    return () => window.removeEventListener("popstate", callback);
  }
  navigation.addEventListener("currententrychange", callback);
  return () => navigation.removeEventListener("currententrychange", callback);
};

/**
 * jotai-location's history-bound location atom. Constructing and *reading* this
 * is safe under Node (it falls back to an empty location when there's no
 * `window`); only writing is not, since the write path calls
 * `history.pushState`/`replaceState` directly.
 */
const historyLocationAtom = atomWithLocation({ subscribe });

/**
 * Server-side location override. Stays `null` in the browser, where
 * `historyLocationAtom` is the single source of truth.
 */
const serverLocationAtom = atom<JarlLocation | null>(null);

/**
 * The location every route atom reads from, and the seam where SSR/SSG is made
 * possible.
 *
 * In a browser reads and writes go straight through to jotai-location, so navigation
 * still drives real `history.pushState`/`replaceState`, and every same-document
 * navigation - including one made from outside jarl - is picked up. A write is subject
 * to any guard registered with `enforceNavigationGuards`, and does nothing if one blocks it.
 *
 * Under Node there is no `window` to push history onto, so writes are captured
 * in plain jotai state instead and reads prefer that captured value. That makes
 * a route seedable per-render on the server:
 *
 * ```ts
 * const store = createStore();
 * store.set(locationAtom, { pathname: "/docs", searchParams: new URLSearchParams() });
 * renderToString(<Provider store={store}><App /></Provider>);
 * ```
 *
 * Each store keeps its own override, so prerendering many routes in one process
 * can't leak location between them.
 */
export const locationAtom: WritableAtom<JarlLocation, [SetStateAction<JarlLocation>, { replace?: boolean }?], void> =
  atom(
    (get) => {
      if (!isBrowser) {
        const override = get(serverLocationAtom);
        if (override) return override;
      }
      return get(historyLocationAtom);
    },
    (get, set, update: SetStateAction<JarlLocation>, options?: { replace?: boolean }) => {
      if (isBrowser) {
        // The one write every in-app navigation funnels through, so guarding it here vetoes a
        // route atom write before jotai-location commits it - no history entry, no rollback.
        if (!allowsNavigation(get)) return;
        withApprovedNavigation(() => set(historyLocationAtom, update, options));
        return;
      }
      const current = get(serverLocationAtom) ?? get(historyLocationAtom);
      set(
        serverLocationAtom,
        typeof update === "function" ? (update as (prev: JarlLocation) => JarlLocation)(current) : update,
      );
    },
  );
