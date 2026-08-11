import { Link, Route } from "jarl-react";
import { basicRoutingDemoRoute, basicRoutingDemoPageRoute } from "../router/routes";
import ownSource from "./BasicRoutingDemo.tsx?raw";

/**
 * A tiny "Home" / "About" demo app nested under /demos/basic-routing, entirely wired
 * up with the vendored v2-style atoms (staticRouteAtom/paramRouteAtom + Link/Route) -
 * this is the live counterpart to the write-up on the History page. Mirrors the shape
 * of the old demo/source/demos/basicRouting example (Home + About + not-found), but
 * built on atoms instead of a RoutingProvider route table.
 */
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

export const BasicRoutingDemo = () => (
  <>
    <h1>Live demo: basic routing (atoms)</h1>
    <div className="demo-box">
      <DemoNav />
      <Route on={basicRoutingDemoRoute} exact>
        <DemoHome />
      </Route>
      <Route on={basicRoutingDemoPageRoute} exact>
        {({ page }) => (page === "about" ? <DemoAbout /> : <DemoNotFound page={page} />)}
      </Route>
    </div>
    <details className="source">
      <summary>View source</summary>
      <pre>
        <code>{ownSource}</code>
      </pre>
    </details>
  </>
);

export default BasicRoutingDemo;
