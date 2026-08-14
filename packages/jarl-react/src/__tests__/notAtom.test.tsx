import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useAtomValue } from "jotai";
import { notAtom } from "jarl-atoms";
import { Route } from "../Route";
import { aboutAtom, usersAtom } from "./fixtures";

const goTo = (path: string) => window.history.pushState(null, "", path);

beforeEach(() => {
  goTo("/");
});

const notFoundAtom = notAtom(aboutAtom, usersAtom);

const NotFound = () => (useAtomValue(notFoundAtom) ? <div>Not found</div> : null);

describe("notAtom", () => {
  it("renders a catch-all when no sibling route matches", () => {
    goTo("/nowhere");
    render(
      <>
        <Route on={aboutAtom}>About page</Route>
        <Route on={usersAtom}>Users page</Route>
        <NotFound />
      </>,
    );
    expect(screen.getByText("Not found")).toBeInTheDocument();
  });

  it("stays hidden alongside a matching route", () => {
    goTo("/about");
    render(
      <>
        <Route on={aboutAtom}>About page</Route>
        <Route on={usersAtom}>Users page</Route>
        <NotFound />
      </>,
    );
    expect(screen.getByText("About page")).toBeInTheDocument();
    expect(screen.queryByText("Not found")).not.toBeInTheDocument();
  });
});
