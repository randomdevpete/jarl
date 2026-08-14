import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Route } from "../Route";
import { Switch } from "../Switch";
import { aboutAtom, teamAtom, usersAtom, userAtom, newUserAtom } from "./fixtures";

const goTo = (path: string) => window.history.pushState(null, "", path);

beforeEach(() => {
  goTo("/");
});

describe("Switch", () => {
  it("renders the matching route and nothing else", () => {
    goTo("/about");
    render(
      <Switch>
        <Route on={aboutAtom} exact>
          About page
        </Route>
        <Route on={usersAtom} exact>
          Users page
        </Route>
      </Switch>,
    );
    expect(screen.getByText("About page")).toBeInTheDocument();
    expect(screen.queryByText("Users page")).not.toBeInTheDocument();
  });

  it("renders the fallback when no route matches", () => {
    goTo("/nowhere");
    render(
      <Switch fallback={<div>Not found</div>}>
        <Route on={aboutAtom} exact>
          About page
        </Route>
        <Route on={usersAtom} exact>
          Users page
        </Route>
      </Switch>,
    );
    expect(screen.getByText("Not found")).toBeInTheDocument();
  });

  it("renders nothing when no route matches and there is no fallback", () => {
    goTo("/nowhere");
    const { container } = render(
      <Switch>
        <Route on={aboutAtom} exact>
          About page
        </Route>
      </Switch>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("gives the earlier child precedence when two routes both match", () => {
    goTo("/users/new");
    const { rerender } = render(
      <Switch>
        <Route on={newUserAtom} exact>
          New user
        </Route>
        <Route on={userAtom} exact>
          {({ id }) => <div>User {id}</div>}
        </Route>
      </Switch>,
    );
    expect(screen.getByText("New user")).toBeInTheDocument();
    expect(screen.queryByText("User new")).not.toBeInTheDocument();

    rerender(
      <Switch>
        <Route on={userAtom} exact>
          {({ id }) => <div>User {id}</div>}
        </Route>
        <Route on={newUserAtom} exact>
          New user
        </Route>
      </Switch>,
    );
    expect(screen.getByText("User new")).toBeInTheDocument();
  });

  it("judges each child by its own exact prop", () => {
    goTo("/about/team");
    render(
      <Switch>
        <Route on={aboutAtom}>About branch</Route>
        <Route on={teamAtom} exact>
          Team page
        </Route>
      </Switch>,
    );
    expect(screen.getByText("About branch")).toBeInTheDocument();
    expect(screen.queryByText("Team page")).not.toBeInTheDocument();
  });

  it("passes matched param values to function children", () => {
    goTo("/users/42");
    render(
      <Switch>
        <Route on={userAtom} exact>
          {({ id }) => <div>User {id}</div>}
        </Route>
      </Switch>,
    );
    expect(screen.getByText("User 42")).toBeInTheDocument();
  });

  it("follows navigation", () => {
    render(
      <Switch fallback={<div>Not found</div>}>
        <Route on={aboutAtom} exact>
          About page
        </Route>
        <Route on={usersAtom} exact>
          Users page
        </Route>
      </Switch>,
    );
    expect(screen.getByText("Not found")).toBeInTheDocument();
    goTo("/users");
    fireEvent.popState(window);
    expect(screen.getByText("Users page")).toBeInTheDocument();
    expect(screen.queryByText("Not found")).not.toBeInTheDocument();
  });

  it("ignores children excluded by a condition", () => {
    const Routes = ({ withUsers }: { withUsers: boolean }) => (
      <Switch fallback={<div>Not found</div>}>
        {withUsers && (
          <Route on={usersAtom} exact>
            Users page
          </Route>
        )}
        <Route on={aboutAtom} exact>
          About page
        </Route>
      </Switch>
    );

    goTo("/users");
    const { rerender } = render(<Routes withUsers={false} />);
    expect(screen.getByText("Not found")).toBeInTheDocument();

    rerender(<Routes withUsers />);
    expect(screen.getByText("Users page")).toBeInTheDocument();
  });

  it("throws when a child is not a route", () => {
    // React logs the thrown render error before it propagates; silenced so the run stays readable.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <Switch>
          <>
            <Route on={aboutAtom} exact>
              About page
            </Route>
          </>
        </Switch>,
      ),
    ).toThrow(/must be <Route> elements/);
    consoleError.mockRestore();
  });

  describe("nested in a route", () => {
    const UsersSection = () => (
      <Switch fallback={<div>No such user page</div>}>
        <Route on={usersAtom} exact>
          Users index
        </Route>
        <Route on={userAtom} exact>
          {({ id }) => <div>User {id}</div>}
        </Route>
      </Switch>
    );

    const App = () => (
      <Switch fallback={<div>Not found</div>}>
        <Route on={aboutAtom} exact>
          About page
        </Route>
        <Route on={usersAtom}>
          <UsersSection />
        </Route>
      </Switch>
    );

    it("renders the branch index", () => {
      goTo("/users");
      render(<App />);
      expect(screen.getByText("Users index")).toBeInTheDocument();
    });

    it("renders a branch leaf", () => {
      goTo("/users/42");
      render(<App />);
      expect(screen.getByText("User 42")).toBeInTheDocument();
    });

    it("falls back within the branch, not at the top level", () => {
      goTo("/users/42/settings");
      render(<App />);
      expect(screen.getByText("No such user page")).toBeInTheDocument();
      expect(screen.queryByText("Not found")).not.toBeInTheDocument();
    });

    it("falls back at the top level outside the branch", () => {
      goTo("/nowhere");
      render(<App />);
      expect(screen.getByText("Not found")).toBeInTheDocument();
      expect(screen.queryByText("No such user page")).not.toBeInTheDocument();
    });
  });
});
