import { Link } from "jarl-react";
import { homeRoute } from "../router/routes";

export const NotFound = () => (
    <>
        <h1>Page not found</h1>
        <p>
            Nothing matched this URL. Back to{" "}
            <Link route={homeRoute} to={{}}>
                Home
            </Link>
            .
        </p>
    </>
);

export default NotFound;
