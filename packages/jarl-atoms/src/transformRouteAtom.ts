import { Getter, atom } from "jotai/vanilla";
import { DefaultParams, RouteAtom } from "./types";

/**
 * Reshapes a route's matched `values` into a different shape, and back again for
 * `reverse`/write - composable middleware over a chain of route atoms.
 */
export const transformRouteAtom = <T extends DefaultParams, Return extends DefaultParams>(
  parentAtom: RouteAtom<T>,
  getter: (values: T, get: Getter) => Return | undefined,
  setter: (values: Return, get: Getter) => T,
): RouteAtom<Return> => {
  const reverse = (get: Getter) => (values: Return) => {
    const transformed = setter(values, get);
    const parent = get(parentAtom);
    return parent.reverse(transformed);
  };
  return atom(
    (get) => {
      const parent = get(parentAtom);
      let transformed: Return | undefined;
      if (!parent.match || !(transformed = getter(parent.values, get))) {
        return {
          match: false,
          exact: false,
          values: undefined,
          reverse: reverse(get),
        };
      }
      return { ...parent, values: transformed, reverse: reverse(get) };
    },
    (get, set, action, navOptions) => {
      const transformed = setter(action, get);
      set(parentAtom, transformed, navOptions);
    },
  );
};
