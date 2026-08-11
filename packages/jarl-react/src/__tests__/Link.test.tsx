import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Link } from "../Link";
import { aboutAtom, teamAtom } from "./fixtures";

const goTo = (path: string) => window.history.pushState(null, "", path);

beforeEach(() => {
  goTo("/");
});

describe("Link", () => {
  it("renders an anchor with the resolved href", () => {
    render(
      <Link route={aboutAtom} to={{}}>
        About
      </Link>,
    );
    const link = screen.getByRole("link", { name: "About" });
    expect(link).toHaveAttribute("href", "/about");
  });

  it("navigates on click without a full page load, preventing default", () => {
    render(
      <Link route={aboutAtom} to={{}}>
        About
      </Link>,
    );
    const link = screen.getByRole("link", { name: "About" });
    const clickEvent = fireEvent.click(link);
    // fireEvent.click returns false when preventDefault() was called
    expect(clickEvent).toBe(false);
    expect(window.location.pathname).toBe("/about");
  });

  it("applies activeClassName only while active", () => {
    goTo("/about");
    render(
      <Link route={aboutAtom} to={{}} className="link" activeClassName="is-active">
        About
      </Link>,
    );
    expect(screen.getByRole("link", { name: "About" })).toHaveClass("link", "is-active");
  });

  it("does not apply activeClassName when inactive", () => {
    goTo("/");
    render(
      <Link route={aboutAtom} to={{}} className="link" activeClassName="is-active">
        About
      </Link>,
    );
    const link = screen.getByRole("link", { name: "About" });
    expect(link).toHaveClass("link");
    expect(link).not.toHaveClass("is-active");
  });

  it("respects the exact option for active state", () => {
    goTo("/about/team");
    render(
      <Link route={aboutAtom} to={{}} exact activeClassName="is-active">
        About
      </Link>,
    );
    expect(screen.getByRole("link", { name: "About" })).not.toHaveClass("is-active");
  });

  it("renders a custom element type", () => {
    render(
      <Link route={aboutAtom} to={{}} element="button">
        About
      </Link>,
    );
    expect(screen.getByRole("button", { name: "About" })).toBeInTheDocument();
  });

  it("supports the function-as-child render-prop API", () => {
    goTo("/about/team");
    render(
      <Link route={teamAtom} to={{}}>
        {({ href, active, onClick }) => (
          <span data-testid="render-prop" data-href={href} data-active={active}>
            <button onClick={onClick}>Team</button>
          </span>
        )}
      </Link>,
    );
    const wrapper = screen.getByTestId("render-prop");
    expect(wrapper).toHaveAttribute("data-href", "/about/team");
    expect(wrapper).toHaveAttribute("data-active", "true");
  });

  it("navigates via the render-prop onClick", () => {
    goTo("/");
    render(
      <Link route={aboutAtom} to={{}}>
        {({ onClick }) => <button onClick={() => onClick()}>About</button>}
      </Link>,
    );
    fireEvent.click(screen.getByRole("button", { name: "About" }));
    expect(window.location.pathname).toBe("/about");
  });
});
