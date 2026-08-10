import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Route } from "../Route";
import { aboutAtom, teamAtom, userAtom } from "./fixtures";

const goTo = (path: string) => window.history.pushState(null, "", path);

beforeEach(() => {
    goTo("/");
});

describe("Route", () => {
    it("renders its children when the route matches", () => {
        goTo("/about");
        render(<Route on={aboutAtom}>About page</Route>);
        expect(screen.getByText("About page")).toBeInTheDocument();
    });

    it("renders nothing when the route does not match", () => {
        goTo("/users");
        const { container } = render(<Route on={aboutAtom}>About page</Route>);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders when an ancestor matches but exact is not set", () => {
        goTo("/about/team");
        render(<Route on={aboutAtom}>About branch</Route>);
        expect(screen.getByText("About branch")).toBeInTheDocument();
    });

    it("does not render when exact is set but only an ancestor matches", () => {
        goTo("/about/team");
        const { container } = render(
            <Route on={aboutAtom} exact>
                About exact
            </Route>,
        );
        expect(container).toBeEmptyDOMElement();
    });

    it("renders when exact is set and this is the leaf match", () => {
        goTo("/about/team");
        render(
            <Route on={teamAtom} exact>
                Team page
            </Route>,
        );
        expect(screen.getByText("Team page")).toBeInTheDocument();
    });

    it("passes matched param values to function children", () => {
        goTo("/users/42");
        render(<Route on={userAtom}>{(values) => <div>User {values.id}</div>}</Route>);
        expect(screen.getByText("User 42")).toBeInTheDocument();
    });
});
