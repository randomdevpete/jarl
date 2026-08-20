import { createStore } from "jotai/vanilla";
import { describe, expect, expectTypeOf, it } from "vitest";
import { locationAtom } from "../locationAtom";
import { queryParamRouteAtom } from "../queryAtom";
import { requireMatch } from "../requireMatch";
import { staticRouteAtom } from "../staticRouteAtom";
import { MatchedRoute, RouteReturn } from "../types";

type SortValues = { readonly sort: string | undefined };

const seed = (store: ReturnType<typeof createStore>, pathname: string, search = "") => {
  store.set(locationAtom, { pathname, searchParams: new URLSearchParams(search) });
};

const readSort = (search: string): RouteReturn<SortValues> => {
  const store = createStore();
  seed(store, "/", search);
  return store.get(queryParamRouteAtom("sort"));
};

describe("requireMatch", () => {
  it("returns a matched read unchanged", () => {
    const store = createStore();
    seed(store, "/about");

    const route = requireMatch(store.get(staticRouteAtom("about")));

    expect(route.exact).toBe(true);
    expect(route.rest.path).toEqual([]);
  });

  it("throws on a read that did not match, naming the route", () => {
    const store = createStore();
    seed(store, "/elsewhere");

    expect(() => requireMatch(store.get(staticRouteAtom("about")), "aboutRoute")).toThrow(
      "aboutRoute does not match the current location",
    );
  });

  it("narrows the read to its matched branch", () => {
    const read = readSort("sort=-price");

    const matched = requireMatch(read);

    expectTypeOf(matched).toEqualTypeOf<MatchedRoute<SortValues>>();
    expectTypeOf(matched.values).toEqualTypeOf<SortValues>();
    expect(matched.values.sort).toBe("-price");
  });

  it("removes the fallback an unnarrowed read forces on the caller", () => {
    const read = readSort("sort=-price");

    // @ts-expect-error - `values` is `SortValues | undefined` until the match is narrowed
    const withoutRequireMatch: SortValues = read.values;
    const withRequireMatch: SortValues = requireMatch(read).values;

    expect(withRequireMatch).toEqual(withoutRequireMatch);
  });

  it("still matches when the optional param it binds is absent", () => {
    const { values } = requireMatch(readSort(""));

    expect(values.sort).toBeUndefined();
  });
});
