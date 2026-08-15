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
import { GitHubMark } from "./GitHubMark";
import { DiscordMark } from "./DiscordMark";
import { NpmMark } from "./NpmMark";
import {
  Brand,
  MainNav,
  Page,
  SiteFooter,
  SiteHeader,
  SiteHeaderInner,
  SiteMain,
  Toolbar,
  ToolbarLink,
} from "./Layout.styles";

const githubRepoUrl = "https://github.com/randomdevpete/jarl";
// Existing community invite, also linked from the README badges.
const discordInviteUrl = "https://discord.gg/6yGq39rJ63";
const npmPackageUrl = "https://www.npmjs.com/package/jarl-react";

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
        <Toolbar>
          <ToolbarLink href={npmPackageUrl} aria-label="jarl-react on npm">
            <NpmMark />
          </ToolbarLink>
          <ToolbarLink href={discordInviteUrl} aria-label="Join the JARL Discord">
            <DiscordMark />
          </ToolbarLink>
          <ToolbarLink href={githubRepoUrl} aria-label="JARL on GitHub">
            <GitHubMark />
          </ToolbarLink>
        </Toolbar>
      </SiteHeaderInner>
    </SiteHeader>
    <SiteMain>{children}</SiteMain>
    <SiteFooter>
      <p>
        JARL: Atomic Routing Library &mdash; <a href={githubRepoUrl}>GitHub</a>
      </p>
    </SiteFooter>
  </Page>
);

export default Layout;
