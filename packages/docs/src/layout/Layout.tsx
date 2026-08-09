import type { ReactNode } from "react";
import { Link } from "jarl-react";
import {
    homeRoute,
    docsSectionRoute,
    apiSectionRoute,
    changelogRoute,
    historyRoute,
    demosIndexRoute
} from "../router/routes";

const navLinks = (
    <>
        <Link route={homeRoute} to={{}} exact>
            Home
        </Link>
        <Link route={docsSectionRoute} to={{}}>
            Docs
        </Link>
        <Link route={apiSectionRoute} to={{}}>
            API
        </Link>
        <Link route={demosIndexRoute} to={{}}>
            Demos
        </Link>
        <Link route={changelogRoute} to={{}}>
            Changelog
        </Link>
        <Link route={historyRoute} to={{}}>
            v1 History
        </Link>
    </>
);

export const Layout = ({ children }: { children: ReactNode }) => (
    <div className="page">
        <header className="site-header">
            <div className="site-header__inner">
                <Link route={homeRoute} to={{}} className="brand">
                    JARL
                </Link>
                <nav className="main-nav">{navLinks}</nav>
            </div>
        </header>
        <main className="site-main">{children}</main>
        <footer className="site-footer">
            <p>
                JARL: Atomic Routing Library &mdash;{" "}
                <a href="https://github.com/randomdevpete/jarl">GitHub</a>
            </p>
        </footer>
    </div>
);

export default Layout;
