import { Link } from "jarl-react";
import { basicRoutingDemoRoute } from "../router/routes";

export const DemosIndex = () => (
    <>
        <h1>Live demos</h1>
        <p>
            These demos are built on the v2 draft&apos;s jotai-atoms router (vendored and adapted for this site - see
            the{" "}
            <Link route={basicRoutingDemoRoute} to={{}}>
                demo below
            </Link>
            , and the <a href="/history">v1 History</a> page for why v1 didn&apos;t work this way).
        </p>
        <ul className="demo-index">
            <li>
                <Link route={basicRoutingDemoRoute} to={{}}>
                    Basic routing
                </Link>{" "}
                &mdash; a nested router-within-a-router built from <code>staticRouteAtom</code>/
                <code>paramRouteAtom</code> and the atoms-based <code>Link</code>/<code>Route</code> components.
            </li>
        </ul>
    </>
);

export default DemosIndex;
