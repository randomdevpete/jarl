import styled from "@emotion/styled";
import { theme } from "../theme";
import { blogRoutingDemoRoute } from "../router/routes";
import { BlogRoutingApp } from "../demos/BlogRoutingApp";
import demoSource from "../demos/BlogRoutingApp.tsx?raw";

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
    font-weight: 600;
  }
`;

const SourceDisclosure = styled.details`
  summary {
    cursor: pointer;
    color: ${theme.fgMuted};
    margin: 1rem 0 0.5rem;
  }

  pre {
    background: ${theme.codeBg};
    color: ${theme.accent};
    border: 1px solid ${theme.border};
    border-radius: 6px;
    padding: 1rem;
    overflow-x: auto;
    font-size: 0.85em;
    font-family: ${theme.fontMono};
  }
`;

export const BlogRoutingDemo = () => (
  <>
    <h1>Live demo: blog routing (atoms)</h1>
    <DemoBox>
      <BlogRoutingApp rootAtom={blogRoutingDemoRoute} />
    </DemoBox>
    <SourceDisclosure>
      <summary>View source</summary>
      <pre>
        <code>{demoSource}</code>
      </pre>
    </SourceDisclosure>
  </>
);

export default BlogRoutingDemo;
