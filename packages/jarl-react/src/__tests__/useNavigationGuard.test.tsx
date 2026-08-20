import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { atom, getDefaultStore } from "jotai";
import { locationAtom, navigationGuardAtom } from "jarl-atoms";
import { useNavigate } from "../hooks";
import { useNavigationGuard } from "../useNavigationGuard";
import { aboutAtom } from "./fixtures";

const unsavedAtom = atom(false);
const unsavedGuard = navigationGuardAtom((get) => (get(unsavedAtom) ? "Unsaved edits" : null));

const confirm = vi.spyOn(window, "confirm");

const Guard = () => {
  useNavigationGuard(unsavedGuard);
  return null;
};

const Editor = ({ guarded }: { guarded: boolean }) => {
  const navigate = useNavigate(aboutAtom);
  return (
    <div>
      {guarded && <Guard />}
      <button onClick={() => navigate({})}>Go</button>
    </div>
  );
};

beforeEach(() => {
  window.history.pushState(null, "", "/");
  confirm.mockReset();
  confirm.mockReturnValue(false);
  getDefaultStore().set(unsavedAtom, true);
});

describe("useNavigationGuard", () => {
  it("blocks a navigation while the guarding component is mounted", () => {
    render(<Editor guarded />);

    fireEvent.click(screen.getByText("Go"));

    expect(confirm).toHaveBeenCalledWith("Unsaved edits");
    expect(getDefaultStore().get(locationAtom).pathname).toBe("/");
  });

  it("stops blocking once the guarding component unmounts", () => {
    const { rerender } = render(<Editor guarded />);

    rerender(<Editor guarded={false} />);
    fireEvent.click(screen.getByText("Go"));

    expect(confirm).not.toHaveBeenCalled();
    expect(getDefaultStore().get(locationAtom).pathname).toBe("/about");
  });
});
