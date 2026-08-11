import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { rootAtom } from "jarl-atoms";
import { useRoute, useNavigate, useIsActive, useHref, useLink } from "../hooks";
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
      const active = useIsActive(rootAtom, { exact: true });
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
