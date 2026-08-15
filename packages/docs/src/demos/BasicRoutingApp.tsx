import { Link, Route } from "jarl-react";
import { basicRoutingDemoRoute, basicRoutingDemoPageRoute } from "../router/routes";

const DemoNav = () => (
  <nav>
    <Link route={basicRoutingDemoRoute} to={{}} exact>
      Home
    </Link>
    <Link route={basicRoutingDemoPageRoute} to={{ page: "about" }} exact>
      About
    </Link>
  </nav>
);

const DemoHome = () => (
  <div>
    <h3>Home</h3>
    <p>This nested page is rendered by a plain top-level route atom match (exact on /demos/basic-routing).</p>
  </div>
);

const DemoAbout = () => (
  <div>
    <h3>About</h3>
    <p>
      This page is rendered by <code>basicRoutingDemoPageRoute</code>, a <code>paramRouteAtom</code> child of{" "}
      <code>basicRoutingDemoRoute</code>, matched when its value is <code>&quot;about&quot;</code>.
    </p>
  </div>
);

const DemoNotFound = ({ page }: { page: string }) => (
  <div>
    <h3>Not found</h3>
    <p>
      No demo page named &ldquo;{page}&rdquo;. Try{" "}
      <Link route={basicRoutingDemoRoute} to={{}}>
        Home
      </Link>
      .
    </p>
  </div>
);

/**
 * Nested "Home"/"About" router built from staticRouteAtom/paramRouteAtom and the
 * atoms-based Link/Route components.
 */
export const BasicRoutingApp = () => (
  <>
    <DemoNav />
    <Route on={basicRoutingDemoRoute} exact>
      <DemoHome />
    </Route>
    <Route on={basicRoutingDemoPageRoute} exact>
      {({ page }) => (page === "about" ? <DemoAbout /> : <DemoNotFound page={page} />)}
    </Route>
  </>
);

export default BasicRoutingApp;
