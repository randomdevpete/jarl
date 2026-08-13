import { renderToString } from "react-dom/server";
import { Provider, createStore } from "jotai";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { followRedirects, followResolvedRedirects, isRedirect, locationAtom, redirect, resolvedAtom } from "jarl-atoms";
import { Route, useAtomValue } from "jarl-react";
import App from "./App";
import { aboutRoute, movedRedirect, productData, productRoute, rootAtom, searchQueryRoute } from "./routes";

type Store = ReturnType<typeof createStore>;

const seed = (store: Store, pathname: string, search = "") =>
  store.set(locationAtom, { pathname, searchParams: new URLSearchParams(search) });

const renderAt = (store: Store, pathname: string, search = "") => {
  window.history.replaceState(null, "", `${pathname}${search}`);
  seed(store, pathname, search);
  return render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
};

let store: Store;

beforeEach(() => {
  store = createStore();
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("routing", () => {
  it("renders the route matching the current location", () => {
    renderAt(store, "/about");
    expect(screen.getByRole("heading")).toHaveTextContent("About");
  });

  it("renders param values from a nested param route", () => {
    renderAt(store, "/products/123");
    expect(screen.getByRole("heading")).toHaveTextContent("Product 123");
    expect(screen.getByTestId("products-active")).toHaveTextContent("true");
  });

  it("reverses route atoms into link hrefs", () => {
    renderAt(store, "/");
    expect(screen.getByRole("link", { name: "Product 123" })).toHaveAttribute("href", "/products/123");
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
  });

  it("marks the active link and only the active link", () => {
    renderAt(store, "/about");
    expect(screen.getByRole("link", { name: "About" })).toHaveClass("active");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveClass("active");
  });
});

describe("navigation", () => {
  it("navigates on link click without a page load", async () => {
    renderAt(store, "/");
    await userEvent.click(screen.getByRole("link", { name: "Product 123" }));
    expect(store.get(locationAtom).pathname).toBe("/products/123");
    expect(screen.getByRole("heading")).toHaveTextContent("Product 123");
  });

  it("navigates via useNavigate, writing a query param", async () => {
    renderAt(store, "/");
    await userEvent.type(screen.getByLabelText("search"), "widgets");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(store.get(searchQueryRoute).values?.q).toBe("widgets");
    expect(store.get(locationAtom).searchParams?.get("q")).toBe("widgets");
  });
});

describe("redirects", () => {
  it("follows a matched redirectAtom to its target", () => {
    seed(store, "/moved");
    const unsubscribe = followRedirects(store, [movedRedirect]);
    expect(store.get(locationAtom).pathname).toBe("/about");
    expect(store.get(aboutRoute).match).toBe(true);
    unsubscribe();
  });

  it("follows a Redirect returned from a resolver", async () => {
    const gated = resolvedAtom(productRoute, async () => redirect("/about"));
    seed(store, "/products/999");
    const unsubscribe = followResolvedRedirects(store, [gated]);
    expect(isRedirect(await store.get(gated))).toBe(true);
    await Promise.resolve();
    expect(store.get(locationAtom).pathname).toBe("/about");
    unsubscribe();
  });
});

describe("atoms", () => {
  it("resolves async route data via resolvedAtom", async () => {
    seed(store, "/products/42");
    await expect(store.get(productData)).resolves.toEqual({ productId: "42", title: "Product 42" });
  });

  it("resolves to undefined when the route does not match", async () => {
    seed(store, "/about");
    await expect(store.get(productData)).resolves.toBeUndefined();
  });

  it("re-exports jotai's hooks so a consumer needs no direct jotai import", () => {
    const Probe = () => <span>{String(useAtomValue(rootAtom).match)}</span>;
    seed(store, "/");
    render(
      <Provider store={store}>
        <Probe />
      </Provider>,
    );
    expect(screen.getByText("true")).toBeInTheDocument();
  });
});

describe("server rendering", () => {
  it("renders the route seeded into a per-render store", () => {
    const ssrStore = createStore();
    ssrStore.set(locationAtom, { pathname: "/products/7", searchParams: new URLSearchParams() });
    const html = renderToString(
      <Provider store={ssrStore}>
        <Route on={productRoute}>{({ productId }) => <h1>{`Product ${productId}`}</h1>}</Route>
      </Provider>,
    );
    expect(html).toBe("<h1>Product 7</h1>");
  });
});
