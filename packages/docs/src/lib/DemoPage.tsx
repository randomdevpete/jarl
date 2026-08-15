import { ReactNode } from "react";
import styled from "@emotion/styled";
import { theme } from "../theme";
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

const SourceDisclosure = styled.details`
  summary {
    cursor: pointer;
    color: ${theme.fgMuted};
    margin: 1rem 0 0.5rem;
  }
`;

export type DemoPageProps = {
  title: string;
  /** The demo's own source, imported with Vite's `?raw`, shown under a "View source" disclosure. */
  source: string;
  /** The running demo. */
  children: ReactNode;
};

/** The frame every live demo page shares: heading, bordered demo box, and its source. */
export const DemoPage = ({ title, source, children }: DemoPageProps) => (
  <>
    <h1>{title}</h1>
    <DemoBox>{children}</DemoBox>
    <SourceDisclosure>
      <summary>View source</summary>
      <CodeBlock code={source} lang="tsx" />
    </SourceDisclosure>
  </>
);

export default DemoPage;
