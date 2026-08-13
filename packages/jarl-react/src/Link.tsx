import { AnchorHTMLAttributes, ElementType, ReactNode } from "react";
import { DefaultParams, RouteAtom } from "jarl-atoms";
import { useLink, UseLinkOptions } from "./hooks";

/** What `Link`'s function-as-child form receives. */
export type LinkChildrenRenderProps = {
  href: string;
  active: boolean;
  onClick: () => void;
};

/** `Link`'s own props, plus any standard anchor attribute, which is forwarded to the rendered element. */
export type LinkProps<T extends DefaultParams> = {
  /** The route atom this link points at. */
  route: RouteAtom<T>;
  /** Param values to reverse into a path for this route. */
  to?: T;
  /** Extra class name applied only while this link is active. */
  activeClassName?: string;
  /** Element (or component) to render as. Ignored when `children` is a function. */
  element?: ElementType;
  /**
   * Standard React children, or a render-prop function receiving `{ href, active, onClick }` for
   * full control over rendering. Prefer `useLink` directly for markup that isn't anchor-shaped.
   */
  children?: ReactNode | ((props: LinkChildrenRenderProps) => ReactNode);
} & UseLinkOptions &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href" | "onClick">;

/**
 * Renders an anchor (or `element`) linking to a route atom + param values.
 * Clicking navigates by writing to the route atom instead of a full page
 * load. Hooks-first: `Link` is a thin wrapper over `useLink`, so anything
 * `Link` can do is also available directly via the hook.
 */
export const Link = <T extends DefaultParams>({
  route: routeAtom,
  to = {} as T,
  children,
  activeClassName,
  className,
  element = "a",
  exact,
  ...rest
}: LinkProps<T>) => {
  const { href, active, onClick } = useLink(routeAtom, to, { exact });

  if (typeof children === "function") {
    return <>{children({ href, active, onClick })}</>;
  }

  const Element = element;
  const combinedClassName =
    activeClassName && active ? [className, activeClassName].filter(Boolean).join(" ") : className;

  return (
    <Element
      {...rest}
      href={href}
      className={combinedClassName}
      onClick={onClick}
      // Also expose active state as an attribute, so consumers can style
      // active links in pure CSS (`a[data-active] { ... }`) without having to
      // thread an `activeClassName` through every link. Omitted entirely when
      // inactive so the attribute selector doesn't match.
      data-active={active || undefined}
    >
      {children}
    </Element>
  );
};
