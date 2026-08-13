import type { ReactNode } from "react";
import { Link } from "jarl-react";
import {
  homeRoute,
  docsSectionRoute,
  apiSectionRoute,
  changelogRoute,
  historyRoute,
  demosIndexRoute,
} from "../router/routes";
import { VikingHelmetMark } from "./VikingHelmetMark";
import { Brand, MainNav, Page, SiteFooter, SiteHeader, SiteHeaderInner, SiteMain } from "./Layout.styles";

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
  <Page>
    <SiteHeader>
      <SiteHeaderInner>
        <Brand route={homeRoute} to={{}}>
          <VikingHelmetMark />
          JARL
        </Brand>
        <MainNav>{navLinks}</MainNav>
      </SiteHeaderInner>
    </SiteHeader>
    <SiteMain>{children}</SiteMain>
    <SiteFooter>
      <p>
        JARL: Atomic Routing Library &mdash; <a href="https://github.com/randomdevpete/jarl">GitHub</a>
      </p>
    </SiteFooter>
  </Page>
);

export default Layout;
