import { Children, ReactNode, isValidElement, useMemo, useRef } from "react";
import { atom, useAtomValue } from "jotai";
import { DefaultParams, RouteAtom } from "jarl-atoms";
import { isActive } from "./isActive";

type SwitchChildProps = { on: RouteAtom<DefaultParams>; exact?: boolean };

export type SwitchProps = {
  /** `<Route>` elements, in precedence order. */
  children?: ReactNode;
  /** Rendered when no child route is active - a catch-all for this level. */
  fallback?: ReactNode;
};

const routeProps = (child: ReactNode): SwitchChildProps => {
  if (!isValidElement<SwitchChildProps>(child) || !("on" in child.props)) {
    throw new Error("<Switch> children must be <Route> elements; a fragment or wrapper hides its routes from it.");
  }
  const { on, exact } = child.props;
  return { on, exact };
};

// The derived atom below must survive across renders or useAtomValue
// resubscribes on every one, so what it closes over is identity-cached.
const useStableProps = (props: SwitchChildProps[]): SwitchChildProps[] => {
  const cached = useRef(props);
  const unchanged =
    cached.current.length === props.length &&
    cached.current.every((prev, index) => prev.on === props[index].on && prev.exact === props[index].exact);
  if (!unchanged) {
    cached.current = props;
  }
  return cached.current;
};

/**
 * Renders only the first of its `<Route>` children that is currently active,
 * or `fallback` when none of them is.
 *
 * Children must be `<Route>` elements; conditional children (`{flag && <Route
 * ... />}`) are fine, but a fragment or wrapper around a group of routes hides
 * them and throws.
 */
export const Switch = ({ children, fallback }: SwitchProps) => {
  const elements = Children.toArray(children);
  const routes = useStableProps(elements.map(routeProps));
  const activeIndexAtom = useMemo(
    () => atom((get) => routes.findIndex(({ on, exact }) => isActive(get(on), exact))),
    [routes],
  );
  const activeIndex = useAtomValue(activeIndexAtom);
  return <>{activeIndex === -1 ? fallback : elements[activeIndex]}</>;
};
