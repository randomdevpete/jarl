import { createStore } from "jotai/vanilla";
import { beforeEach, describe, expect, it } from "vitest";
import { locationAtom } from "../locationAtom";
import { parseQuery, queryAtom, queryParamRouteAtom, stringifyQuery } from "../queryAtom";
import { staticRouteAtom } from "../staticRouteAtom";

const seed = (store: ReturnType<typeof createStore>, pathname: string, search = "") => {
  store.set(locationAtom, { pathname, searchParams: new URLSearchParams(search) });
};

describe("parseQuery / stringifyQuery", () => {
  it("parses simple key/value pairs", () => {
    expect(parseQuery("a=1&b=2")).toEqual({ a: "1", b: "2" });
  });

  it("collects repeated keys into an array", () => {
    expect(parseQuery("tag=a&tag=b")).toEqual({ tag: ["a", "b"] });
  });

  it("round-trips through stringifyQuery", () => {
    const query = { a: "1", tag: ["x", "y"] };
    const restrung = stringifyQuery(query);
    expect(parseQuery(restrung)).toEqual(query);
  });

  it("omits undefined keys when stringifying", () => {
    expect(stringifyQuery({ a: "1", b: undefined })).toBe("a=1");
  });
});

describe("queryAtom", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("reads the current query as a plain object", () => {
    seed(store, "/foo", "a=1&b=2");
    expect(store.get(queryAtom)).toEqual({ a: "1", b: "2" });
  });

  it("writing replaces the whole query string", () => {
    seed(store, "/foo", "a=1");
    store.set(queryAtom, { c: "3" });
    expect(store.get(locationAtom).searchParams?.toString()).toBe("c=3");
    // pathname is preserved
    expect(store.get(locationAtom).pathname).toBe("/foo");
  });
});

describe("queryParamRouteAtom", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("does not match when its parent route doesn't match", () => {
    const fooAtom = staticRouteAtom("foo");
    const pageAtom = queryParamRouteAtom("page", { parent: fooAtom });
    seed(store, "/bar", "page=2");
    expect(store.get(pageAtom).match).toBe(false);
  });

  it("matches and captures the query value once the parent matches", () => {
    const fooAtom = staticRouteAtom("foo");
    const pageAtom = queryParamRouteAtom("page", { parent: fooAtom });
    seed(store, "/foo", "page=2");
    const result = store.get(pageAtom);
    expect(result.match).toBe(true);
    if (result.match) {
      expect(result.values).toEqual({ page: "2" });
    }
  });

  it("value is undefined (not a non-match) when the param is absent and not required", () => {
    const fooAtom = staticRouteAtom("foo");
    const pageAtom = queryParamRouteAtom("page", { parent: fooAtom });
    seed(store, "/foo");
    const result = store.get(pageAtom);
    expect(result.match).toBe(true);
    if (result.match) {
      expect(result.values.page).toBeUndefined();
    }
  });

  it("required: true makes a missing param a non-match", () => {
    const fooAtom = staticRouteAtom("foo");
    const pageAtom = queryParamRouteAtom("page", { parent: fooAtom, required: true });
    seed(store, "/foo");
    expect(store.get(pageAtom).match).toBe(false);
  });

  it("reverse() combines the parent path with this query param", () => {
    const fooAtom = staticRouteAtom("foo");
    const pageAtom = queryParamRouteAtom("page", { parent: fooAtom });
    seed(store, "/foo");
    const href = store.get(pageAtom).reverse({ page: "3" });
    expect(href).toBe("/foo?page=3");
  });

  it("writing navigates to the parent path with the query param set", () => {
    const fooAtom = staticRouteAtom("foo");
    const pageAtom = queryParamRouteAtom("page", { parent: fooAtom });
    seed(store, "/");
    store.set(pageAtom, { page: "5" });
    expect(store.get(locationAtom).pathname).toBe("/foo");
    expect(store.get(locationAtom).searchParams?.get("page")).toBe("5");
  });

  it("path matching underneath is unaffected by a composed query param", () => {
    const fooAtom = staticRouteAtom("foo");
    const pageAtom = queryParamRouteAtom("page", { parent: fooAtom });
    seed(store, "/foo", "page=2");
    const result = store.get(pageAtom);
    expect(result.match).toBe(true);
    if (result.match) {
      // No path segments were consumed by the query param
      expect(result.exact).toBe(true);
    }
  });
});
