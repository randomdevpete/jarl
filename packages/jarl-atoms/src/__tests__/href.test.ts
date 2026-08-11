import { describe, expect, it } from "vitest";
import { appendQueryParam, joinHref, normalizePathname, splitHref } from "../href";

describe("normalizePathname", () => {
  it("removes duplicate slashes and trailing slash", () => {
    expect(normalizePathname("foo//bar/")).toBe("/foo/bar");
  });

  it("keeps the root path as just /", () => {
    expect(normalizePathname("/")).toBe("/");
  });
});

describe("splitHref", () => {
  it("splits a path with a query string", () => {
    const [pathname, searchParams] = splitHref("/foo/bar?a=1&b=2");
    expect(pathname).toBe("/foo/bar");
    expect(searchParams.get("a")).toBe("1");
    expect(searchParams.get("b")).toBe("2");
  });

  it("returns empty search params when there's no query string", () => {
    const [pathname, searchParams] = splitHref("/foo/bar");
    expect(pathname).toBe("/foo/bar");
    expect(Array.from(searchParams.keys())).toEqual([]);
  });
});

describe("joinHref", () => {
  it("joins a pathname and search params", () => {
    const params = new URLSearchParams();
    params.set("a", "1");
    expect(joinHref("/foo", params)).toBe("/foo?a=1");
  });

  it("omits the ? when there are no params", () => {
    expect(joinHref("/foo", new URLSearchParams())).toBe("/foo");
  });
});

describe("appendQueryParam", () => {
  it("adds a new query param to a bare path", () => {
    expect(appendQueryParam("/foo", "a", "1")).toBe("/foo?a=1");
  });

  it("adds to an existing query string", () => {
    expect(appendQueryParam("/foo?a=1", "b", "2")).toBe("/foo?a=1&b=2");
  });

  it("overwrites an existing key", () => {
    expect(appendQueryParam("/foo?a=1", "a", "2")).toBe("/foo?a=2");
  });

  it("removes the key when value is undefined", () => {
    expect(appendQueryParam("/foo?a=1&b=2", "a", undefined)).toBe("/foo?b=2");
  });

  it("drops the ? entirely once the last key is removed", () => {
    expect(appendQueryParam("/foo?a=1", "a", undefined)).toBe("/foo");
  });
});
