import { ReactNode } from "react";
import styled from "@emotion/styled";
import { theme } from "../theme";
import { githubRepoUrl } from "../layout/Layout";
import CodeBlock from "./CodeBlock";

const DemoBox = styled.div`
  border: 1px solid ${theme.border};
  border-radius: 8px;
  padding: 1.5rem;
  background: ${theme.bgAlt};
  margin: 1.5rem 0;

  nav {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid ${theme.border};
    padding-bottom: 0.75rem;
  }

  nav a[data-active] {
    color: ${theme.accentStrong};
    font-weight: 700;
  }
`;

const SourceHeading = styled.h2`
  color: ${theme.fgMuted};
  margin: 1rem 0 0.5rem;

  a {
    color: inherit;
  }
`;

export type DemoPageProps = {
  title: string;
  /** Repo-relative path to the demo's own source, e.g. "packages/docs/src/demos/DataGridApp.tsx" -
   * shown as the source section's heading (just the filename) and linked to it on GitHub. */
  sourcePath: string;
  /** The demo's own source, imported with Vite's `?raw`. Always shown - it's the point of a demo. */
  source: string;
  /** The running demo. */
  children: ReactNode;
};

/** The frame every live demo page shares: heading, bordered demo box, and its source. */
export const DemoPage = ({ title, sourcePath, source, children }: DemoPageProps) => (
  <>
    <h1>{title}</h1>
    <DemoBox>{children}</DemoBox>
    <SourceHeading>
      <a href={`${githubRepoUrl}/blob/master/${sourcePath}`}>{sourcePath.split("/").pop()}</a>
    </SourceHeading>
    <CodeBlock code={source} lang="tsx" sourcePath={sourcePath} />
  </>
);

export default DemoPage;
