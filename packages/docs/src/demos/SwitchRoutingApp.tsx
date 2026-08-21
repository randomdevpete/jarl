import { atom, useAtomValue, useSetAtom } from "jotai";
import { createRootAtom, paramRouteAtom, transformRouteAtom } from "jarl-atoms";
import {
  SwitchRoutingPage,
  isSwitchRoutingPage,
  switchRoutingPageLabels,
  switchRoutingPages,
} from "./switchRoutingPages";

// The page this demo is mounted on, so everything below it is a plain module-level atom.
const switchRoutingRoot = createRootAtom({ basePath: "/demos/switch-routing" });

// One segment out of a fixed set: a paramRouteAtom narrowed by a transformRouteAtom, which also
// types the value as the union the switch below needs.
const pageRoute = transformRouteAtom<{ page: string }, { page: SwitchRoutingPage }>(
  paramRouteAtom("page", { parent: switchRoutingRoot }),
  ({ page }) => (isSwitchRoutingPage(page) ? { page } : undefined),
  ({ page }) => ({ page }),
);

const currentPageAtom = atom((get): SwitchRoutingPage | "not-found" => {
  const page = get(pageRoute);
  if (page.match) return page.values.page;
  return get(switchRoutingRoot).exact ? "home" : "not-found";
});

const HomePage = () => (
  <div>
    <h3>Home</h3>
    <p>
      Nothing here is a <code>&lt;Route&gt;</code>. One route atom holds which page the URL names, and a plain{" "}
      <code>switch</code> on that value picks the component to render.
    </p>
  </div>
);

const AboutPage = () => (
  <div>
    <h3>About</h3>
    <p>
      The buttons above navigated here by writing to that same atom &mdash; <code>{`navigate({ page: "about" })`}</code>{" "}
      &mdash; rather than by following a <code>&lt;Link&gt;</code>. Writing it set the URL; reading it back is what
      moved the switch.
    </p>
  </div>
);

const ContactPage = () => (
  <div>
    <h3>Contact</h3>
    <p>
      Back and forward need nothing extra: the atom derives its value from the location, so the browser&apos;s history
      moves the switch exactly the way a button does.
    </p>
  </div>
);

const NotFoundPage = () => (
  <div>
    <h3>No such page</h3>
    <p>
      The page route matches only the segments named above, so any other URL under this demo leaves it unmatched and the
      switch falls through to this case.
    </p>
  </div>
);

const pageView = (page: SwitchRoutingPage | "not-found") => {
  switch (page) {
    case "home":
      return <HomePage />;
    case "about":
      return <AboutPage />;
    case "contact":
      return <ContactPage />;
    case "not-found":
      return <NotFoundPage />;
  }
};

const SwitchRoutingNav = ({
  current,
  onNavigate,
}: {
  current: SwitchRoutingPage | "not-found";
  onNavigate: (page: SwitchRoutingPage) => void;
}) => (
  <nav>
    {switchRoutingPages.map((page) => (
      <button key={page} type="button" disabled={page === current} onClick={() => onNavigate(page)}>
        {switchRoutingPageLabels[page]}
      </button>
    ))}
  </nav>
);

/**
 * Self-contained demo of the least routing machinery that still routes: a `switch` on one route
 * atom's value picks the page, and navigation writes to that atom directly.
 */
export const SwitchRoutingApp = () => {
  const page = useAtomValue(currentPageAtom);
  const navigate = useSetAtom(pageRoute);

  return (
    <>
      <SwitchRoutingNav current={page} onNavigate={(next) => navigate({ page: next })} />
      {pageView(page)}
    </>
  );
};

export default SwitchRoutingApp;
