import { SetStateAction, WritableAtom, atom } from "jotai/vanilla";
import { atomWithLocation } from "jotai-location";

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

/**
 * jotai-location's history-bound location atom. Constructing and *reading* this
 * is safe under Node (it falls back to an empty location when there's no
 * `window`); only writing is not, since the write path calls
 * `history.pushState`/`replaceState` directly.
 */
const historyLocationAtom = atomWithLocation();

/**
 * Server-side location override. Stays `null` in the browser, where
 * `historyLocationAtom` is the single source of truth.
 */
const serverLocationAtom = atom<JarlLocation | null>(null);

/**
 * The location every route atom reads from, and the seam where SSR/SSG is made
 * possible.
 *
 * In a browser this is exactly `atomWithLocation()`: reads and writes go
 * straight through to jotai-location, so navigation still drives real
 * `history.pushState`/`replaceState` and responds to popstate.
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
        set(historyLocationAtom, update, options);
        return;
      }
      const current = get(serverLocationAtom) ?? get(historyLocationAtom);
      set(
        serverLocationAtom,
        typeof update === "function" ? (update as (prev: JarlLocation) => JarlLocation)(current) : update,
      );
    },
  );
