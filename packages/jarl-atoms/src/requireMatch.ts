import { DefaultParams, MatchedRoute, RouteReturn } from "./types";

/**
 * Narrows a route read to its matched branch, throwing if it did not match. For the reads whose
 * match is guaranteed by something the types can't see - an atom read only from inside a route
 * that has already matched, or a chain binding nothing but optional params - where narrowing on
 * `match` would mean inventing a fallback that can never be reached. Narrow on `match` instead
 * wherever a miss is a case worth handling. `name` labels the route in the thrown message.
 */
export const requireMatch = <T extends DefaultParams>(route: RouteReturn<T>, name = "route"): MatchedRoute<T> => {
  if (!route.match) {
    throw new Error(`${name} does not match the current location`);
  }
  return route;
};
