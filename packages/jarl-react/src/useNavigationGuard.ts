import { useEffect } from "react";
import { useStore } from "jotai";
import { NavigationGuardAtom, enforceNavigationGuards } from "jarl-atoms";

/**
 * Enforces a navigation guard atom for as long as the calling component is mounted - the React
 * binding for `enforceNavigationGuards`, which documents what a guard can and cannot veto. Call
 * it once per guard, wherever the state that guard reads is owned.
 *
 * The guard atom must be stable across renders - defined at module scope, or memoised - since a
 * new one on every render re-registers on every render.
 */
export function useNavigationGuard(guard: NavigationGuardAtom): void {
  const store = useStore();
  useEffect(() => enforceNavigationGuards(store, [guard]), [store, guard]);
}
