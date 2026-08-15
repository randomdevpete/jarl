import { routeAtom } from "./routeAtom";
import { DefaultParams, RouteOptions } from "./types";

/**
 * Binds one dynamic path segment to a named value: `paramRouteAtom("productId", { parent:
 * products })` matches `/products/:productId` and yields `{ productId: "123" }`.
 */
export const paramRouteAtom = <T extends string, Parent extends DefaultParams>(
  name: T,
  options?: RouteOptions<Parent>,
) => {
  return routeAtom(
    // Only match when there is actually a segment here to bind the param to.
    // Returning a value unconditionally would make a param route match its
    // parent's own path (e.g. `paramRouteAtom("docName", { parent: docs })`
    // matching "/docs" itself, exactly, with `docName: undefined`), so a
    // section index and its param child would both render.
    (path) => (path ? ({ [name]: path } as { [key in T]: string }) : undefined),
    (values) => values[name],
    options,
  );
};
