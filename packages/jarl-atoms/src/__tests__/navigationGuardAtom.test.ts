import { atom, createStore } from "jotai/vanilla";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { locationAtom } from "../locationAtom";
import { enforceNavigationGuards, navigationGuardAtom } from "../navigationGuardAtom";
import { staticRouteAtom } from "../staticRouteAtom";

const aboutAtom = staticRouteAtom("about");
const contactAtom = staticRouteAtom("contact");

const dirtyAtom = atom(false);
const unsavedGuard = navigationGuardAtom((get) => (get(dirtyAtom) ? "Unsaved edits. Leave anyway?" : null));

const confirm = vi.spyOn(window, "confirm");

const store = () => {
  const created = createStore();
  created.set(aboutAtom, {});
  return created;
};

beforeEach(() => {
  confirm.mockReset();
  confirm.mockReturnValue(true);
});

describe("guarding an in-app navigation", () => {
  it("lets a route atom write through while no guard blocks", () => {
    const current = store();
    const unsubscribe = enforceNavigationGuards(current, [unsavedGuard]);

    current.set(contactAtom, {});

    expect(current.get(locationAtom).pathname).toBe("/contact");
    expect(confirm).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("leaves the location untouched when the user declines the confirmation", () => {
    const current = store();
    const unsubscribe = enforceNavigationGuards(current, [unsavedGuard]);
    current.set(dirtyAtom, true);
    confirm.mockReturnValue(false);

    current.set(contactAtom, {});

    expect(confirm).toHaveBeenCalledWith("Unsaved edits. Leave anyway?");
    expect(current.get(locationAtom).pathname).toBe("/about");
    unsubscribe();
  });

  it("navigates when the user accepts the confirmation", () => {
    const current = store();
    const unsubscribe = enforceNavigationGuards(current, [unsavedGuard]);
    current.set(dirtyAtom, true);

    current.set(contactAtom, {});

    expect(current.get(locationAtom).pathname).toBe("/contact");
    unsubscribe();
  });

  it("guards a direct location atom write, not just a route atom one", () => {
    const current = store();
    const unsubscribe = enforceNavigationGuards(current, [unsavedGuard]);
    current.set(dirtyAtom, true);
    confirm.mockReturnValue(false);

    current.set(locationAtom, { pathname: "/contact", searchParams: new URLSearchParams() });

    expect(current.get(locationAtom).pathname).toBe("/about");
    unsubscribe();
  });

  it("stops guarding once unsubscribed", () => {
    const current = store();
    const unsubscribe = enforceNavigationGuards(current, [unsavedGuard]);
    current.set(dirtyAtom, true);
    confirm.mockReturnValue(false);

    unsubscribe();
    current.set(contactAtom, {});

    expect(confirm).not.toHaveBeenCalled();
    expect(current.get(locationAtom).pathname).toBe("/contact");
  });

  it("guards each store separately", () => {
    const guarded = store();
    const unguarded = store();
    const unsubscribe = enforceNavigationGuards(guarded, [unsavedGuard]);
    guarded.set(dirtyAtom, true);
    unguarded.set(dirtyAtom, true);
    confirm.mockReturnValue(false);

    unguarded.set(contactAtom, {});

    expect(confirm).not.toHaveBeenCalled();
    expect(unguarded.get(locationAtom).pathname).toBe("/contact");
    unsubscribe();
  });
});

describe("composing guards", () => {
  it("confirms with the first guard that blocks", () => {
    const current = store();
    const first = navigationGuardAtom(() => null);
    const second = navigationGuardAtom(() => "second");
    const third = navigationGuardAtom(() => "third");
    const unsubscribe = enforceNavigationGuards(current, [first, second, third]);

    current.set(contactAtom, {});

    expect(confirm).toHaveBeenCalledExactlyOnceWith("second");
    unsubscribe();
  });
});

// jsdom implements neither the Navigation API nor its wiring into history.pushState, so both are
// stood up by hand: a bare EventTarget as `window.navigation`, and a pushState that fires a
// `navigate` event at it and honours a cancellation, exactly as a browser does.
describe("guarding a navigation made outside jarl", () => {
  let navigation: EventTarget;
  let pushState: typeof history.pushState;

  const navigateEvent = ({ sameDocument = true, cancelable = true } = {}) => {
    const event = new Event("navigate", { cancelable });
    Object.defineProperty(event, "destination", { value: { sameDocument } });
    return event;
  };

  beforeEach(() => {
    navigation = new EventTarget();
    Object.defineProperty(window, "navigation", { value: navigation, configurable: true });
    pushState = history.pushState;
    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      const event = navigateEvent();
      navigation.dispatchEvent(event);
      if (!event.defaultPrevented) pushState.apply(history, args);
    };
  });

  afterEach(() => {
    history.pushState = pushState;
    Reflect.deleteProperty(window, "navigation");
  });

  it("cancels a same-document navigation while a guard blocks", () => {
    const current = store();
    const unsubscribe = enforceNavigationGuards(current, [unsavedGuard]);
    current.set(dirtyAtom, true);
    confirm.mockReturnValue(false);

    const event = navigateEvent();
    navigation.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    unsubscribe();
  });

  it("lets a same-document navigation through once the user accepts", () => {
    const current = store();
    const unsubscribe = enforceNavigationGuards(current, [unsavedGuard]);
    current.set(dirtyAtom, true);

    const event = navigateEvent();
    navigation.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    unsubscribe();
  });

  it("leaves a navigation out of the document to beforeunload", () => {
    const current = store();
    const unsubscribe = enforceNavigationGuards(current, [unsavedGuard]);
    current.set(dirtyAtom, true);
    confirm.mockReturnValue(false);

    const event = navigateEvent({ sameDocument: false });
    navigation.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("does not touch a navigation the browser will not let it cancel", () => {
    const current = store();
    const unsubscribe = enforceNavigationGuards(current, [unsavedGuard]);
    current.set(dirtyAtom, true);
    confirm.mockReturnValue(false);

    const event = navigateEvent({ cancelable: false });
    navigation.dispatchEvent(event);

    expect(confirm).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("confirms once for an in-app navigation, not again for the navigate event it fires", () => {
    const current = store();
    const unsubscribe = enforceNavigationGuards(current, [unsavedGuard]);
    current.set(dirtyAtom, true);

    current.set(contactAtom, {});

    expect(confirm).toHaveBeenCalledOnce();
    expect(current.get(locationAtom).pathname).toBe("/contact");
    unsubscribe();
  });
});

describe("guarding a document unload", () => {
  const dispatchBeforeUnload = () => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event;
  };

  it("asks the browser to prompt while a guard blocks", () => {
    const current = store();
    const unsubscribe = enforceNavigationGuards(current, [unsavedGuard]);
    current.set(dirtyAtom, true);

    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);
    // The browser shows its own wording, so the guard's message is never confirmed here.
    expect(confirm).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("stays out of the way while no guard blocks", () => {
    const current = store();
    const unsubscribe = enforceNavigationGuards(current, [unsavedGuard]);

    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
    unsubscribe();
  });
});
