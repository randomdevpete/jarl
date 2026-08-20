import { ReactElement } from "react";
import { describe, it, expect, beforeEach, expectTypeOf, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { locationAtom, rootRouteAtom } from "jarl-atoms";
import { useRoute, useRequiredRoute, useNavigate, useIsActive, useHref, useLink } from "../hooks";
import { aboutAtom, teamAtom, userAtom, usersAtom } from "./fixtures";

const goTo = (path: string) => window.history.pushState(null, "", path);

beforeEach(() => {
  goTo("/");
});

describe("useRoute", () => {
  it("reflects whether the route atom currently matches", () => {
    goTo("/about");
    const Probe = () => {
      const route = useRoute(aboutAtom);
      return <div data-testid="probe">{String(route.match)}</div>;
    };
    render(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("true");
  });

  it("reports no match on an unrelated path", () => {
    goTo("/users");
    const Probe = () => {
      const route = useRoute(aboutAtom);
      return <div data-testid="probe">{String(route.match)}</div>;
    };
    render(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("false");
  });
});

describe("useRequiredRoute", () => {
  // Seeded through a store of its own rather than `goTo`: these assert on the very first render,
  // and a bare `history.pushState` only reaches the location atom once it is mounted and listening.
  const renderAt = (path: string, ui: ReactElement) => {
    const store = createStore();
    store.set(locationAtom, { pathname: path, searchParams: new URLSearchParams() });
    return render(<Provider store={store}>{ui}</Provider>);
  };

  it("gives the matched values with no undefined left to narrow away", () => {
    const Probe = () => {
      const { values, exact } = useRequiredRoute(userAtom);
      expectTypeOf(values.id).toEqualTypeOf<string>();
      return <div data-testid="probe">{`${values.id}/${exact}`}</div>;
    };
    renderAt("/users/42", <Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("42/true");
  });

  it("throws when the route it was promised would match does not", () => {
    const Probe = () => <div>{useRequiredRoute(userAtom, "userAtom").values.id}</div>;
    // React logs the error on its way back out; only the rethrow is worth asserting on.
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderAt("/about", <Probe />)).toThrow("userAtom does not match the current location");
    errorLog.mockRestore();
  });
});

describe("useNavigate", () => {
  it("pushes a new location when called", () => {
    goTo("/");
    const Probe = () => {
      const navigate = useNavigate(aboutAtom);
      const route = useRoute(aboutAtom);
      return (
        <div>
          <div data-testid="match">{String(route.match)}</div>
          <button onClick={() => navigate({})}>Go</button>
        </div>
      );
    };
    render(<Probe />);
    expect(screen.getByTestId("match")).toHaveTextContent("false");
    fireEvent.click(screen.getByText("Go"));
    expect(screen.getByTestId("match")).toHaveTextContent("true");
    expect(window.location.pathname).toBe("/about");
  });
});

describe("useIsActive", () => {
  it("matches an ancestor route by default, but not with exact", () => {
    goTo("/about/team");
    const Probe = () => {
      const active = useIsActive(aboutAtom);
      const exactActive = useIsActive(aboutAtom, { exact: true });
      return (
        <div>
          <div data-testid="active">{String(active)}</div>
          <div data-testid="exact">{String(exactActive)}</div>
        </div>
      );
    };
    render(<Probe />);
    expect(screen.getByTestId("active")).toHaveTextContent("true");
    expect(screen.getByTestId("exact")).toHaveTextContent("false");
  });

  it("is exact for a leaf match", () => {
    goTo("/about/team");
    const Probe = () => {
      const exactActive = useIsActive(teamAtom, { exact: true });
      return <div data-testid="exact">{String(exactActive)}</div>;
    };
    render(<Probe />);
    expect(screen.getByTestId("exact")).toHaveTextContent("true");
  });

  it("treats root as active only at '/'", () => {
    goTo("/about");
    const Probe = () => {
      const active = useIsActive(rootRouteAtom, { exact: true });
      return <div data-testid="root">{String(active)}</div>;
    };
    render(<Probe />);
    expect(screen.getByTestId("root")).toHaveTextContent("false");
  });
});

describe("useHref", () => {
  it("reverses a route atom's params into a path", () => {
    goTo("/");
    const Probe = () => {
      const href = useHref(userAtom, { id: "42" });
      return <div data-testid="href">{href}</div>;
    };
    render(<Probe />);
    expect(screen.getByTestId("href")).toHaveTextContent("/users/42");
  });

  it("reverses a static route with no params", () => {
    goTo("/");
    const Probe = () => {
      const href = useHref(usersAtom, {});
      return <div data-testid="href">{href}</div>;
    };
    render(<Probe />);
    expect(screen.getByTestId("href")).toHaveTextContent("/users");
  });
});

describe("useLink", () => {
  it("combines href, active and a working onClick", () => {
    goTo("/");
    const Probe = () => {
      const { href, active, onClick } = useLink(aboutAtom, {});
      return (
        <a data-testid="link" href={href} data-active={active} onClick={onClick}>
          About
        </a>
      );
    };
    render(<Probe />);
    const link = screen.getByTestId("link");
    expect(link).toHaveAttribute("href", "/about");
    expect(link).toHaveAttribute("data-active", "false");
    fireEvent.click(link);
    expect(window.location.pathname).toBe("/about");
  });
});
